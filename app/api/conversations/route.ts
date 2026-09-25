import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { encryptMessage } from "@/lib/crypto";

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

    const body = await req.json();
    
    // Check for existing conversation with the same target user if single-context
    const conversation = await prisma.conversation.create({
      data: {
        context: body.context || "GENERAL",
        contextId: body.contextId,
        isEnabled: true,
        participants: {
          connect: [
            { id: user.id },
            { id: body.targetUserId }
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
