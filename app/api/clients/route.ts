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

    const body = await req.json();
    const { nit, name, email, phone } = body;

    if (!nit || !name) {
      return NextResponse.json({ success: false, error: "NIT/CI and Name are required" }, { status: 400 });
    }

    const cleanNit = nit.toString().trim();
    const cleanName = name.toString().trim();

    // Check if already exists
    const existing = await prisma.billingClient.findUnique({
      where: { nit: cleanNit }
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing, isNew: false });
    }

    const newClient = await prisma.billingClient.create({
      data: {
        nit: cleanNit,
        name: cleanName,
        email: email || null,
        phone: phone || null
      }
    });

    return NextResponse.json({ success: true, data: newClient, isNew: true });
  } catch (error: any) {
    console.error("CLIENTS_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
