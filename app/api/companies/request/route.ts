import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";

    if (!companyName || companyName.length > 150) {
      return NextResponse.json({ success: false, error: "Nombre de empresa requerido" }, { status: 400 });
    }

    // 1. Find or create the company (unverified for now)
    let company = await prisma.company.findUnique({
      where: { name: companyName }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyName,
          isVerified: false
        }
      });
    }

    // 2. Check if user already has a membership (pending or approved)
    const existingMembership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: company.id,
          userId: (session.user as any).id
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ 
        success: false, 
        error: `Ya tienes una solicitud ${existingMembership.status === 'PENDING' ? 'pendiente' : 'aprobada'} para esta empresa.` 
      }, { status: 400 });
    }

    // 3. Create the pending membership
    const membership = await prisma.companyMember.create({
      data: {
        companyId: company.id,
        userId: (session.user as any).id,
        status: "PENDING",
        role: "MEMBER"
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: membership,
      message: "Solicitud enviada con éxito. Un administrador debe aprobarla." 
    });

  } catch (error) {
    console.error("Error in company request:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
