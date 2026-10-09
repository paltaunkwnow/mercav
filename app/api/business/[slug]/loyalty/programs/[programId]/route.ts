import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/business/audit";
import { encryptField } from "@/lib/business/crypto";
import { newKioskSecret } from "@/lib/business/loyalty/codes";
import { loadProgram, programView } from "@/lib/business/loyalty/service";
import { ProgramInputSchema, apiProgram, asJson, fail, normalizeProgram, ok, zodError } from "../_shared";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string; programId: string } };
type Status = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

const StatusSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"], { error: "Estado inválido." }) });

/** Desde qué estados se puede llegar a cada uno. Archivado se restaura como pausado. */
const FROM: Record<"ACTIVE" | "PAUSED" | "ARCHIVED", Status[]> = {
  ACTIVE: ["DRAFT", "PAUSED"],
  PAUSED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: ["DRAFT", "ACTIVE", "PAUSED"],
};

export async function GET(_req: Request, { params }: Params) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.view");
  if ("error" in found) return found.error;
  const cards = await prisma.loyaltyCard.count({ where: { programId: found.program.id } });
  return ok({ program: programView(found.program), cards });
}

export async function PATCH(req: Request, { params }: Params) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.manage");
  if ("error" in found) return found.error;
  const { ctx, program } = found;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return fail("Revisá los datos.");

  // Cambio de estado: activar, pausar, archivar o restaurar.
  if ("status" in body) {
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) return fail(zodError(parsed.error));
    const next = parsed.data.status;
    if (program.status === next) return ok({ program: programView(program) });
    if (!FROM[next].includes(program.status)) return fail("Ese cambio de estado no está permitido.");
    if (next === "ACTIVE" && !program.rewards.some((r) => r.active)) return fail("Agregá al menos un premio activo antes de activar.");
    const done = await prisma.loyaltyProgram.updateMany({ where: { id: program.id, workspaceId: ctx.workspace.id, status: { in: FROM[next] } }, data: { status: next } });
    if (done.count !== 1) return fail("El programa cambió mientras tanto. Recargá la página.", 409);
    await audit(ctx.workspace.id, ctx.userId, "loyalty.program.status", "LoyaltyProgram", program.id, { from: program.status, to: next });
    const updated = await loadProgram({ id: program.id });
    return ok({ program: programView(updated!) });
  }

  if (program.status === "ARCHIVED") return fail("Restaurá el programa para editarlo.");
  const parsed = ProgramInputSchema.safeParse(body);
  if (!parsed.success) return fail(zodError(parsed.error));
  const normalized = normalizeProgram(parsed.data, ctx.workspace.name);
  if (!normalized.ok) return fail(normalized.error);
  const p = normalized.value;

  if (p.type !== program.type) {
    const cards = await prisma.loyaltyCard.count({ where: { programId: program.id } });
    if (cards > 0) return fail("No se puede cambiar entre sellos y puntos cuando ya hay clientes. Si querés otro tipo, creá un programa nuevo.");
  }

  const existing = new Map(program.rewards.map((r) => [r.id, r]));
  for (const r of p.rewards) {
    if (r.id && !existing.has(r.id)) return fail("Uno de los premios ya no existe. Recargá la página.", 409);
  }
  const keep = new Set(p.rewards.map((r) => r.id).filter(Boolean));
  if (keep.size !== p.rewards.filter((r) => r.id).length) return fail("Hay un premio repetido. Recargá la página.");
  const removed = program.rewards.filter((r) => !keep.has(r.id));
  // Un premio que ya se canjeó queda en el historial: se desactiva en vez de borrarse.
  const used = removed.length
    ? new Set(
        (await prisma.loyaltyEvent.groupBy({ by: ["rewardId"], where: { programId: program.id, rewardId: { in: removed.map((r) => r.id) } } }))
          .map((g) => g.rewardId)
          .filter(Boolean),
      )
    : new Set<string | null>();
  const toDeactivate = removed.filter((r) => used.has(r.id)).map((r) => r.id);
  const toDelete = removed.filter((r) => !used.has(r.id)).map((r) => r.id);

  await prisma.$transaction(async (tx) => {
    await tx.loyaltyProgram.update({
      where: { id: program.id },
      data: {
        name: p.name,
        type: p.type,
        businessType: p.businessType,
        rules: asJson(p.rules),
        design: asJson(p.design),
        ...(p.rules.selfService && !program.kioskSecretEnc ? { kioskSecretEnc: encryptField(newKioskSecret()) } : {}),
      },
    });
    for (const r of p.rewards) {
      const data = { name: r.name, cost: r.cost, description: r.description, active: r.active, sortOrder: r.sortOrder };
      if (r.id) await tx.loyaltyReward.update({ where: { id: r.id }, data });
      else await tx.loyaltyReward.create({ data: { ...data, programId: program.id } });
    }
    if (toDeactivate.length) await tx.loyaltyReward.updateMany({ where: { id: { in: toDeactivate }, programId: program.id }, data: { active: false, sortOrder: 999 } });
    if (toDelete.length) await tx.loyaltyReward.deleteMany({ where: { id: { in: toDelete }, programId: program.id } });
  });

  const before = programView(program);
  const changed = [
    before.name !== p.name && "name",
    before.type !== p.type && "type",
    before.businessType !== p.businessType && "businessType",
    JSON.stringify(before.rules) !== JSON.stringify(p.rules) && "rules",
    JSON.stringify(before.design) !== JSON.stringify(p.design) && "design",
  ].filter(Boolean);
  await audit(ctx.workspace.id, ctx.userId, "loyalty.program.update", "LoyaltyProgram", program.id, {
    changed: changed as string[],
    rewardsCreated: p.rewards.filter((r) => !r.id).length,
    rewardsDeactivated: toDeactivate.length,
    rewardsDeleted: toDelete.length,
  });
  const updated = await loadProgram({ id: program.id });
  return ok({ program: programView(updated!), deactivated: toDeactivate.length });
}
// creado por pato dev y askforvini
