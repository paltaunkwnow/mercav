import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const type = body.type as string;
    if (!['INTERESA','UTIL','INSPIRADOR'].includes(type)) return NextResponse.json({ success: false, error: "Tipo de reacción inválido" }, { status: 400 });

    const existing = await prisma.postLike.findFirst({ where: { postId: params.id, userId: me.id } });
    if (existing) {
      if (existing.type === type) {
        await prisma.postLike.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, data: { reacted: false } });
      } else {
        await prisma.postLike.update({ where: { id: existing.id }, data: { type: type as any } });
        return NextResponse.json({ success: true, data: { reacted: true } });
      }
    }

    await prisma.postLike.create({ data: { postId: params.id, userId: me.id, type: type as any } });
    return NextResponse.json({ success: true, data: { reacted: true } });
  } catch (error) {
    console.error("Error reacting to post:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
