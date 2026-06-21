import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Security Check: Only ADMINs can moderate
  if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { action, targetId, reason } = await req.json();

    switch (action) {
      case "BAN_USER":
        await prisma.user.update({
          where: { id: targetId },
          data: { 
            isSanctioned: true,
            sanctionReason: reason || "Infracción grave de términos",
            sanctionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)
          }
        });
        await prisma.suspension.create({
          data: {
            userId: targetId,
            reason: reason || "Infracción de los términos de servicio",
            suspendedBy: session.user.id || "ADMIN",
            startDate: new Date(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
            isActive: true
          }
        });
        return NextResponse.json({ success: true, message: "Usuario baneado exitosamente" });

      case "DELETE_POST":
        await prisma.post.deleteMany({
          where: { id: targetId }
        });
        return NextResponse.json({ success: true, message: "Publicación eliminada" });

      case "DELETE_SERVICE":
        await prisma.service.deleteMany({
          where: { id: targetId }
        });
        return NextResponse.json({ success: true, message: "Servicio eliminado" });

      case "DELETE_SPACE":
        await prisma.space.deleteMany({
          where: { id: targetId }
        });
        return NextResponse.json({ success: true, message: "Espacio eliminado" });

      case "VERIFY_USER":
        await prisma.user.update({
          where: { id: targetId },
          data: { isVerified: true }
        });
        return NextResponse.json({ success: true, message: "Usuario verificado" });

      case "APPROVE_COMPANY_MEMBER":
        await prisma.companyMember.update({
          where: { id: targetId },
          data: { status: "APPROVED" }
        });
        return NextResponse.json({ success: true, message: "Solicitud aprobada" });

      case "REJECT_COMPANY_MEMBER":
        await prisma.companyMember.update({
          where: { id: targetId },
          data: { status: "REJECTED" }
        });
        return NextResponse.json({ success: true, message: "Solicitud rechazada" });

      default:
        return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Moderation Error:", error);
    return NextResponse.json({ error: "Error procesando moderación" }, { status: 500 });
  }
}
