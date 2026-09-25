import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { username: string } }) {
  try {
    const user = await prisma.user.findUnique({ where: { username: params.username } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, bio: true, location: true, country: true, isVerified: true, profile: { select: { headline: true, profileType: true } } } },
        postLikes: { select: { type: true, userId: true } },
        _count: { select: { comments: true, likes: true } },
        job: { select: { id: true, title: true, city: true, country: true, salaryMin: true, salaryMax: true, salaryCurrency: true, company: { select: { id: true, name: true, avatar: true, isVerified: true } } } },
        service: { select: { id: true, title: true, provider: { select: { id: true, name: true, avatar: true, isVerified: true } }, packages: { take: 1, orderBy: { price: "asc" }, select: { price: true } } } },
        space: { select: { id: true, title: true, city: true, country: true, pricePerDay: true, currency: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } } }
      }
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
