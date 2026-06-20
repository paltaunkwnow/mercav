import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { username: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { username: params.username } });
    if (!targetUser) return NextResponse.json({ success: false, error: "Usuario objetivo no encontrado" }, { status: 404 });

    if (user.id === targetUser.id) {
      return NextResponse.json({ success: false, error: "No puedes seguirte a ti mismo" }, { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUser.id } }
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: "FOLLOW",
          title: "Nuevo seguidor",
          body: `${user.name} dejó de seguirte`,
          link: `/perfil/${user.username}`
        }
      }).catch(() => {});
      return NextResponse.json({ success: true, data: { followed: false } });
    }

    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUser.id
      }
    });

    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "FOLLOW",
        title: "Nuevo seguidor",
        body: `${user.name} ahora te sigue`,
        link: `/perfil/${user.username}`
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, data: { followed: true } });
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
