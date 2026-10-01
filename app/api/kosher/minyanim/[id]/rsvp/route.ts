import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MINYAN_SIZE, PRAYER } from "@/lib/kosher/labels";
import { notifyUser } from "@/lib/kosher/notify";
import { getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();

  const minyan = await prisma.kosherMinyan.findUnique({ where: { id: params.id }, select: { id: true, prayer: true, city: true, startsAt: true, createdById: true } });
  if (!minyan || minyan.startsAt.getTime() < Date.now() - 30 * 60_000) return kosherError(404, "Este minián ya pasó.");

  const key = { minyanId_userId: { minyanId: minyan.id, userId: viewer.id } };
  const existing = await prisma.kosherMinyanRsvp.findUnique({ where: key });
  if (existing) {
    // deleteMany: un doble clic concurrente no revienta con P2025.
    await prisma.kosherMinyanRsvp.deleteMany({ where: { minyanId: minyan.id, userId: viewer.id } });
    return NextResponse.json({ success: true, going: false });
  }
  try {
    await prisma.kosherMinyanRsvp.create({ data: { minyanId: minyan.id, userId: viewer.id } });
  } catch (error) {
    // Otro request del mismo usuario ganó la carrera: ya está anotado, sin re-notificar.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const count = await prisma.kosherMinyanRsvp.count({ where: { minyanId: minyan.id } });
      return NextResponse.json({ success: true, going: true, count });
    }
    throw error;
  }
  const count = await prisma.kosherMinyanRsvp.count({ where: { minyanId: minyan.id } });
  if (count === MINYAN_SIZE) {
    const going = await prisma.kosherMinyanRsvp.findMany({ where: { minyanId: minyan.id }, select: { userId: true } });
    await Promise.all(
      going.map((g) =>
        notifyUser(g.userId, `¡Hay minián para ${PRAYER[minyan.prayer]}!`, `Ya son ${MINYAN_SIZE} en ${minyan.city}.`, "/kosher/comunidad/minian"),
      ),
    );
  }
  return NextResponse.json({ success: true, going: true, count });
}
