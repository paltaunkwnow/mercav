import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/business/audit";
import { adjust, programView } from "@/lib/business/loyalty/service";
import { customerDetail } from "@/lib/business/loyalty/stats";
import { apiProgram, fail, ok, zodError } from "../../../_shared";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string; programId: string; cardId: string } };

const PatchSchema = z.discriminatedUnion(
  "action",
  [
    z.object({ action: z.literal("block") }),
    z.object({ action: z.literal("unblock") }),
    z.object({
      action: z.literal("adjust"),
      delta: z
        .number({ error: "Poné cuánto sumar o restar." })
        .int("El ajuste tiene que ser un número entero.")
        .min(-100_000, "El ajuste es muy grande.")
        .max(100_000, "El ajuste es muy grande.")
        .refine((v) => v !== 0, "El ajuste no puede ser 0."),
      note: z.string({ error: "Contá el motivo del ajuste." }).trim().min(3, "Contá el motivo del ajuste.").max(200, "El motivo es muy largo."),
    }),
  ],
  { error: "Acción inválida." },
);

export async function GET(_req: Request, { params }: Params) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.view");
  if ("error" in found) return found.error;
  const detail = await customerDetail(programView(found.program), params.cardId);
  if (!detail) return fail("No encontrado", 404);
  return ok(detail);
}

/** Bloquear, desbloquear o ajustar el saldo (con motivo). */
export async function PATCH(req: Request, { params }: Params) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.manage");
  if ("error" in found) return found.error;
  const { ctx, program } = found;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(zodError(parsed.error));
  const input = parsed.data;
  const view = programView(program);

  if (input.action === "adjust") {
    const result = await adjust({ program, cardId: params.cardId, delta: input.delta, note: input.note, actorUserId: ctx.userId });
    if (!result.ok) return fail(result.message, result.status);
    await audit(ctx.workspace.id, ctx.userId, "loyalty.card.adjust", "LoyaltyCard", params.cardId, { delta: input.delta, note: input.note, balanceAfter: result.card.balance });
  } else {
    const status = input.action === "block" ? "BLOCKED" : "ACTIVE";
    const done = await prisma.loyaltyCard.updateMany({ where: { id: params.cardId, programId: program.id }, data: { status } });
    if (done.count !== 1) return fail("No encontrado", 404);
    await audit(ctx.workspace.id, ctx.userId, input.action === "block" ? "loyalty.card.block" : "loyalty.card.unblock", "LoyaltyCard", params.cardId);
  }

  const detail = await customerDetail(view, params.cardId);
  if (!detail) return fail("No encontrado", 404);
  return ok(detail);
}
// creado por pato dev y askforvini
