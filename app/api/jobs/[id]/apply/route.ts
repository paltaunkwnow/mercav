import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/checkPlanLimit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    
    const jobPost = await prisma.jobPost.findUnique({ where: { id: params.id } });
    if (!jobPost) return NextResponse.json({ success: false, error: "Vacante no encontrada" }, { status: 404 });

    const planCheck = await checkPlanLimit(user.id, 'apply_job');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });

    const application = await prisma.application.create({
      data: {
        jobPostId: jobPost.id,
        applicantId: user.id,
        coverLetter: body.coverLetter,
        status: "RECIBIDO",
        answers: {
          create: body.answers
        }
      }
    });

    // Notify the company/employer
    try {
      await prisma.notification.create({
        data: {
          userId: jobPost.companyId,
          type: "NEW_APPLICATION",
          title: "Nuevo Postulante",
          body: `Has recibido una nueva postulación para el puesto "${jobPost.title}" de parte de ${user.name}.`,
          link: `/dashboard/postulantes`
        }
      });
    } catch (notifErr) {
      console.error("Failed to notify employer:", notifErr);
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    console.error("Error applying to job:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
