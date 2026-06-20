import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // 5MB Limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "El archivo excede el límite de 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);

    await writeFile(uploadPath, buffer);
    const fileUrl = `/uploads/${filename}`;

    const projectFile = await prisma.projectFile.create({
      data: {
        orderId: params.id,
        name: file.name,
        url: fileUrl,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        type: file.type.includes("image") ? "image" : "pdf",
        uploadedById: user.id
      }
    });

    return NextResponse.json({ success: true, data: projectFile });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ success: false, error: "Error al subir el archivo" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const files = await prisma.projectFile.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: files });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al obtener archivos" }, { status: 500 });
  }
}
