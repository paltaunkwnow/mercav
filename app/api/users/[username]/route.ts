import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { username: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
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
        },
        spaces: { where: { isActive: true } },
        services: { where: { isActive: true } },
        jobPosts: { where: { isActive: true } },
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Perfil público: además de password/2FA/email, ocultar documentos (NIT/CI), datos de sanción
    // y el salario si el usuario no lo hizo visible.
    const {
      password: _password,
      twoFactorSecret: _secret,
      email: _email,
      nit: _nit,
      ci: _ci,
      sanctionReason: _sanctionReason,
      sanctionExpiresAt: _sanctionExpiresAt,
      planExpiresAt: _planExpiresAt,
      lastBusinessWorkspaceId: _lastWorkspace,
      clubCode: _clubCode,
      isSanctioned: _isSanctioned,
      ...publicUser
    } = user;
    if (publicUser.profile && !publicUser.profile.salaryVisible) {
      publicUser.profile = { ...publicUser.profile, salaryMin: null, salaryMax: null };
    }
    return NextResponse.json(
      { success: true, data: publicUser },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
