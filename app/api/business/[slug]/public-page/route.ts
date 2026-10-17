import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiBusiness } from "@/lib/business/context";
import { prisma } from "@/lib/prisma";
import { cleanPublicSlug, publicPageDraftSchema } from "@/lib/business/public-page";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const result = await apiBusiness(params.slug, "publicPage.edit");
  if ("error" in result) return result.error;
  const [page, products] = await Promise.all([
    prisma.businessPublicPage.findUnique({ where: { workspaceId: result.ctx.workspace.id } }),
    prisma.pOSProduct.findMany({ where: { posConfig: { workspaceId: result.ctx.workspace.id } }, select: { id: true, name: true, description: true, price: true, imageUrl: true, isActive: true, category: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  return NextResponse.json({ success: true, data: { page: page ? { slug: page.publicSlug, status: page.status, draft: publicPageDraftSchema.parse(page.draft), published: page.published ? publicPageDraftSchema.parse(page.published) : null } : null, products } });
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const result = await apiBusiness(params.slug, "publicPage.edit");
  if ("error" in result) return result.error;
  const body = await req.json().catch(() => null) as { publicSlug?: string; draft?: unknown } | null;
  const draft = publicPageDraftSchema.safeParse(body?.draft);
  const publicSlug = cleanPublicSlug(body?.publicSlug ?? result.ctx.workspace.slug);
  if (!draft.success || !publicSlug) return NextResponse.json({ success: false, error: "Revisá los datos de la página" }, { status: 400 });
  const page = await prisma.$transaction(async (tx) => {
    const current = await tx.businessPublicPage.findUnique({ where: { workspaceId: result.ctx.workspace.id }, select: { id: true, publicSlug: true } });
    const existing = await tx.businessPublicPage.findFirst({ where: { publicSlug, workspaceId: { not: result.ctx.workspace.id } }, select: { id: true } });
    const alias = await tx.businessPublicPageAlias.findUnique({ where: { slug: publicSlug }, select: { pageId: true } });
    if (existing || (alias && alias.pageId !== current?.id)) throw new Error("PUBLIC_SLUG_TAKEN");
    if (!current) return tx.businessPublicPage.create({ data: { workspaceId: result.ctx.workspace.id, publicSlug, draft: draft.data, aliases: { create: { slug: publicSlug } } } });
    if (current.publicSlug !== publicSlug) await tx.businessPublicPageAlias.create({ data: { slug: publicSlug, pageId: current.id } });
    return tx.businessPublicPage.update({ where: { id: current.id }, data: { publicSlug, draft: draft.data, version: { increment: 1 } } });
  }).catch((error) => {
    if (error instanceof Error && error.message === "PUBLIC_SLUG_TAKEN") return null;
    throw error;
  });
  if (!page) return NextResponse.json({ success: false, error: "Ese enlace ya está reservado" }, { status: 409 });
  revalidatePath(`/b/${publicSlug}`);
  return NextResponse.json({ success: true, data: { slug: page.publicSlug, status: page.status } });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const result = await apiBusiness(params.slug, "publicPage.publish");
  if ("error" in result) return result.error;
  const body = await req.json().catch(() => null) as { action?: "publish" | "pause" } | null;
  const page = await prisma.businessPublicPage.findUnique({ where: { workspaceId: result.ctx.workspace.id } });
  if (!page) return NextResponse.json({ success: false, error: "Guardá la página antes de publicarla" }, { status: 400 });
  if (body?.action === "pause") { await prisma.businessPublicPage.update({ where: { id: page.id }, data: { status: "PAUSED" } }); revalidatePath(`/b/${page.publicSlug}`); return NextResponse.json({ success: true, data: { status: "PAUSED" } }); }
  const draft = publicPageDraftSchema.parse(page.draft);
  if (!page.publicSlug || !draft.title) return NextResponse.json({ success: false, error: "Agregá un nombre para publicar" }, { status: 400 });
  await prisma.businessPublicPage.update({ where: { id: page.id }, data: { status: "PUBLISHED", published: draft, publishedAt: new Date(), aliases: { upsert: { where: { slug: page.publicSlug }, create: { slug: page.publicSlug, activated: true }, update: { activated: true } } } } });
  revalidatePath(`/b/${page.publicSlug}`);
  return NextResponse.json({ success: true, data: { status: "PUBLISHED" } });
}
