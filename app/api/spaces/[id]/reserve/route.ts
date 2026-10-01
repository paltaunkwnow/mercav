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
    
    if (!space.isActive || space.isUnderReview) {
      return NextResponse.json({ success: false, error: "Este espacio no está disponible" }, { status: 409 });
    }
    if (space.ownerId === user.id) {
      return NextResponse.json({ success: false, error: "No podés reservar tu propio espacio" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

    const start = new Date(body?.startDate);
    const end = new Date(body?.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ success: false, error: "Fechas inválidas" }, { status: 400 });
    }
    const briefing = typeof body?.briefing === "string" ? body.briefing.slice(0, 5000) : "";

    // SEGURIDAD: el precio sale del espacio en la base, nunca del cliente. Antes `basePrice`
    // venía en el body y create-intent cobraba ese total (se podía pagar 0,50 USD por cualquier espacio).
    const basePrice = Number(space.pricePerMonth);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return NextResponse.json({ success: false, error: "El espacio no tiene precio mensual configurado" }, { status: 400 });
    }

    const isFirstRentalFree = space.isFirstRentalFree;
    const pricing = calculateAdsCommission(basePrice, isFirstRentalFree);

    const reservation = await prisma.reservation.create({
      data: {
        spaceId: space.id,
        advertiserId: user.id,
        startDate: start,
        endDate: end,
        basePrice: pricing.basePrice,
        advertiserFee: pricing.advertiserFee,
        ownerFee: pricing.ownerFee,
        totalPrice: pricing.totalPrice,
        isFirstRentalFree: isFirstRentalFree,
        status: "PENDING",
        briefing
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
// creado por pato dev y askforvini
