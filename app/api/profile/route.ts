import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      include: { 
        profile: {
          include: {
            experiences: true,
            educations: true,
            skills: true,
            languages: true,
            certifications: true,
          }
        } 
      }
    });

    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const { password: _password, twoFactorSecret: _secret, ...safeUser } = user;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const email = session.user.email.toLowerCase();

    // Start a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User
      const updatedUser = await tx.user.update({
        where: { email },
        data: {
          name: body.name,
          bio: body.bio,
          location: body.location,
          avatar: body.avatar,
          coverImage: body.coverImage
        }
      });

      // 2. Upsert Profile
      const updatedProfile = await tx.profile.upsert({
        where: { userId: updatedUser.id },
        update: {
          headline: body.headline,
          publicEmail: body.publicEmail,
          website: body.website,
          profileType: body.profileType,
          workMode: body.workMode,
          availabilityStatus: body.availabilityStatus,
          salaryMin: body.salaryMin ? parseInt(body.salaryMin) : null,
          salaryMax: body.salaryMax ? parseInt(body.salaryMax) : null,
          salaryCurrency: body.salaryCurrency,
          salaryVisible: body.salaryVisible || false,
        },
        create: {
          userId: updatedUser.id,
          headline: body.headline,
          publicEmail: body.publicEmail,
          website: body.website,
          profileType: body.profileType,
          workMode: body.workMode,
          availabilityStatus: body.availabilityStatus,
          salaryMin: body.salaryMin ? parseInt(body.salaryMin) : null,
          salaryMax: body.salaryMax ? parseInt(body.salaryMax) : null,
          salaryCurrency: body.salaryCurrency,
          salaryVisible: body.salaryVisible || false,
        }
      });

      // 3. Handle Experiences (Delete all and recreate for simplicity in this edit flow)
      await tx.experience.deleteMany({ where: { profileId: updatedProfile.id } });
      if (body.experiences && Array.isArray(body.experiences)) {
        await tx.experience.createMany({
          data: body.experiences.map((exp: any) => ({
            profileId: updatedProfile.id,
            company: exp.company,
            position: exp.position,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            currentJob: exp.currentJob || false,
            description: exp.description
          }))
        });
      }

      // 4. Handle Educations
      await tx.education.deleteMany({ where: { profileId: updatedProfile.id } });
      if (body.educations && Array.isArray(body.educations)) {
        await tx.education.createMany({
          data: body.educations.map((edu: any) => ({
            profileId: updatedProfile.id,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startYear: edu.startYear,
            endYear: edu.endYear,
            currentlyStudying: edu.currentlyStudying || false
          }))
        });
      }

      // 5. Handle Skills
      await tx.skill.deleteMany({ where: { profileId: updatedProfile.id } });
      if (body.skills && Array.isArray(body.skills)) {
        await tx.skill.createMany({
          data: body.skills.map((s: any) => ({
            profileId: updatedProfile.id,
            name: s.name,
            level: s.level || "INTERMEDIO"
          }))
        });
      }

      // 6. Calculate completeness
      const completenessFields = [
        updatedUser.name,
        updatedUser.bio,
        updatedUser.location,
        updatedUser.avatar,
        updatedProfile.headline,
        body.experiences?.length > 0,
        body.skills?.length > 0
      ].filter(Boolean);
      const completeness = Math.min(100, Math.round((completenessFields.length / 7) * 100));

      const finalUser = await tx.user.update({
        where: { id: updatedUser.id },
        data: { profileCompleteness: completeness }
      });

      return { user: finalUser, profile: updatedProfile };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Error interno: " + (error as any).message }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
