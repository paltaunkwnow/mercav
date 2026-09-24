import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user?.posConfig) return NextResponse.json({ success: true, data: [] });

    // Robust model access
    const prismaAny = prisma as any;
    const model = prismaAny.posProduct || prismaAny.pOSProduct;

    if (!model) {
      return NextResponse.json({ success: false, error: "Model not found" }, { status: 500 });
    }

    const products = await model.findMany({
      where: { posConfigId: user.posConfig.id },
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("POS_PRODUCT_GET_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user?.posConfig) return NextResponse.json({ success: false, error: "POS not configured" }, { status: 400 });

    const body = await req.json();
    const { name, description, price, costPrice, stock, imageUrl, categoryId, isActive, isKosher, isHalal, isVegan, isGlutenFree } = body;

    const prismaAny = prisma as any;
    const model = prismaAny.posProduct || prismaAny.pOSProduct;

    if (!model) {
      throw new Error("POSProduct model not found in Prisma client");
    }

    const product = await model.create({
      data: {
        posConfigId: user.posConfig.id,
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

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("POS_PRODUCT_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
