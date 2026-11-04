import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ServiceCategory } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true
          }
        },
        packages: true,
        reviews: {
          include: {
            author: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ success: false, error: "Servicio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error("Error fetching service details:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const service = await prisma.service.findUnique({ where: { id: params.id } });

    if (!service || service.providerId !== user?.id) {
      return NextResponse.json({ success: false, error: "No tienes permiso para eliminar este servicio" }, { status: 403 });
    }

    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const service = await prisma.service.findUnique({ where: { id: params.id } });

    if (!service || service.providerId !== user?.id) {
      return NextResponse.json({ success: false, error: "No tienes permiso para editar este servicio" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }
    if (body.category !== undefined && !(Object.values(ServiceCategory) as string[]).includes(body.category)) {
      return NextResponse.json({ success: false, error: "Categoría inválida" }, { status: 400 });
    }
    if ((body.title !== undefined && (typeof body.title !== "string" || body.title.length > 150)) ||
        (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 10000))) {
      return NextResponse.json({ success: false, error: "Título o descripción inválidos" }, { status: 400 });
    }
    const updated = await prisma.service.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
