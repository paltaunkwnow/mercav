import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const memberships = await prisma.companyMember.findMany({
      where: {
        userId: user.id,
        status: "APPROVED"
      },
      include: {
        company: true
      }
    });

    const companies = memberships.map(m => m.company);

    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener empresas" }, { status: 500 });
  }
}
