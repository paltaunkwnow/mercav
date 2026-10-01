import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/checkPlanLimit";
import { PackageType, Prisma, ServiceCategory } from "@prisma/client";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
function intIn(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}
function isImageUrl(v: unknown): v is string {
  return typeof v === "string" && v.length <= 8 * 1024 * 1024 && (/^https?:\/\//i.test(v) || v.startsWith("data:image/"));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // No listar servicios en revisión; una categoría fuera del enum hacía fallar la consulta (500)
    const whereClause: Prisma.ServiceWhereInput = { isActive: true, isUnderReview: false };
    if (category) {
      if (!(Object.values(ServiceCategory) as string[]).includes(category)) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.category = category as ServiceCategory;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        provider: { select: { id: true, name: true, avatar: true } },
        packages: { orderBy: { price: 'asc' }, take: 1 },
        reviews: { select: { rating: true } },
        images: { orderBy: { order: 'asc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }
    const planCheck = await checkPlanLimit(user.id, 'create_service');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });

    const title = text(body.title, 150);
    const description = text(body.description, 10000);
    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Título y descripción son obligatorios" }, { status: 400 });
    }
    if (!(Object.values(ServiceCategory) as string[]).includes(body.category)) {
      return NextResponse.json({ success: false, error: "Categoría inválida" }, { status: 400 });
    }

    const rawImages: unknown[] = Array.isArray(body.images) ? body.images : [];
    if (rawImages.length > 10 || !rawImages.every(isImageUrl)) {
      return NextResponse.json({ success: false, error: "Imágenes inválidas" }, { status: 400 });
    }

    // SEGURIDAD: antes `body.packages` iba directo a un nested create, lo que permitía inyectar
    // relaciones anidadas (p. ej. `orders: { create: ... }` con pedidos falsos) y precios negativos.
    const rawPackages: unknown[] = Array.isArray(body.packages)
      ? body.packages.slice(0, 3)
      : body.packagePrice
        ? [{ name: "Paquete Base", description: "Servicio estándar", price: body.packagePrice, deliveryDays: body.deliveryDays || 5, revisions: body.revisions || 3, type: "BASICO" }]
        : [];
    const packages: Prisma.ServicePackageCreateWithoutServiceInput[] = [];
    for (const raw of rawPackages) {
      if (!raw || typeof raw !== "object") continue;
      const p = raw as Record<string, unknown>;
      const price = Number(p.price);
      if (!Number.isFinite(price) || price <= 0 || price > 100_000) {
        return NextResponse.json({ success: false, error: "Precio de paquete inválido" }, { status: 400 });
      }
      packages.push({
        name: text(p.name, 100) || "Paquete Base",
        // description y type son obligatorios en el schema; /dashboard/crear no los mandaba y fallaba
        description: text(p.description, 2000) || "Servicio estándar",
        price: Math.round(price * 100) / 100,
        deliveryDays: intIn(p.deliveryDays, 1, 365, 5),
        revisions: intIn(p.revisions, 0, 50, 3),
        type: (Object.values(PackageType) as string[]).includes(p.type as string) ? (p.type as PackageType) : PackageType.BASICO,
        features: Array.isArray(p.features)
          ? p.features.filter((f): f is string => typeof f === "string").slice(0, 20).map((f) => f.slice(0, 200))
          : [],
      });
    }

    const service = await prisma.service.create({
      data: {
        providerId: user.id,
        title,
        description,
        category: body.category as ServiceCategory,
        subcategory: text(body.subcategory, 100) || null,
        images: {
          create: rawImages.map((url, index) => ({
            url: url as string, order: index
          }))
        },
        packages: {
          create: packages
        }
      }
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
