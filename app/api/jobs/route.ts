import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    
    let whereClause: any = { isActive: true };
    if (city) whereClause.city = { contains: city, mode: 'insensitive' };

    const jobs = await prisma.jobPost.findMany({
      where: whereClause,
      include: {
        company: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
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

    const body = await req.json();
    
    const job = await prisma.jobPost.create({
      data: {
        companyId: user.id,
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        responsibilities: body.responsibilities,
        benefits: body.benefits,
        employmentType: body.employmentType,
        workMode: body.workMode,
        city: body.city,
        country: body.country,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryCurrency: body.salaryCurrency,
        salaryVisible: body.salaryVisible,
        experienceLevel: body.experienceLevel,
        questions: {
          create: body.questions || []
        }
      }
    });

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
