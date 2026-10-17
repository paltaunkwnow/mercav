import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { actorFields, getPosContext, posError } from "@/lib/pos/server";
import { computeSale } from "@/lib/pos/pricing";
import { currencyDecimals, formatMoney, roundMoney } from "@/lib/pos/money";
import { getBusinessType, getUnit, ORDER_TYPES_WITH_CHANNEL, type OrderTypeId } from "@/lib/pos/business";

const saleSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), quantity: z.number().positive().max(100000) }))
    .min(1)
    .max(300),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  discountValue: z.number().min(0).default(0),
  orderType: z.string().max(20),
  deliveryChannel: z.string().max(40).nullish(),
  payments: z
    .array(
      z.object({
        method: z.enum(["CASH", "CARD", "TRANSFER", "QR", "OTHER"]),
        amount: z.number().positive(),
        reference: z.string().max(80).nullish(),
      }),
    )
    .min(1)
    .max(6),
  clientNit: z.string().max(30).nullish(),
  clientName: z.string().max(120).nullish(),
  // Idempotency key: a sale queued offline can be sent twice and is stored once.
  clientRef: z.string().uuid().nullish(),
});

const saleInclude = { items: { include: { product: true } }, payments: true } as const;

class StockError extends Error {}

export async function POST(req: Request) {
  const ctx = await getPosContext(req, "pos.sell");
  if (!ctx.ok) return ctx.response;
  const { config } = ctx;

  const parsed = saleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("Datos de venta inválidos");
  const body = parsed.data;
  const clientRef = body.clientRef || null;

  if (clientRef) {
    const existing = await prisma.pOSSale.findFirst({ where: { clientRef, posConfigId: config.id }, include: saleInclude });
    if (existing) return NextResponse.json({ success: true, data: existing, duplicate: true });
  }

  const activeSession = await prisma.pOSCashSession.findFirst({
    where: { posConfigId: config.id, status: "OPEN" },
  });
  if (!activeSession) return posError("La caja debe estar abierta para realizar ventas");

  const business = getBusinessType(config.businessType);
  if (!business.orderTypes.includes(body.orderType as OrderTypeId)) return posError("Tipo de pedido no disponible para este negocio");
  const deliveryChannel = ORDER_TYPES_WITH_CHANNEL.includes(body.orderType as OrderTypeId) ? body.deliveryChannel || null : null;

  const enabled = config.paymentMethods.length ? config.paymentMethods : ["CASH"];
  if (body.payments.some((p) => !enabled.includes(p.method))) return posError("Medio de pago no habilitado");

  const quantities = new Map<string, number>();
  for (const item of body.items) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);

  const products = await prisma.pOSProduct.findMany({
    where: { id: { in: Array.from(quantities.keys()) }, posConfigId: config.id, isActive: true },
  });
  if (products.length !== quantities.size) return posError("Uno de los productos ya no está disponible. Actualizá el catálogo.");

  for (const p of products) {
    const qty = quantities.get(p.id)!;
    if (getUnit(p.unit).step >= 1 && !Number.isInteger(qty)) return posError(`${p.name} se vende por unidades enteras`);
  }

  const decimals = currencyDecimals(config.currency);
  const pricing = computeSale({
    lines: products.map((p) => ({
      productId: p.id,
      quantity: quantities.get(p.id)!,
      unitPrice: Number(p.price),
      taxRate: Number(p.taxRate ?? config.taxRate),
    })),
    discountType: body.discountType,
    discountValue: body.discountValue,
    pricesIncludeTax: config.pricesIncludeTax,
    decimals,
  });

  const r = (n: number) => roundMoney(n, decimals);
  const cash = r(body.payments.filter((p) => p.method === "CASH").reduce((s, p) => s + p.amount, 0));
  const nonCash = r(body.payments.filter((p) => p.method !== "CASH").reduce((s, p) => s + p.amount, 0));
  if (nonCash > pricing.total) return posError("Los pagos que no son en efectivo no pueden superar el total");
  const change = r(cash + nonCash - pricing.total);
  if (change < 0) return posError(`Falta cobrar ${formatMoney(-change, config.currency)}`);

  const payments = body.payments
    .map((p) => ({ method: p.method, reference: p.reference || null, amount: p.amount }))
    .filter((p) => p.method !== "CASH");
  if (cash > 0 && cash - change > 0) payments.unshift({ method: "CASH", reference: null, amount: r(cash - change) });

  const byId = new Map(products.map((p) => [p.id, p]));

  try {
    const sale = await prisma.$transaction(async (tx) => {
      for (const line of pricing.lines) {
        const product = byId.get(line.productId)!;
        if (!product.trackStock) continue;
        const updated = await tx.pOSProduct.updateMany({
          where: { id: product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) throw new StockError(`Stock insuficiente de ${product.name} (quedan ${Number(product.stock)})`);
      }

      return tx.pOSSale.create({
        data: {
          posConfigId: config.id,
          cashSessionId: activeSession.id,
          subtotalAmount: pricing.subtotal,
          taxAmount: pricing.tax,
          totalAmount: pricing.total,
          discountAmount: pricing.discount,
          discountType: body.discountType === "NONE" ? null : body.discountType,
          orderType: body.orderType,
          deliveryChannel,
          receivedAmount: cash,
          changeAmount: change,
          clientNit: body.clientNit?.trim() || null,
          clientName: body.clientName?.trim() || null,
          clientRef,
          staffId: activeSession.staffId,
          sellerUserId: actorFields(ctx),
          items: {
            create: pricing.lines.map((line) => {
              const product = byId.get(line.productId)!;
              return {
                productId: product.id,
                productName: product.name,
                unit: product.unit,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                unitCostPrice: product.costKnown ? product.costPrice : null,
                subtotal: line.gross,
                taxRate: line.taxRate,
                taxAmount: line.tax,
              };
            }),
          },
          payments: { create: payments },
        },
        include: saleInclude,
      });
    });

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    if (error instanceof StockError) return posError(error.message, 409);
    // Two copies of the same queued sale raced: return the one that won.
    if (clientRef && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.pOSSale.findFirst({ where: { clientRef, posConfigId: config.id }, include: saleInclude });
      if (existing) return NextResponse.json({ success: true, data: existing, duplicate: true });
    }
    console.error("POS_SALE_POST_ERROR", error);
    return posError("Internal Error", 500);
  }
}
// creado por pato dev y askforvini
