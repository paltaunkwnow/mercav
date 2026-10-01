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

    const body = await req.json().catch(() => null);

    const jobPost = await prisma.jobPost.findUnique({
      where: { id: params.id },
      include: { questions: { select: { id: true, isRequired: true } } },
    });
    if (!jobPost) return NextResponse.json({ success: false, error: "Vacante no encontrada" }, { status: 404 });
    if (!jobPost.isActive || jobPost.isUnderReview || (jobPost.expiresAt && jobPost.expiresAt < new Date())) {
      return NextResponse.json({ success: false, error: "Esta vacante ya no recibe postulaciones" }, { status: 409 });
    }
    if (jobPost.companyId === user.id) {
      return NextResponse.json({ success: false, error: "No podés postularte a tu propia vacante" }, { status: 400 });
    }
    const already = await prisma.application.findUnique({
      where: { jobPostId_applicantId: { jobPostId: jobPost.id, applicantId: user.id } },
      select: { id: true },
    });
    if (already) return NextResponse.json({ success: false, error: "Ya te postulaste a esta vacante" }, { status: 409 });

    // Respuestas: solo a preguntas de ESTA vacante y solo los campos permitidos
    // (antes body.answers iba directo a un nested create).
    const questionIds = new Set(jobPost.questions.map((q) => q.id));
    const rawAnswers: unknown[] = Array.isArray(body?.answers) ? body.answers : [];
    const answers = rawAnswers
      .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
      .filter((a) => typeof a.questionId === "string" && questionIds.has(a.questionId) && typeof a.answer === "string")
      .map((a) => ({ questionId: a.questionId as string, answer: (a.answer as string).slice(0, 5000) }));
    const answered = new Set(answers.filter((a) => a.answer.trim()).map((a) => a.questionId));
    if (jobPost.questions.some((q) => q.isRequired && !answered.has(q.id))) {
      return NextResponse.json({ success: false, error: "Respondé las preguntas obligatorias" }, { status: 400 });
    }
    const coverLetter = typeof body?.coverLetter === "string" ? body.coverLetter.slice(0, 10000) : null;

    const planCheck = await checkPlanLimit(user.id, 'apply_job');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });

    const application = await prisma.application.create({
      data: {
        jobPostId: jobPost.id,
        applicantId: user.id,
        coverLetter,
        status: "RECIBIDO",
        answers: {
          create: answers
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
// creado por pato dev y askforvini
