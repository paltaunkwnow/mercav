import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PostModule } from "@prisma/client";

const CONTENT_MAX = 5000;
const IMAGE_MAX_CHARS = 8 * 1024 * 1024; // data URL de ~6 MB
const VIDEO_MAX_CHARS = 30 * 1024 * 1024;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Acepta URL http(s) o data URL del tipo indicado; cualquier otra cosa (javascript:, etc.) se rechaza. */
function safeMediaUrl(value: unknown, dataPrefix: string, maxChars: number): string | null | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxChars) return null;
  if (value.startsWith(dataPrefix) || isHttpUrl(value)) return value;
  return null;
}

function optionalId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 64 ? value : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const take = 10;
    
    const posts = await prisma.post.findMany({
      // No listar publicaciones desactivadas o en revisión de moderación
      where: { isActive: true, isUnderReview: false },
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

    // --- Validación (antes se guardaba el body tal cual) ---
    const content = typeof body?.content === "string" ? body.content : "";
    if (content.length > CONTENT_MAX) {
      return NextResponse.json({ success: false, error: `El texto supera los ${CONTENT_MAX} caracteres` }, { status: 400 });
    }

    const rawImages: unknown[] = Array.isArray(body?.images) ? body.images : [];
    if (rawImages.length > 4) {
      return NextResponse.json({ success: false, error: "Máximo 4 imágenes" }, { status: 400 });
    }
    const images = rawImages.map((img) => safeMediaUrl(img, "data:image/", IMAGE_MAX_CHARS));
    if (images.some((img) => !img)) {
      return NextResponse.json({ success: false, error: "Imagen inválida" }, { status: 400 });
    }

    const videoUrl = safeMediaUrl(body?.videoUrl, "data:video/", VIDEO_MAX_CHARS);
    if (videoUrl === null) {
      return NextResponse.json({ success: false, error: "Video inválido" }, { status: 400 });
    }

    // SEGURIDAD: linkUrl se renderiza como <a href>; un `javascript:` era XSS almacenado.
    let linkUrl: string | undefined;
    if (body?.linkUrl) {
      if (typeof body.linkUrl !== "string" || body.linkUrl.length > 2048 || !isHttpUrl(body.linkUrl)) {
        return NextResponse.json({ success: false, error: "El enlace debe ser una URL http(s) válida" }, { status: 400 });
      }
      linkUrl = body.linkUrl;
    }
    const preview = linkUrl && body?.linkPreview && typeof body.linkPreview === "object" ? body.linkPreview : null;
    const linkTitle = typeof preview?.title === "string" ? preview.title.slice(0, 300) : undefined;
    const linkDescription = typeof preview?.description === "string" ? preview.description.slice(0, 500) : undefined;
    const linkImage =
      typeof preview?.image === "string" && preview.image.length <= 2048 && isHttpUrl(preview.image) ? preview.image : undefined;

    if (!content.trim() && images.length === 0 && !videoUrl && !linkUrl) {
      return NextResponse.json({ success: false, error: "La publicación está vacía" }, { status: 400 });
    }

    const postModule: PostModule = (Object.values(PostModule) as string[]).includes(body?.module)
      ? (body.module as PostModule)
      : "GENERAL";

    // Solo se pueden vincular empleos/servicios/espacios propios (el composer solo ofrece los propios)
    const jobId = optionalId(body?.jobId);
    const serviceId = optionalId(body?.serviceId);
    const spaceId = optionalId(body?.spaceId);
    const [ownJob, ownService, ownSpace] = await Promise.all([
      jobId ? prisma.jobPost.findFirst({ where: { id: jobId, companyId: user.id }, select: { id: true } }) : null,
      serviceId ? prisma.service.findFirst({ where: { id: serviceId, providerId: user.id }, select: { id: true } }) : null,
      spaceId ? prisma.space.findFirst({ where: { id: spaceId, ownerId: user.id }, select: { id: true } }) : null,
    ]);
    if ((jobId && !ownJob) || (serviceId && !ownService) || (spaceId && !ownSpace)) {
      return NextResponse.json({ success: false, error: "Solo podés vincular publicaciones propias" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content,
        images: images as string[],
        videoUrl,
        linkUrl,
        linkTitle,
        linkDescription,
        linkImage,
        module: postModule,
        jobId,
        serviceId,
        spaceId,
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
