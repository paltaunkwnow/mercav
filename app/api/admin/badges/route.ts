export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (
      (session.user as any).role === "ADMIN" || 
      (session.user as any).roles?.includes("ADMIN")
    );

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const badges = await prisma.badge.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Standardize admin check
    const isAdmin = session?.user && (
      (session.user as any).role === "ADMIN" || 
      (session.user as any).roles?.includes("ADMIN")
    );

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!file || !name) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Validate PNG
    if (file.type !== "image/png" && !file.name.endsWith('.png')) {
      return NextResponse.json({ success: false, error: "Solo se permiten archivos PNG" }, { status: 400 });
    }

    // Validate Size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Archivo demasiado grande (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `${randomUUID()}.png`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "badges");
    const filePath = path.join(uploadDir, filename);

    try {
      await writeFile(filePath, buffer);
    } catch (fsError) {
      console.error("FS Error:", fsError);
      return NextResponse.json({ success: false, error: "Error al guardar el archivo" }, { status: 500 });
    }

    const iconUrl = `/uploads/badges/${filename}`;

    try {
      const badge = await prisma.badge.create({
        data: {
          name,
          description,
          icon: iconUrl
        }
      });
      return NextResponse.json({ success: true, data: badge });
    } catch (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ success: false, error: "Error al registrar en base de datos" }, { status: 500 });
    }

  } catch (error) {
    console.error("General Error creating badge:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
