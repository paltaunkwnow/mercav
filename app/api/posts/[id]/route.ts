import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() }
    });

    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const post = await prisma.post.findUnique({
      where: { id: params.id }
    });

    if (!post) return NextResponse.json({ success: false, error: "Publicación no encontrada" }, { status: 404 });

    // Check if user is author OR admin
    // Los roles se modelan en UserRole (User.roles), no hay campo `role`
    const isAdmin = await isAdminUser(user.id);
    const isAuthor = post.authorId === user.id;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "No tienes permiso para eliminar esta publicación" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() }
    });

    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content : null;
    if (content === null || content.length > 5000) {
      return NextResponse.json({ success: false, error: "Contenido inválido" }, { status: 400 });
    }
    const post = await prisma.post.findUnique({
      where: { id: params.id }
    });

    if (!post) return NextResponse.json({ success: false, error: "Publicación no encontrada" }, { status: 404 });

    // Only author can edit
    if (post.authorId !== user.id) {
      return NextResponse.json({ success: false, error: "No tienes permiso para editar esta publicación" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        content,
        // Add more fields as needed
      }
    });

    return NextResponse.json({ success: true, data: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
