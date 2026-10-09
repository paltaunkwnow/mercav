import { NextResponse } from "next/server";
import { getPosScope } from "@/lib/pos/server";
import { can } from "@/lib/business/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    // Fotos de productos (inventario) o el logo de la tienda (configuración).
    const res = await getPosScope(req, "pos.sell");
    if (!res.ok) return res.response;
    const { scope } = res;
    if (scope.workspaceId && !can(scope.role, "pos.inventory") && !can(scope.role, "pos.configure")) {
      return NextResponse.json({ success: false, error: "No tenés permiso para esto" }, { status: 403 });
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
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `logo-${scope.userId}-${Date.now()}.${ext}`;
    const uploadPath = path.join(uploadsDir, filename);

    await writeFile(uploadPath, buffer);
    const fileUrl = `/uploads/pos/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error uploading POS logo:", error);
    return NextResponse.json({ success: false, error: "Error al subir el logo" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
