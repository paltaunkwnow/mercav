import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ApplicationStatus } from "@prisma/client";

// Estados válidos según el enum ApplicationStatus de Prisma. RECIBIDO es el estado
// inicial que asigna la postulación; la empresa solo puede avanzar al resto.
const SETTABLE_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.EN_REVISION,
  ApplicationStatus.ENTREVISTA,
  ApplicationStatus.OFERTA,
  ApplicationStatus.CONTRATADO,
  ApplicationStatus.DESCARTADO,
]);

const STATUS_TEXT: Record<ApplicationStatus, string> = {
  RECIBIDO: "recibida",
  EN_REVISION: "puesta en revisión",
  ENTREVISTA: "seleccionada para una entrevista",
  OFERTA: "seleccionada para una oferta",
  CONTRATADO: "aceptada: ¡te eligieron para el puesto!",
  DESCARTADO: "revisada y no avanzó en este proceso",
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const status = body?.status as ApplicationStatus | undefined;
    if (!status) {
      return NextResponse.json({ success: false, error: "Estado no proporcionado" }, { status: 400 });
    }
    if (!SETTABLE_STATUSES.has(status)) {
      return NextResponse.json({ success: false, error: "Estado de postulación no válido" }, { status: 400 });
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

    if (application.status === status) {
      return NextResponse.json({ success: true, data: application });
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { status }
    });

    // Create notification for the applicant
    try {
      const statusText = STATUS_TEXT[status];

      await prisma.notification.create({
        data: {
          userId: application.applicantId,
          type: "JOB_APPLICATION_STATUS",
          title: "Actualización de Postulación",
          body: `Tu postulación para "${application.jobPost.title}" fue ${statusText}.`,
          link: `/empleos/${application.jobPostId}`
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
// creado por pato dev y askforvini
