import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const limited = await checkRateLimit(request, { route: "kosher-confirm", capacity: 20, refillPerMinute: 10, userId: viewer.id });
  if (limited) return limited;

  try {
    await prisma.$transaction([
      prisma.kosherStockConfirmation.create({ data: { reportId: params.id, userId: viewer.id } }),
      prisma.kosherStockReport.update({
        where: { id: params.id },
        data: { confirmations: { increment: 1 }, confirmedAt: new Date() },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return kosherError(409, "Ya confirmaste este reporte.");
      if (error.code === "P2003" || error.code === "P2025") return kosherError(404, "Reporte no encontrado");
    }
    throw error;
  }
  return NextResponse.json({ success: true });
}
