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
    if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        involvedUserId: userId
      }
    });

    // Create a system message in the ticket
    await prisma.ticketReply.create({
      data: {
        ticketId: params.id,
        userId: session.user.id,
        message: "El equipo de soporte ha invitado a la contraparte a este ticket para mediar en la resolución.",
        isAdmin: true
      }
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error inviting user to ticket:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
