import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TicketCategory } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const { orderId, transactionId } = body ?? {};
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const category = typeof body?.category === "string" ? body.category : "";
    if (!subject || subject.length > 200 || !message || message.length > 4000) {
      return NextResponse.json({ success: false, error: "Asunto (máx. 200) y mensaje (máx. 4000) son obligatorios" }, { status: 400 });
    }
    if (!(Object.values(TicketCategory) as string[]).includes(category)) {
      return NextResponse.json({ success: false, error: "Categoría inválida" }, { status: 400 });
    }

    // A ticket can only reference an order or a payment the user is part of.
    if (orderId) {
      const order = await prisma.serviceOrder.findUnique({ where: { id: String(orderId) }, select: { clientId: true, service: { select: { providerId: true } } } });
      if (!order || (order.clientId !== user.id && order.service.providerId !== user.id)) {
        return NextResponse.json({ success: false, error: "Ese pedido no es tuyo" }, { status: 403 });
      }
    }
    if (transactionId) {
      const tx = await prisma.transaction.findUnique({ where: { id: String(transactionId) }, select: { userId: true } });
      if (!tx || tx.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Ese pago no es tuyo" }, { status: 403 });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject,
        message,
        category: category as TicketCategory,
        orderId: orderId ? String(orderId) : null,
        transactionId: transactionId ? String(transactionId) : null,
        status: "OPEN"
      }
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
