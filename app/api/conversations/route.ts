import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { encryptMessage } from "@/lib/crypto";
import { ConversationContext } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: user.id }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId : "";
    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ success: false, error: "Usuario destino inválido" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) return NextResponse.json({ success: false, error: "El usuario destino no existe" }, { status: 404 });

    const context: ConversationContext = (Object.values(ConversationContext) as string[]).includes(body?.context)
      ? body.context
      : "GENERAL";
    const contextId = typeof body?.contextId === "string" ? body.contextId.slice(0, 120) : null;
    if (body?.initialMessage !== undefined && (typeof body.initialMessage !== "string" || body.initialMessage.length > 4000)) {
      return NextResponse.json({ success: false, error: "Mensaje inválido" }, { status: 400 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        context,
        contextId,
        isEnabled: true,
        participants: {
          connect: [
            { id: user.id },
            { id: targetUserId }
          ]
        }
      }
    });
    
    if (body.initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: encryptMessage(body.initialMessage)
        }
      })
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
