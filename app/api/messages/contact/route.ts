import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { targetUserId, context, contextId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Usuario destino no especificado" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    if (targetUserId === currentUser.id) {
      return NextResponse.json({ success: false, error: "No puedes contactarte a ti mismo" }, { status: 400 });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "El usuario destino no existe" }, { status: 404 });
    }

    // Find existing conversation between these two users for the given context
    // We use a more robust search for 1-to-1 conversations
    let conversation = await prisma.conversation.findFirst({
      where: {
        context: context || "GENERAL",
        contextId: contextId || null,
        AND: [
          { participants: { some: { id: currentUser.id } } },
          { participants: { some: { id: targetUserId } } }
        ]
      },
      include: {
        participants: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!conversation) {
      try {
        conversation = await prisma.conversation.create({
          data: {
            context: context || "GENERAL",
            contextId: contextId || null,
            participants: {
              connect: [
                { id: currentUser.id },
                { id: targetUserId }
              ]
            }
          },
          include: {
            participants: {
              select: { id: true, name: true, avatar: true }
            }
          }
        });
      } catch (createErr) {
        console.error("Error creating conversation:", createErr);
        throw createErr;
      }
    }

    return NextResponse.json({ 
      success: true, 
      conversation, 
      conversationId: conversation.id 
    });
  } catch (error) {
    console.error("Error initiating contact:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
