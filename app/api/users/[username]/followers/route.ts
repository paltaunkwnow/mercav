import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { username: string } }) {
  try {
    const target = await prisma.user.findUnique({ where: { username: params.username } });
    if (!target) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const followers = await prisma.follow.findMany({ where: { followingId: target.id }, include: { follower: { select: { id: true, name: true, username: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });

    return NextResponse.json({ success: true, data: followers.map(f => f.follower) });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
