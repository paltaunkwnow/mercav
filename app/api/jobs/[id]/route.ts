import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EmploymentType } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.jobPost.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
            // `headline` vive en Profile, no en User
            profile: { select: { headline: true } }
          }
        },
        // La página de postulación usa job.questions; antes no se incluían y nunca se mostraban
        questions: {
          select: { id: true, question: true, type: true, options: true, isRequired: true },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Vacante no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const job = await prisma.jobPost.findUnique({ where: { id: params.id } });

    if (!job || job.companyId !== user?.id) {
      return NextResponse.json({ success: false, error: "No tienes permiso para eliminar esta vacante" }, { status: 403 });
    }

    await prisma.jobPost.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const job = await prisma.jobPost.findUnique({ where: { id: params.id } });

    if (!job || job.companyId !== user?.id) {
      return NextResponse.json({ success: false, error: "No tienes permiso para editar esta vacante" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }
    const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
    const money = (v: unknown) => {
      const n = Number(v || 0);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
    };
    if (body.employmentType !== undefined && !(Object.values(EmploymentType) as string[]).includes(body.employmentType)) {
      return NextResponse.json({ success: false, error: "Tipo de empleo inválido" }, { status: 400 });
    }
    const updated = await prisma.jobPost.update({
      where: { id: params.id },
      data: {
        title: text(body.title, 150),
        description: text(body.description, 10000),
        city: text(body.city, 100),
        employmentType: body.employmentType,
        salaryMin: money(body.salaryMin),
        salaryMax: money(body.salaryMax),
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
