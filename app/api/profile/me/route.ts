import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          include: {
            experiences: true,
            educations: true,
            skills: true,
            languages: true,
            certifications: true,
            portfolioItems: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: user?.profile || null });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const body = await req.json();
    
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        headline: body.headline,
        availabilityStatus: body.availabilityStatus,
        availabilityWeeks: body.availabilityWeeks,
        workMode: body.workMode,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryVisible: body.salaryVisible,
        salaryCurrency: body.salaryCurrency,
      },
      create: {
        userId: user.id,
        headline: body.headline,
        availabilityStatus: body.availabilityStatus,
        availabilityWeeks: body.availabilityWeeks,
        workMode: body.workMode,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryVisible: body.salaryVisible,
        salaryCurrency: body.salaryCurrency,
      }
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
