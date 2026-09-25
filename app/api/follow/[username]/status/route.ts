import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { username: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null;

    const target = await prisma.user.findUnique({ where: { username: params.username } });
    if (!target) return NextResponse.json({ success: false, error: "Usuario objetivo no encontrado" }, { status: 404 });

    const followersCount = await prisma.follow.count({ where: { followingId: target.id } });
    const followingCount = await prisma.follow.count({ where: { followerId: target.id } });

    let isFollowing = false;
    if (me) {
      const rel = await prisma.follow.findFirst({ where: { followerId: me.id, followingId: target.id } });
      isFollowing = !!rel;
    }

    return NextResponse.json({ success: true, data: { followersCount, followingCount, isFollowing } });
  } catch (error) {
    console.error("Error fetching follow status:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
