import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
            profile: {
              select: {
                headline: true
              }
            }
          }
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

    const body = await req.json();
    const updated = await prisma.jobPost.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        city: body.city,
        employmentType: body.employmentType,
        salaryMin: Number(body.salaryMin || 0),
        salaryMax: Number(body.salaryMax || 0),
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
