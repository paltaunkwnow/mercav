import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/checkPlanLimit";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as any;
    
    let whereClause: any = { isActive: true };
    if (category) whereClause.category = category;

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

    const body = await req.json();
    const planCheck = await checkPlanLimit(user.id, 'create_service');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });
    
    const service = await prisma.service.create({
      data: {
        providerId: user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory,
        images: {
          create: body.images?.map((url: string, index: number) => ({
            url, order: index
          })) || []
        },
        packages: {
          create: body.packages || (body.packagePrice ? [{
            name: "Paquete Base",
            description: "Servicio estándar",
            price: body.packagePrice,
            deliveryDays: body.deliveryDays || 5,
            revisions: body.revisions || 3,
            type: "BASICO"
          }] : [])
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
