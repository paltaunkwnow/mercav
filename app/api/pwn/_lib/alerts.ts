import { prisma } from "@/lib/prisma";
import { buildAlert, type BuildAlertInput } from "@/lib/pwn/alert-engine";

type OpenAlertInput = BuildAlertInput & {
  userId: string;
  targetId: string;
  sourceId?: string | null;
};

/** Creates one open in-app alert per target and title. Repeating the same event is a no-op. */
export async function openAlert(input: OpenAlertInput) {
  if (input.verificationStatus === "DISPUTED") return null;
  const built = buildAlert(input);
  const existing = await prisma.pwnAlert.findFirst({
    where: {
      userId: input.userId,
      targetId: input.targetId,
      title: built.title,
      // Sin filtrar por estado: antes, al marcar la alerta como leída (READ),
      // el ciclo horario volvía a crear la misma alerta cada hora.
    },
    select: { id: true },
  });
  if (existing) return { ...existing, created: false as const };
  const created = await prisma.pwnAlert.create({
    data: {
      userId: input.userId,
      targetId: input.targetId,
      sourceId: input.sourceId ?? null,
      title: built.title,
      body: built.body,
      severity: built.severity,
      status: "OPEN",
    },
    select: { id: true },
  });
  return { ...created, created: true as const };
}
// creado por pato dev y askforvini
