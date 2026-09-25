import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ success: false, error: "Estado no proporcionado" }, { status: 400 });
    }

    // Check if the application exists and if the user is the owner of the job post
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        jobPost: true
      }
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Postulación no encontrada" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || application.jobPost.companyId !== user.id) {
      return NextResponse.json({ success: false, error: "No tienes permiso para modificar esta postulación" }, { status: 403 });
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { status }
    });

    // Create notification for the applicant
    try {
      const statusText = status === 'ACEPTADO' ? 'aceptada' : 
                        status === 'DESCARTADO' ? 'revisada (No seleccionado)' : 
                        status === 'ENTREVISTA' ? 'seleccionada para entrevista' : status.toLowerCase();

      await prisma.notification.create({
        data: {
          userId: application.applicantId,
          type: "JOB_APPLICATION_STATUS",
          title: "Actualización de Postulación",
          body: `Tu postulación para el puesto "${application.jobPost.title}" ha sido ${statusText}.`,
          link: `/dashboard/postulaciones`
        }
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
