import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/checkPlanLimit";
import { Prisma, SpaceType, Unit } from "@prisma/client";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
function num(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
}
function isImageUrl(v: unknown): v is string {
  return typeof v === "string" && v.length <= 8 * 1024 * 1024 && (/^https?:\/\//i.test(v) || v.startsWith("data:image/"));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type');

    // No listar espacios en revisión; un `type` fuera del enum hacía fallar la consulta (500)
    const whereClause: Prisma.SpaceWhereInput = { isActive: true, isUnderReview: false };
    if (city) whereClause.city = { contains: city.slice(0, 100), mode: 'insensitive' };
    if (type) {
      if (!(Object.values(SpaceType) as string[]).includes(type)) return NextResponse.json({ success: true, data: [] });
      whereClause.type = type as SpaceType;
    }

    const spaces = await prisma.space.findMany({
      where: whereClause,
      include: {
        images: { orderBy: { order: 'asc' } },
        owner: { select: { id: true, name: true, avatar: true } },
        reviews: { select: { rating: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });

    return NextResponse.json({ success: true, data: spaces });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }
    const planCheck = await checkPlanLimit(user.id, 'create_space');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });

    const title = text(body.title, 150);
    const description = text(body.description, 10000);
    const address = text(body.address, 300);
    const city = text(body.city, 100);
    const country = text(body.country, 100);
    if (!title || !description || !city || !country) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!(Object.values(SpaceType) as string[]).includes(body.type) || !(Object.values(Unit) as string[]).includes(body.unit)) {
      return NextResponse.json({ success: false, error: "Tipo de espacio o unidad inválidos" }, { status: 400 });
    }
    const width = num(body.width, 0.01, 1_000_000);
    const height = num(body.height, 0.01, 1_000_000);
    const pricePerDay = num(body.pricePerDay, 0.01, 1_000_000);
    const pricePerWeek = num(body.pricePerWeek, 0.01, 1_000_000);
    const pricePerMonth = num(body.pricePerMonth, 0.01, 1_000_000);
    const latitude = num(body.latitude, -90, 90);
    const longitude = num(body.longitude, -180, 180);
    const trafficEstimate = num(body.trafficEstimate, 0, 1_000_000_000);
    const minContractMonths = num(body.minContractMonths, 1, 120);
    const values = [width, height, pricePerDay, pricePerWeek, pricePerMonth, latitude, longitude, trafficEstimate, minContractMonths];
    if (width === null || height === null || values.some((v) => Number.isNaN(v))) {
      return NextResponse.json({ success: false, error: "Medidas, precios o coordenadas inválidos" }, { status: 400 });
    }
    const rawImages: unknown[] = Array.isArray(body.images) ? body.images : [];
    if (rawImages.length > 20 || !rawImages.every(isImageUrl)) {
      return NextResponse.json({ success: false, error: "Imágenes inválidas" }, { status: 400 });
    }

    const space = await prisma.space.create({
      data: {
        ownerId: user.id,
        title,
        description,
        type: body.type as SpaceType,
        address,
        city,
        country,
        latitude,
        longitude,
        width,
        height,
        unit: body.unit as Unit,
        hasLighting: body.hasLighting === true,
        trafficEstimate: trafficEstimate === null ? null : Math.round(trafficEstimate),
        pricePerDay,
        pricePerWeek,
        pricePerMonth,
        currency: (text(body.currency, 3) || "USD").toUpperCase(),
        // El formulario de /anuncios/publicar los manda pero antes se descartaban
        ...(text(body.orientation, 50) ? { orientation: text(body.orientation, 50) } : {}),
        ...(text(body.material, 50) ? { material: text(body.material, 50) } : {}),
        ...(minContractMonths !== null ? { minContractMonths: Math.round(minContractMonths) } : {}),
        isFirstRentalFree: true,
        images: {
          create: rawImages.map((url, index) => ({
            url: url as string, order: index
          }))
        }
      }
    });

    return NextResponse.json({ success: true, data: space });
  } catch (error) {
    console.error("Error creating space:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
