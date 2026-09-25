import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { isAdminUser } from "@/lib/admin";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

async function loadParticipant(orderId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: { id: true, clientId: true, providerId: true },
  });
  if (!order) return null;
  const allowed = order.clientId === user.id || order.providerId === user.id || (await isAdminUser(user.id));
  if (!allowed) return null;
  return { user, order };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const access = await loadParticipant(params.id, session.user.email);
    if (!access) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "El archivo excede el límite de 5MB" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ success: false, error: "Solo se permiten imágenes JPEG, PNG, WebP o PDF" }, { status: 400 });
    }

    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(dir, filename);
    if (!uploadPath.startsWith(dir + path.sep)) {
      return NextResponse.json({ success: false, error: "Ruta inválida" }, { status: 400 });
    }

    await mkdir(dir, { recursive: true });
    await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

    const projectFile = await prisma.projectFile.create({
      data: {
        orderId: params.id,
        name: path.basename(file.name).slice(0, 180) || filename,
        url: `/uploads/${filename}`,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        type: file.type.startsWith("image/") ? "image" : "pdf",
        uploadedById: access.user.id,
      },
    });

    return NextResponse.json({ success: true, data: projectFile });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ success: false, error: "Error al subir el archivo" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const access = await loadParticipant(params.id, session.user.email);
    if (!access) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });

    const files = await prisma.projectFile.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: files });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener archivos" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
