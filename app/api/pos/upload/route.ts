import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return NextResponse.json({ success: false, error: "Solo se permiten imágenes JPG o PNG" }, { status: 400 });
    }

    // 5MB Limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "El archivo excede el límite de 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "pos");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {}

    // Create a unique filename
    const filename = `logo-${user.id}-${Date.now()}${path.extname(file.name)}`;
    const uploadPath = path.join(uploadsDir, filename);

    await writeFile(uploadPath, buffer);
    const fileUrl = `/uploads/pos/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error uploading POS logo:", error);
    return NextResponse.json({ success: false, error: "Error al subir el logo" }, { status: 500 });
  }
}
