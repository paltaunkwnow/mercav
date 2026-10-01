import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await req.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    // announcementLink se muestra como enlace a todos los usuarios: solo rutas internas o http(s)
    if (data.announcementLink && (typeof data.announcementLink !== "string" ||
        !(/^https?:\/\//i.test(data.announcementLink) || (data.announcementLink.startsWith("/") && !data.announcementLink.startsWith("//"))))) {
      return NextResponse.json({ error: "El enlace del anuncio debe ser una ruta interna o una URL http(s)" }, { status: 400 });
    }
    if (data.platformFeePercentage !== undefined && data.platformFeePercentage !== null) {
      const fee = Number(data.platformFeePercentage);
      if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
        return NextResponse.json({ error: "Comisión inválida (0-100)" }, { status: 400 });
      }
    }
    
    const config = await prisma.globalConfig.upsert({
      where: { id: "singleton" },
      update: {
        platformFeePercentage: data.platformFeePercentage,
        maintenanceMode: data.maintenanceMode,
        minVerificationScore: data.minVerificationScore,
        supportEmail: data.supportEmail,
        announcementText: data.announcementText,
        announcementLink: data.announcementLink,
        allowNewRegistrations: data.allowNewRegistrations,
        featuredServiceId: data.featuredServiceId,
        featuredSpaceId: data.featuredSpaceId,
        maintenanceMessage: data.maintenanceMessage,
      },
      create: {
        id: "singleton",
        platformFeePercentage: data.platformFeePercentage || 10,
        maintenanceMode: data.maintenanceMode || false,
        minVerificationScore: data.minVerificationScore || 70,
        supportEmail: data.supportEmail || "soporte@mercav.lat",
        announcementText: data.announcementText || "",
        announcementLink: data.announcementLink || "",
        allowNewRegistrations: data.allowNewRegistrations ?? true,
        maintenanceMessage: data.maintenanceMessage || "El sistema está bajo mantenimiento programado. Volveremos pronto.",
      }
    });

    // Write audit log
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "UPDATE_GLOBAL_CONFIG",
        details: `Configuración de infraestructura actualizada. Modo mantenimiento: ${config.maintenanceMode ? 'ACTIVADO' : 'DESACTIVADO'}`
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config Update Error:", error);
    return NextResponse.json({ error: "Error actualizando configuración" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const config = await prisma.globalConfig.findUnique({
    where: { id: "singleton" }
  }) || await prisma.globalConfig.create({ data: { id: "singleton" } });

  return NextResponse.json(config);
}
// creado por pato dev y askforvini
