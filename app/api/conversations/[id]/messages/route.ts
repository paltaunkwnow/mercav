import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const member = await prisma.conversation.findFirst({
      where: { id: params.id, participants: { some: { id: user.id } } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const member = await prisma.conversation.findFirst({
      where: { id: params.id, participants: { some: { id: user.id } } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.length > 4000) {
      return NextResponse.json({ success: false, error: "Contenido inválido" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: user.id,
        content
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    // Emit real-time update
    const io = (globalThis as any).io;
    if (io) {
      io.emit(`chat:${params.id}`, message);
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
