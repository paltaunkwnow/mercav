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

    if (!user?.posConfig) return NextResponse.json({ success: false, error: "POS not configured" }, { status: 400 });

    const activeSession = await prisma.pOSCashSession.findFirst({
      where: { 
        posConfigId: user.posConfig.id,
        status: "OPEN"
      },
      include: {
        sales: true
      }
    });

    return NextResponse.json({ success: true, data: activeSession });
  } catch (error) {
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
    const { action, amount } = body; // action: 'OPEN' or 'CLOSE'

    if (action === 'OPEN') {
      const openSession = await prisma.pOSCashSession.create({
        data: {
          posConfigId: user.posConfig.id,
          openingAmount: amount,
          status: "OPEN"
        }
      });
      return NextResponse.json({ success: true, data: openSession });
    }

    if (action === 'CLOSE') {
      const activeSession = await prisma.pOSCashSession.findFirst({
        where: { posConfigId: user.posConfig.id, status: "OPEN" },
        include: { sales: true }
      });

      if (!activeSession) return NextResponse.json({ success: false, error: "No active session found" }, { status: 400 });

      const totalSales = activeSession.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const expected = Number(activeSession.openingAmount) + totalSales;
      const difference = Number(amount) - expected;

      const closedSession = await prisma.pOSCashSession.update({
        where: { id: activeSession.id },
        data: {
          closingAmount: amount,
          expectedAmount: expected,
          difference: difference,
          status: "CLOSED",
          closedAt: new Date()
        }
      });

      return NextResponse.json({ success: true, data: closedSession });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POS_SESSION_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
