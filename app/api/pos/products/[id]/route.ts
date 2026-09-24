import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user?.posConfig) return NextResponse.json({ success: false, error: "POS not configured" }, { status: 400 });

    const productId = params.id;
    const prismaAny = prisma as any;
    const model = prismaAny.posProduct || prismaAny.pOSProduct;

    if (!model) {
      throw new Error("POSProduct model not found in Prisma client");
    }

    // Verify ownership
    const existing = await model.findFirst({
      where: { id: productId, posConfigId: user.posConfig.id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, price, costPrice, stock, imageUrl, categoryId, isActive, isKosher, isHalal, isVegan, isGlutenFree } = body;

    const updatedProduct = await model.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price.toString()) || 0,
        costPrice: parseFloat((costPrice ?? 0).toString()) || 0,
        stock: parseInt(stock.toString()) || 0,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
        isActive: isActive ?? true,
        isKosher: isKosher ?? false,
        isHalal: isHalal ?? false,
        isVegan: isVegan ?? false,
        isGlutenFree: isGlutenFree ?? false
      }
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error("POS_PRODUCT_PUT_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user?.posConfig) return NextResponse.json({ success: false, error: "POS not configured" }, { status: 400 });

    const productId = params.id;
    const prismaAny = prisma as any;
    const model = prismaAny.posProduct || prismaAny.pOSProduct;

    if (!model) {
      throw new Error("POSProduct model not found in Prisma client");
    }

    // Verify ownership
    const existing = await model.findFirst({
      where: { id: productId, posConfigId: user.posConfig.id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found or access denied" }, { status: 404 });
    }

    // Delete any associated POSSaleItems first to bypass foreign key constraints
    const saleItemModel = prismaAny.posSaleItem || prismaAny.pOSSaleItem;
    if (saleItemModel) {
      await saleItemModel.deleteMany({
        where: { productId: productId }
      });
    }

    await model.delete({
      where: { id: productId }
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("POS_PRODUCT_DELETE_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
