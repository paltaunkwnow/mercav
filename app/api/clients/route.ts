import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const q = query.trim();
    if (q.length < 3) {
      return NextResponse.json({ success: true, data: [] });
    }

    const clients = await prisma.billingClient.findMany({
      where: {
        OR: [
          { nit: { equals: q, mode: "insensitive" } },
          { name: { equals: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 5,
      // Sin email/teléfono: la tabla es compartida entre todos los usuarios
      select: { id: true, nit: true, name: true },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    console.error("CLIENTS_GET_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Note: We allow creating clients if user is authenticated (cashier, freelance client, etc.)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const { nit, name, email, phone } = body ?? {};

    if (!nit || !name || (typeof nit !== "string" && typeof nit !== "number") || typeof name !== "string") {
      return NextResponse.json({ success: false, error: "NIT/CI and Name are required" }, { status: 400 });
    }

    const cleanNit = nit.toString().trim().slice(0, 30);
    const cleanName = name.trim().slice(0, 200);
    if (!cleanNit || !cleanName) {
      return NextResponse.json({ success: false, error: "NIT/CI and Name are required" }, { status: 400 });
    }

    // Check if already exists (sin devolver email/teléfono ajenos)
    const existing = await prisma.billingClient.findUnique({
      where: { nit: cleanNit },
      select: { id: true, nit: true, name: true }
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing, isNew: false });
    }

    const newClient = await prisma.billingClient.create({
      data: {
        nit: cleanNit,
        name: cleanName,
        email: typeof email === "string" && email.trim() ? email.trim().slice(0, 254) : null,
        phone: typeof phone === "string" && phone.trim() ? phone.trim().slice(0, 40) : null
      },
      select: { id: true, nit: true, name: true }
    });

    return NextResponse.json({ success: true, data: newClient, isNew: true });
  } catch (error: any) {
    console.error("CLIENTS_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
