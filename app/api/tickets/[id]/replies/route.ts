import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const ticket = await prisma.ticket.findUnique({ where: { id: params.id }, select: { userId: true, involvedUserId: true } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }
    // Pueden responder: quien abrió el ticket, la contraparte invitada y el equipo de soporte (ADMIN).
    const isParty = ticket.userId === user.id || (!!ticket.involvedUserId && ticket.involvedUserId === user.id);
    const isAdmin = !isParty && (await isAdminUser(user.id));
    if (!isParty && !isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 4000) {
      return NextResponse.json({ success: false, error: "Mensaje inválido" }, { status: 400 });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: params.id,
        userId: user.id,
        message,
        isAdmin
      }
    });

    // Una respuesta de una de las partes reabre el caso; la de soporte no cambia el estado
    // (el admin lo resuelve o cierra con su propia acción).
    if (!isAdmin) {
      await prisma.ticket.update({
        where: { id: params.id },
        data: { status: "OPEN" }
      });
    }

    return NextResponse.json({ success: true, data: reply });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
