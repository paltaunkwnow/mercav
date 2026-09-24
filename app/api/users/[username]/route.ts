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

    const { password: _password, twoFactorSecret: _secret, email: _email, ...publicUser } = user;
    return NextResponse.json(
      { success: true, data: publicUser },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
