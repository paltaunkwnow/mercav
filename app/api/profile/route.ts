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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }
    const email = session.user.email.toLowerCase();

    // Validaciones mínimas de los campos que se renderizan públicamente
    const tooLong = (v: unknown, max: number) => v !== undefined && v !== null && (typeof v !== "string" || v.length > max);
    if (tooLong(body.name, 100) || tooLong(body.bio, 600) || tooLong(body.location, 150) || tooLong(body.headline, 200)) {
      return NextResponse.json({ success: false, error: "Algún campo es demasiado largo" }, { status: 400 });
    }
    if (typeof body.name === "string" && !body.name.trim()) {
      return NextResponse.json({ success: false, error: "El nombre no puede quedar vacío" }, { status: 400 });
    }
    // website se renderiza como <a href>: solo http(s). Un `javascript:` era XSS almacenado.
    // Si no trae esquema (p. ej. "mercav.lat") se antepone https://.
    let website: string | null | undefined = body.website;
    if (typeof website === "string") {
      website = website.trim();
      if (!website) {
        website = null;
      } else {
        if (!/^[a-z][a-z0-9+.-]*:/i.test(website)) website = `https://${website}`;
        if (website.length > 2048 || !/^https?:\/\/[^\s]+$/i.test(website)) {
          return NextResponse.json({ success: false, error: "El sitio web debe ser una URL http(s) válida" }, { status: 400 });
        }
      }
    } else if (website !== undefined && website !== null) {
      return NextResponse.json({ success: false, error: "Sitio web inválido" }, { status: 400 });
    }
    for (const list of ["experiences", "educations", "skills"]) {
      if (body[list] !== undefined && body[list] !== null && (!Array.isArray(body[list]) || body[list].length > 50)) {
        return NextResponse.json({ success: false, error: "Lista de perfil inválida" }, { status: 400 });
      }
    }

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
          website,
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
          website,
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

    // No devolver el hash de la contraseña ni el secreto 2FA (antes iban en result.user)
    const { password: _password, twoFactorSecret: _secret, ...safeUser } = result.user;
    return NextResponse.json({ success: true, data: { ...result, user: safeUser } });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
