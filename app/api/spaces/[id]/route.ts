import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

    if (space.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    
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
    if (body.images) {
      // Simple approach: delete all and recreate
      await prisma.spaceImage.deleteMany({ where: { spaceId: params.id } });
      await prisma.spaceImage.createMany({
        data: body.images.map((url: string, index: number) => ({
          spaceId: params.id,
          url,
          order: index
        }))
      });
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
    if (space.ownerId !== user?.id && user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    await prisma.space.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
