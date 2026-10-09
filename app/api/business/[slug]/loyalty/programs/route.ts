import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";
import { encryptField } from "@/lib/business/crypto";
import { uniqueSlug } from "@/lib/business/slug";
import { newKioskSecret } from "@/lib/business/loyalty/codes";
import { programInclude, programView } from "@/lib/business/loyalty/service";
import { programSummaries } from "@/lib/business/loyalty/stats";
import { checkWorkspaceLimit } from "@/lib/checkPlanLimit";
import { ProgramInputSchema, asJson, fail, normalizeProgram, ok, zodError } from "./_shared";

export const dynamic = "force-dynamic";

/** Programas de la empresa con sus números chicos (miembros, activos y canjes de 30 días). */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "loyalty.view");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const programs = await prisma.loyaltyProgram.findMany({ where: { workspaceId: ctx.workspace.id }, include: programInclude, orderBy: { createdAt: "desc" } });
  const summaries = await programSummaries(programs.map((p) => p.id));
  return ok(
    programs.map((p) => {
      const view = programView(p);
      return { id: view.id, slug: view.slug, name: view.name, type: view.type, businessType: view.businessType, status: view.status, icon: view.design.icon, ...summaries.get(p.id) };
    }),
  );
}

/** Crea un programa en borrador. Queda listo para revisar y activar. */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "loyalty.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const parsed = ProgramInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(zodError(parsed.error));
  const normalized = normalizeProgram(parsed.data, ctx.workspace.name);
  if (!normalized.ok) return fail(normalized.error);
  const p = normalized.value;

  // Plan Gratis del dueño: 1 programa (no archivado) por empresa.
  const limit = await checkWorkspaceLimit(ctx.workspace, "add_loyalty_program");
  if (!limit.allowed) return fail(limit.message, 403);
  const count = await prisma.loyaltyProgram.count({ where: { workspaceId: ctx.workspace.id, status: { not: "ARCHIVED" } } });
  if (count >= 20) return fail("Llegaste al máximo de 20 programas. Archivá alguno para crear otro.");

  let program: { id: string; slug: string } | null = null;
  // Dos altas a la vez pueden elegir el mismo slug: la segunda choca con la clave única y prueba otro.
  for (let attempt = 0; attempt < 3 && !program; attempt++) {
    const slug = await uniqueSlug(`${ctx.workspace.name} ${p.name}`, async (candidate) => !!(await prisma.loyaltyProgram.findUnique({ where: { slug: candidate }, select: { id: true } })));
    try {
      program = await prisma.loyaltyProgram.create({
        data: {
          workspaceId: ctx.workspace.id,
          slug,
          name: p.name,
          type: p.type,
          businessType: p.businessType,
          rules: asJson(p.rules),
          design: asJson(p.design),
          status: "DRAFT",
          kioskSecretEnc: encryptField(newKioskSecret()),
          createdById: ctx.userId,
          rewards: { create: p.rewards.map((r) => ({ name: r.name, cost: r.cost, description: r.description, active: r.active, sortOrder: r.sortOrder })) },
        },
        select: { id: true, slug: true },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  if (!program) return fail("No pudimos crear el programa. Probá de nuevo.", 500);
  await audit(ctx.workspace.id, ctx.userId, "loyalty.program.create", "LoyaltyProgram", program.id, { type: p.type, businessType: p.businessType, rewards: p.rewards.length });
  return ok({ id: program.id, slug: program.slug });
}
// creado por pato dev y askforvini
