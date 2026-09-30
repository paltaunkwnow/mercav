import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, kosherError, managesPlace, publicAuthorName, toPlaceDTO } from "@/lib/kosher/server";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const place = await prisma.kosherPlace.findUnique({
    where: { slug: params.slug },
    include: {
      stock: { orderBy: { confirmedAt: "desc" }, take: 20 },
      reviews: {
        orderBy: { updatedAt: "desc" },
        take: 30,
        include: { user: { select: { name: true, avatar: true } } },
      },
      events: {
        where: { state: "approved", startsAt: { gte: new Date(Date.now() - 3_600_000) } },
        orderBy: { startsAt: "asc" },
        take: 4,
        select: { id: true, title: true, kind: true, startsAt: true, official: true },
      },
      _count: { select: { managers: true } },
    },
  });
  if (!place || !place.published) return kosherError(404, "Lugar no encontrado");

  const viewer = await getKosherViewer();
  const confirmed = viewer
    ? await prisma.kosherStockConfirmation.findMany({
        where: { userId: viewer.id, reportId: { in: place.stock.map((s) => s.id) } },
        select: { reportId: true },
      })
    : [];
  const confirmedIds = new Set(confirmed.map((c) => c.reportId));
  const [community, iManage] = await Promise.all([
    prisma.kosherCommunity.findFirst({ where: { city: place.city, countryCode: place.countryCode }, select: { timezone: true } }),
    viewer ? managesPlace(viewer.id, place.id) : false,
  ]);
  const avg = place.reviews.length
    ? place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length
    : null;

  return NextResponse.json(
    {
      success: true,
      place: toPlaceDTO(place, { rating: avg, reviews: place.reviews.length, managed: place._count.managers > 0 }),
      managedByMe: iManage,
      timezone: community?.timezone ?? "UTC",
      events: place.events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() })),
      stock: place.stock.map((s) => ({
        id: s.id,
        category: s.category,
        note: s.note,
        authorName: s.authorName,
        confirmations: s.confirmations,
        confirmedAt: s.confirmedAt.toISOString(),
        confirmedByMe: confirmedIds.has(s.id),
      })),
      reviews: place.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        author: publicAuthorName(r.user.name),
        avatar: r.user.avatar,
        mine: r.userId === viewer?.id,
        updatedAt: r.updatedAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
