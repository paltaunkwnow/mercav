import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError } from "@/lib/pos/server";
import { isUniqueCodeError, productInputSchema } from "@/lib/pos/product-input";
import { requireManager } from "@/lib/pos/staff";

export async function GET(req: Request) {
  const ctx = await getPosContext(req, "pos.sell");
  if (!ctx.ok) return ctx.response;

  const canSeeCosts = !ctx.workspaceId || ["OWNER", "MANAGER", "ACCOUNTANT"].includes(ctx.role ?? "");

  const products = await prisma.pOSProduct.findMany({
    where: { posConfigId: ctx.config.id },
    select: {
      id: true,
      categoryId: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      sku: true,
      barcode: true,
      unit: true,
      trackStock: true,
      taxRate: true,
      imageUrl: true,
      isActive: true,
      isKosher: true,
      isHalal: true,
      isVegan: true,
      isGlutenFree: true,
      minStock: true,
      kosherCategory: true,
      createdAt: true,
      updatedAt: true,
      category: true,
      ...(canSeeCosts ? { costPrice: true, costKnown: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: products });
}

export async function POST(req: Request) {
  const ctx = await getPosContext(req, "pos.inventory");
  if (!ctx.ok) return ctx.response;
  const gate = await requireManager(req, ctx.config.id);
  if (!gate.ok) return gate.response;

  const parsed = productInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("Revisá los datos del producto");

  const { categoryId, costPrice, costKnown, ...data } = parsed.data;
  if (categoryId) {
    const category = await prisma.pOSCategory.findFirst({ where: { id: categoryId, posConfigId: ctx.config.id } });
    if (!category) return posError("Categoría inválida");
  }

  try {
    const product = await prisma.pOSProduct.create({
      data: {
        ...data,
        categoryId,
        posConfigId: ctx.config.id,
        costPrice: costPrice ?? 0,
        costKnown: costKnown ?? (costPrice !== undefined),
      },
    });
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    if (isUniqueCodeError(error)) return posError("Ya existe un producto con ese código de barras o SKU", 409);
    console.error("POS_PRODUCT_POST_ERROR", error);
    return posError("Internal Error", 500);
  }
}
// creado por pato dev y askforvini
