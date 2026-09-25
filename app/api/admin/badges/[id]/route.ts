import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Find badge to get icon path
    const badge = await prisma.badge.findUnique({
      where: { id }
    });

    if (!badge) {
      return NextResponse.json({ success: false, error: "Insignia no encontrada" }, { status: 404 });
    }

    // Delete file
    if (badge.icon.startsWith("/uploads/badges/")) {
      try {
        const filePath = path.join(process.cwd(), "public", badge.icon);
        await unlink(filePath);
      } catch (err) {
        console.warn("Could not delete icon file:", err);
      }
    }

    // Delete from DB
    await prisma.badge.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Insignia eliminada" });
  } catch (error) {
    console.error("Error deleting badge:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por Patodev y Invertilo
