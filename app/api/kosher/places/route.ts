import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { KosherPlaceType, Prisma, type KosherStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { slugify } from "@/lib/kosher/geo";
import { parseHours } from "@/lib/kosher/hours";
import { isFoodPlace } from "@/lib/kosher/labels";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";
import { listExplorePlaces } from "@/lib/kosher/explore";
import { DEFAULT_SUGGEST_STATUS, SUGGEST_STATUSES, cleanServices, hoursInputProblem } from "@/components/kosher/manage/details";

/** Lista liviana para el mapa (lib/kosher/explore.ts). ?ciudad=<slug> la limita a una guía de ciudad. */
export async function GET(request: NextRequest) {
  const ciudad = request.nextUrl.searchParams.get("ciudad");
  if (ciudad && !/^[a-z0-9-]{1,80}$/.test(ciudad)) return kosherError(400, "Ciudad inválida.");
  const places = await listExplorePlaces(ciudad);
  return NextResponse.json(
    { success: true, places },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  // Todos los tipos del atlas (antes faltaba "museum" y el formulario lo ofrecía).
  type: z.enum(KosherPlaceType),
  address: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().length(2).transform((v) => v.toUpperCase()),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  foodCategory: z.enum(["meat", "dairy", "parve"]).optional(),
  agencyName: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(600).optional(),
  // Nivel informado por quien sugiere. "certified" no se acepta: sale de un certificado revisado.
  status: z.enum(SUGGEST_STATUSES as [KosherStatus, ...KosherStatus[]]).optional(),
  // Se valida con hoursInputProblem y se normaliza con parseHours.
  hours: z.unknown().optional(),
  priceLevel: z.number().int().min(1).max(4).nullable().optional(),
  services: z.array(z.string().max(40)).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-place", capacity: 5, refillPerMinute: 1, userId: viewer.id });
  if (limited) return limited;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Revisá los datos del lugar.");
  const { status, hours: rawHours, priceLevel, services: rawServices, ...input } = parsed.data;

  const hoursProblem = rawHours === undefined ? null : hoursInputProblem(rawHours);
  if (hoursProblem) return kosherError(400, hoursProblem);
  const hours = rawHours === undefined ? null : parseHours(rawHours);
  const services = cleanServices(input.type, rawServices ?? []);
  if (!services) return kosherError(400, "Hay un servicio que no aplica a este tipo de lugar.");
  const food = isFoodPlace(input.type);

  const base = slugify(`${input.city}-${input.name}`) || "lugar";
  const taken = await prisma.kosherPlace.count({ where: { slug: { startsWith: base } } });
  const create = (slug: string) =>
    prisma.kosherPlace.create({
      data: {
        ...input,
        agencyName: input.agencyName || null,
        notes: input.notes || null,
        slug,
        // Fuera de los lugares de comida el nivel de kashrut no aplica: queda como reporte comunitario.
        status: food ? (status ?? DEFAULT_SUGGEST_STATUS) : DEFAULT_SUGGEST_STATUS,
        hours: hours ? (hours as Prisma.InputJsonObject) : Prisma.DbNull,
        priceLevel: food ? (priceLevel ?? null) : null,
        services,
        source: "community",
        confirmedAt: new Date(),
        published: viewer.isModerator,
        createdById: viewer.id,
      },
    });
  let place;
  try {
    place = await create(taken ? `${base}-${taken + 1}` : base);
  } catch (error) {
    // Dos altas simultáneas (o un slug "base-N" ya usado) chocan con el unique de slug:
    // reintentamos una vez con un sufijo aleatorio en lugar de devolver 500.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    place = await create(`${base}-${randomBytes(3).toString("hex")}`);
  }

  return NextResponse.json({ success: true, slug: place.slug, published: place.published }, { status: 201 });
}
