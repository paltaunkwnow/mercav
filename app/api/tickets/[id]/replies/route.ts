import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { message } = body;

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: params.id,
        userId: user.id,
        message,
        isAdmin: false
      }
    });

    await prisma.ticket.update({
      where: { id: params.id },
      data: { status: "OPEN" }
    });

    return NextResponse.json({ success: true, data: reply });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
