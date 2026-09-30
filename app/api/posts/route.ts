import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const take = 10;
    
    const posts = await prisma.post.findMany({
      take,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      include: {
        author: { select: { id: true, name: true, avatar: true, username: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const nextCursor = posts.length === take ? posts[take - 1].id : null;

    return NextResponse.json({ success: true, data: { posts, nextCursor } });
  } catch (error) {
    console.error("Error fetching posts:", error);
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
    
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: body.content,
        images: body.images || [],
        videoUrl: body.videoUrl,
        linkUrl: body.linkUrl,
        linkTitle: body.linkPreview?.title,
        linkDescription: body.linkPreview?.description,
        linkImage: body.linkPreview?.image,
        module: body.module || "GENERAL",
        jobId: body.jobId || null,
        serviceId: body.serviceId || null,
        spaceId: body.spaceId || null,
      },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, isVerified: true, profile: { select: { headline: true } } } },
        job: { select: { id: true, title: true, city: true, company: { select: { name: true } } } },
        service: { select: { id: true, title: true, provider: { select: { name: true } } } },
        space: { select: { id: true, title: true, city: true, country: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });

    return NextResponse.json({ success: true, data: { ...post, likes: [], reactions: {} } });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
