import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { subject, message, category, orderId, transactionId } = body;

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject,
        message,
        category,
        orderId,
        transactionId,
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
