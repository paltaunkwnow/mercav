import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError } from "@/lib/pos/server";
import { requireManager } from "@/lib/pos/staff";

const schema = z.object({
  reason: z.string().trim().min(3).max(200),
  managerPin: z.string().max(6).optional(),
});

class AlreadyVoided extends Error {}

/** Voids a sale: marks it VOIDED, keeps who/why/when and puts tracked stock back. One transaction. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getPosContext();
  if (!ctx.ok) return ctx.response;
  const { config } = ctx;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("Escribí el motivo de la anulación (mínimo 3 caracteres)");

  const gate = await requireManager(req, config.id, parsed.data.managerPin);
  if (!gate.ok) return gate.response;

  const sale = await prisma.pOSSale.findFirst({
    where: { id: params.id, posConfigId: config.id },
    select: { id: true, status: true, items: { select: { productId: true, quantity: true, product: { select: { trackStock: true } } } } },
  });
  if (!sale) return posError("No encontramos esa venta", 404);
  if (sale.status === "VOIDED") return posError("Esta venta ya estaba anulada", 409);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Guard against two voids at once: only one flips COMPLETED → VOIDED.
      const flipped = await tx.pOSSale.updateMany({
        where: { id: sale.id, status: { not: "VOIDED" } },
        data: { status: "VOIDED", voidedAt: new Date(), voidReason: parsed.data.reason, voidedById: gate.actorStaffId },
      });
      if (flipped.count === 0) throw new AlreadyVoided();

      for (const item of sale.items) {
        if (!item.product.trackStock) continue;
        await tx.pOSProduct.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }

      return tx.pOSSale.findUniqueOrThrow({
        where: { id: sale.id },
        include: { items: { include: { product: true } }, payments: true },
      });
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AlreadyVoided) return posError("Esta venta ya estaba anulada", 409);
    console.error("POS_SALE_VOID_ERROR", error);
    return posError("Internal Error", 500);
  }
}
// creado por pato dev y askforvini
