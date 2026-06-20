import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateServicesCommission } from "@/lib/commissions";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    const { packageId } = body;

    const svcPackage = await prisma.servicePackage.findUnique({ where: { id: packageId } });
    if (!svcPackage) return NextResponse.json({ success: false, error: "Paquete no encontrado" }, { status: 404 });
    
    const service = await prisma.service.findUnique({ where: { id: params.id } });
    if (!service) return NextResponse.json({ success: false, error: "Servicio no encontrado" }, { status: 404 });

    const pricing = calculateServicesCommission(Number(svcPackage.price));

    const order = await prisma.serviceOrder.create({
      data: {
        serviceId: service.id,
        packageId: svcPackage.id,
        clientId: user.id,
        providerId: service.providerId,
        status: "PENDING",
        totalPrice: pricing.totalPrice,
        platformFee: pricing.platformFee,
        providerPayout: pricing.providerPayout,
        briefing: body.briefing || ""
      }
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error creating service order:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
