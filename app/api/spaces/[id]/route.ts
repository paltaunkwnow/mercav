import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const space = await prisma.space.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { order: 'asc' } },
        owner: { select: { id: true, name: true, avatar: true } },
        reviews: { include: { author: { select: { name: true, avatar: true } } } }
      }
    });

    if (!space) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ success: true, data: space });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const space = await prisma.space.findUnique({ where: { id: params.id } });
    if (!space) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });

    // Los roles se modelan en UserRole (User.roles), no hay campo `role`
    if (space.ownerId !== user.id && !(await isAdminUser(user.id))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }
    // El precio mensual es lo que se cobra al reservar: no puede ser negativo/cero/no numérico
    if (body.pricePerMonth !== undefined && body.pricePerMonth !== null) {
      const price = Number(body.pricePerMonth);
      if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
        return NextResponse.json({ success: false, error: "Precio mensual inválido" }, { status: 400 });
      }
    }
    if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
      return NextResponse.json({ success: false, error: "isActive inválido" }, { status: 400 });
    }

    // Update basic fields
    const updatedSpace = await prisma.space.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        address: body.address,
        city: body.city,
        country: body.country,
        width: body.width,
        height: body.height,
        unit: body.unit,
        hasLighting: body.hasLighting,
        trafficEstimate: body.trafficEstimate,
        pricePerMonth: body.pricePerMonth,
        currency: body.currency,
        orientation: body.orientation,
        material: body.material,
        minContractMonths: body.minContractMonths,
        isActive: body.isActive !== undefined ? body.isActive : space.isActive
      }
    });

    // Handle images if provided
    if (body.images !== undefined) {
      // Validar: solo un arreglo de URLs (strings) con tope razonable
      const images: unknown = body.images;
      if (
        !Array.isArray(images) ||
        images.length > 20 ||
        !images.every((url) => typeof url === "string" && url.length > 0 && url.length <= 2048)
      ) {
        return NextResponse.json({ success: false, error: "Imágenes inválidas" }, { status: 400 });
      }
      // Borrar y recrear en una transacción para no dejar el espacio sin imágenes si falla
      await prisma.$transaction([
        prisma.spaceImage.deleteMany({ where: { spaceId: params.id } }),
        prisma.spaceImage.createMany({
          data: (images as string[]).map((url, index) => ({
            spaceId: params.id,
            url,
            order: index
          }))
        })
      ]);
    }

    return NextResponse.json({ success: true, data: updatedSpace });
  } catch (error) {
    console.error("Error updating space:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const space = await prisma.space.findUnique({ where: { id: params.id } });

    if (!space) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    if (!user || (space.ownerId !== user.id && !(await isAdminUser(user.id)))) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    await prisma.space.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
