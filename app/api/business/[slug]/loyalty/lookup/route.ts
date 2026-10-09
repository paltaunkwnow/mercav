import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { normalizePhone, programInclude } from "@/lib/business/loyalty/service";
import { fail, limitByIp, ok } from "@/app/api/loyalty/_lib/http";
import { staffCardPayload } from "@/app/api/loyalty/_lib/staff";

export const dynamic = "force-dynamic";

const LookupSchema = z.object({
  programId: z.string({ error: "Elegí el club." }).min(1, "Elegí el club.").max(64),
  phone: z.string({ error: "Escribí el celular." }).trim().min(1, "Escribí el celular.").max(30, "Revisá el número de celular."),
});

/**
 * Buscar una tarjeta por celular (cuando el cliente no tiene el link a mano).
 * Coincidencia exacta del número normalizado dentro de un programa de la empresa: a lo sumo una tarjeta.
 * Va por POST para que el número no quede en URLs ni en registros.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "loyalty.stamp");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const limited = await limitByIp(req, "loyalty:lookup", 20, 10, ctx.userId);
  if (limited) return limited;

  const parsed = LookupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);

  const program = await prisma.loyaltyProgram.findFirst({ where: { id: parsed.data.programId, workspaceId: ctx.workspace.id }, select: { id: true } });
  if (!program) return fail("No encontramos ese club en tu negocio.", 404);

  const phone = normalizePhone(parsed.data.phone, ctx.workspace.country);
  if (!phone) return fail("Revisá el número de celular.", 400);

  const card = await prisma.loyaltyCard.findUnique({ where: { programId_phone: { programId: program.id, phone } }, include: { program: { include: programInclude } } });
  if (!card) return fail("No hay ninguna tarjeta con ese celular.", 404, { code: "NOT_FOUND" });
  if (card.status === "BLOCKED") return fail("Esta tarjeta está bloqueada. Consultá con el encargado.", 400, { code: "BLOCKED" });

  return ok(await staffCardPayload(card));
}
// creado por pato dev y askforvini
