import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/checkPlanLimit";
import { EmploymentType, ExperienceLevel, Prisma, QuestionType, WorkMode } from "@prisma/client";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const optStr = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
function optInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  // salaryMin/Max son Int: el formulario manda parseFloat y un decimal hacía fallar Prisma
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? Math.round(n) : null;
}
const inEnum = <T extends string>(e: Record<string, T>, v: unknown): v is T => typeof v === "string" && (Object.values(e) as string[]).includes(v);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    
    // No listar vacantes en revisión de moderación
    const whereClause: Prisma.JobPostWhereInput = { isActive: true, isUnderReview: false };
    if (city) whereClause.city = { contains: city.slice(0, 100), mode: 'insensitive' };

    const jobs = await prisma.jobPost.findMany({
      where: whereClause,
      include: {
        company: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

    // El límite del plan FREE (1 vacante/mes) existía en checkPlanLimit pero no se aplicaba
    const planCheck = await checkPlanLimit(user.id, 'create_job');
    if (!planCheck.allowed) return NextResponse.json({ success: false, error: planCheck.message }, { status: 403 });

    const title = str(body.title, 150);
    const description = str(body.description, 10000);
    const city = str(body.city, 100);
    const country = str(body.country, 100);
    if (!title || !description || !city || !country) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!inEnum(EmploymentType, body.employmentType) || !inEnum(WorkMode, body.workMode) || !inEnum(ExperienceLevel, body.experienceLevel)) {
      return NextResponse.json({ success: false, error: "Tipo de empleo, modalidad o experiencia inválidos" }, { status: 400 });
    }
    const salaryMin = optInt(body.salaryMin);
    const salaryMax = optInt(body.salaryMax);
    if (salaryMin !== null && salaryMax !== null && salaryMax > 0 && salaryMin > salaryMax) {
      return NextResponse.json({ success: false, error: "El salario mínimo no puede superar al máximo" }, { status: 400 });
    }

    // Preguntas: solo los campos permitidos (antes el body iba directo a un nested create)
    const rawQuestions: unknown[] = Array.isArray(body.questions) ? body.questions.slice(0, 20) : [];
    const questions = rawQuestions
      .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
      .map((q) => ({
        question: str(q.question, 500),
        type: inEnum(QuestionType, q.type) ? q.type : QuestionType.TEXTO,
        options: Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === "string").slice(0, 20).map((o) => o.slice(0, 200)) : [],
        isRequired: q.isRequired !== false,
      }))
      .filter((q) => q.question);

    const job = await prisma.jobPost.create({
      data: {
        companyId: user.id,
        title,
        description,
        requirements: str(body.requirements, 10000),
        responsibilities: optStr(body.responsibilities, 10000),
        benefits: optStr(body.benefits, 10000),
        employmentType: body.employmentType,
        workMode: body.workMode,
        city,
        country,
        salaryMin,
        salaryMax,
        salaryCurrency: optStr(body.salaryCurrency, 3)?.toUpperCase() ?? null,
        salaryVisible: body.salaryVisible === true,
        experienceLevel: body.experienceLevel,
        questions: {
          create: questions
        }
      }
    });

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
