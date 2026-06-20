import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateAdsCommission } from "@/lib/commissions";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const space = await prisma.space.findUnique({ where: { id: params.id } });
    if (!space) return NextResponse.json({ success: false, error: "Espacio no encontrado" }, { status: 404 });
    
    const body = await req.json();
    const { startDate, endDate, basePrice } = body;
    
    const isFirstRentalFree = space.isFirstRentalFree;
    const pricing = calculateAdsCommission(Number(basePrice), isFirstRentalFree);

    const reservation = await prisma.reservation.create({
      data: {
        spaceId: space.id,
        advertiserId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        basePrice: pricing.basePrice,
        advertiserFee: pricing.advertiserFee,
        ownerFee: pricing.ownerFee,
        totalPrice: pricing.totalPrice,
        isFirstRentalFree: isFirstRentalFree,
        status: "PENDING",
        briefing: body.briefing || ""
      }
    });

    // Notify the space owner
    try {
      await prisma.notification.create({
        data: {
          userId: space.ownerId,
          type: "NEW_RESERVATION",
          title: "Nueva Reserva de Anuncio",
          body: `Has recibido una nueva solicitud de reserva para tu espacio "${space.title}" de parte de ${user.name}.`,
          link: `/dashboard/anuncios/reservas`
        }
      });
    } catch (notifErr) {
      console.error("Failed to notify space owner:", notifErr);
    }
    
    return NextResponse.json({ success: true, data: reservation });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
