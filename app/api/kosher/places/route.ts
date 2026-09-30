import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { slugify } from "@/lib/kosher/geo";
import { getKosherViewer, kosherError, listPublishedPlaces, unauthorized, writeGuard } from "@/lib/kosher/server";

export async function GET() {
  const places = await listPublishedPlaces();
  return NextResponse.json(
    { success: true, places },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["restaurant", "bakery", "butcher", "grocery_branch", "judaica", "synagogue", "mikvah", "school", "hotel", "community"]),
  address: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().length(2).transform((v) => v.toUpperCase()),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  foodCategory: z.enum(["meat", "dairy", "parve"]).optional(),
  agencyName: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(600).optional(),
});

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-place", capacity: 5, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Revisá los datos del lugar.");
  const input = parsed.data;

  const base = slugify(`${input.city}-${input.name}`) || "lugar";
  const taken = await prisma.kosherPlace.count({ where: { slug: { startsWith: base } } });
  const place = await prisma.kosherPlace.create({
    data: {
      ...input,
      agencyName: input.agencyName || null,
      notes: input.notes || null,
      slug: taken ? `${base}-${taken + 1}` : base,
      status: "community_report",
      source: "community",
      confirmedAt: new Date(),
      published: viewer.isModerator,
      createdById: viewer.id,
    },
  });

  return NextResponse.json({ success: true, slug: place.slug, published: place.published }, { status: 201 });
}
