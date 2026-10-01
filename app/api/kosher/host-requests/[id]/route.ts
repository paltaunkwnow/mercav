import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/kosher/notify";
import { forbidden, getKosherViewer, kosherError, unauthorized, writeGuard } from "@/lib/kosher/server";

const schema = z.object({ status: z.enum(["accepted", "declined"]) });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getKosherViewer();
  const guard = writeGuard(viewer);
  if (guard || !viewer) return guard ?? unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Respuesta no válida");

  const req = await prisma.kosherHostRequest.findUnique({ where: { id: params.id }, include: { host: { select: { userId: true } } } });
  if (!req) return kosherError(404, "Pedido no encontrado");
  if (req.host.userId !== viewer.id) return forbidden();
  if (req.status !== "pending") return kosherError(409, "Ya respondiste este pedido.");

  const accepted = parsed.data.status === "accepted";
  // Update condicionado a "pending": un doble clic ya no crea dos conversaciones ni notifica dos veces.
  const applied = await prisma.$transaction(async (tx) => {
    const marked = await tx.kosherHostRequest.updateMany({
      where: { id: req.id, status: "pending" },
      data: { status: parsed.data.status },
    });
    if (marked.count === 0) return false;
    if (!accepted) return true;
    await tx.conversation.create({
      data: {
        context: "GENERAL",
        contextId: `kosher-host:${req.id}`,
        participants: { connect: [{ id: viewer.id }, { id: req.guestId }] },
        messages: {
          create: {
            senderId: viewer.id,
            content: `¡Shabat shalom! Acepté tu pedido para el ${req.date.toISOString().slice(0, 10)}. Escribime por acá y coordinamos horario y dirección.`,
          },
        },
      },
    });
    return true;
  });
  if (!applied) return kosherError(409, "Ya respondiste este pedido.");
  await notifyUser(
    req.guestId,
    accepted ? "¡Te esperan para Shabat!" : "Tu pedido de Shabat",
    accepted ? `${viewer.name.split(" ")[0]} aceptó tu pedido. Te abrimos una conversación en Mensajes para coordinar.` : "Esta vez no tienen lugar. Probá con otra mesa de la ciudad.",
    accepted ? "/mensajes" : "/kosher/comunidad/shabat#mis-pedidos",
  );
  return NextResponse.json({ success: true });
}
