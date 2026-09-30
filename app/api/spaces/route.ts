import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/checkPlanLimit";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const type = searchParams.get('type') as any;
    
    let whereClause: any = { isActive: true };
    if (city) whereClause.city = { contains: city, mode: 'insensitive' };
    if (type) whereClause.type = type;

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

    const body = await req.json();
    const planCheck = await checkPlanLimit(user.id, 'create_space');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });
    
    const space = await prisma.space.create({
      data: {
        ownerId: user.id,
        title: body.title,
        description: body.description,
        type: body.type,
        address: body.address,
        city: body.city,
        country: body.country,
        latitude: body.latitude,
        longitude: body.longitude,
        width: body.width,
        height: body.height,
        unit: body.unit,
        hasLighting: body.hasLighting,
        trafficEstimate: body.trafficEstimate,
        pricePerDay: body.pricePerDay,
        pricePerWeek: body.pricePerWeek,
        pricePerMonth: body.pricePerMonth,
        currency: body.currency,
        isFirstRentalFree: true,
        images: {
          create: body.images?.map((url: string, index: number) => ({
            url, order: index
          })) || []
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
