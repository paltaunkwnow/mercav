import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user?.posConfig) return NextResponse.json({ success: false, error: "POS not configured" }, { status: 400 });

    const posConfigId = user.posConfig.id;

    // Ensure caja is open
    const activeSession = await prisma.pOSCashSession.findFirst({
      where: { posConfigId, status: "OPEN" }
    });

    if (!activeSession) return NextResponse.json({ success: false, error: "La caja debe estar abierta para realizar ventas" }, { status: 400 });

    const body = await req.json();
    const { items, totalAmount, discountAmount, discountType, orderType, deliveryChannel, receivedAmount, changeAmount, clientNit, clientName } = body;

    // Create sale in transaction
    const sale = await prisma.$transaction(async (tx) => {
      const txAny = tx as any;
      const saleModel = txAny.posSale || txAny.pOSSale;
      const productModel = txAny.posProduct || txAny.pOSProduct;

      if (!saleModel) throw new Error("POSSale model not found in Prisma client");

      const newSale = await saleModel.create({
        data: {
          posConfigId,
          cashSessionId: activeSession.id,
          totalAmount,
          discountAmount: discountAmount || 0,
          discountType,
          orderType,
          deliveryChannel,
          receivedAmount: receivedAmount || 0,
          changeAmount: changeAmount || 0,
          clientNit: clientNit || null,
          clientName: clientName || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: item.subtotal
            }))
          }
        },
        include: { items: { include: { product: true } } }
      });

      // Update stock for each product
      for (const item of items) {
        await productModel.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newSale;
    });

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error("POS_SALE_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
