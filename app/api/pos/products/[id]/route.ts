import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPosContext, posError } from "@/lib/pos/server";
import { isUniqueCodeError, productInputSchema } from "@/lib/pos/product-input";
import { requireManager } from "@/lib/pos/staff";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getPosContext(req, "pos.inventory");
  if (!ctx.ok) return ctx.response;
  const gate = await requireManager(req, ctx.config.id);
  if (!gate.ok) return gate.response;

  const existing = await prisma.pOSProduct.findFirst({ where: { id: params.id, posConfigId: ctx.config.id } });
  if (!existing) return posError("Product not found or access denied", 404);

  const parsed = productInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return posError("Revisá los datos del producto");

  const { categoryId, costPrice, costKnown, ...data } = parsed.data;
  if (categoryId) {
    const category = await prisma.pOSCategory.findFirst({ where: { id: categoryId, posConfigId: ctx.config.id } });
    if (!category) return posError("Categoría inválida");
  }

  try {
    const product = await prisma.pOSProduct.update({
      where: { id: existing.id },
      data: {
        ...data,
        categoryId,
        ...(costPrice !== undefined ? { costPrice } : {}),
        ...(costKnown !== undefined ? { costKnown } : costPrice !== undefined ? { costKnown: true } : {}),
      },
    });
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    if (isUniqueCodeError(error)) return posError("Ya existe un producto con ese código de barras o SKU", 409);
    console.error("POS_PRODUCT_PUT_ERROR", error);
    return posError("Internal Error", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getPosContext(_req, "pos.inventory");
  if (!ctx.ok) return ctx.response;
  const gate = await requireManager(_req, ctx.config.id);
  if (!gate.ok) return gate.response;

  const existing = await prisma.pOSProduct.findFirst({
    where: { id: params.id, posConfigId: ctx.config.id },
    include: { _count: { select: { saleItems: true } } },
  });
  if (!existing) return posError("Product not found or access denied", 404);

  // Sold products stay in the sales history, so they are archived instead of deleted.
  if (existing._count.saleItems > 0) {
    await prisma.pOSProduct.update({
      where: { id: existing.id },
      data: { isActive: false, barcode: null, sku: null },
    });
    return NextResponse.json({ success: true, archived: true, message: "El producto tiene ventas: quedó archivado" });
  }

  await prisma.pOSProduct.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true, message: "Product deleted successfully" });
}
// creado por pato dev y askforvini
