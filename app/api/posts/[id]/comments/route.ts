import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(20, Math.max(1, Number(searchParams.get('take') || 3) || 3));

    const comments = await prisma.postComment.findMany({
      where: { postId: params.id, parentId: null },
      include: { author: { select: { id: true, name: true, username: true, avatar: true } }, replies: { include: { author: { select: { id: true, name: true, username:true, avatar:true } } } } },
      orderBy: { createdAt: 'desc' },
      take
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const content = body.content;
    const parentId = body.parentId;

    const comment = await prisma.postComment.create({ 
      data: { postId: params.id, authorId: me.id, content, parentId },
      include: { author: { select: { id: true, name: true, username: true, avatar: true } } }
    });
    return NextResponse.json({ success: true, data: { ...comment, replies: [] } });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
