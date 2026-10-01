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

    const body = await req.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 2000) {
      return NextResponse.json({ success: false, error: "El comentario debe tener entre 1 y 2000 caracteres" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({ where: { id: params.id, isActive: true }, select: { id: true } });
    if (!post) return NextResponse.json({ success: false, error: "Publicación no encontrada" }, { status: 404 });

    // La respuesta tiene que ser a un comentario de ESTA publicación
    let parentId: string | null = null;
    if (body?.parentId) {
      const parent = typeof body.parentId === "string"
        ? await prisma.postComment.findFirst({ where: { id: body.parentId, postId: params.id }, select: { id: true } })
        : null;
      if (!parent) return NextResponse.json({ success: false, error: "Comentario padre inválido" }, { status: 400 });
      parentId = parent.id;
    }

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
// creado por pato dev y askforvini
