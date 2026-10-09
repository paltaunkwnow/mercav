import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/business/audit";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { zonedToUtc } from "@/lib/kosher/time";
import { normalizeAudience, type CampaignAudience } from "@/lib/business/loyalty/campaigns";
import { programView } from "@/lib/business/loyalty/service";
import { campaignView, countRecipients, listCampaigns } from "@/lib/business/loyalty/stats";
import { DAY_MS } from "@/lib/business/loyalty/stats-core";
import type { LoyaltyProgramView } from "@/lib/business/loyalty/types";
import { apiProgram, asJson, fail, ok, zodError } from "../../_shared";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string; programId: string } };

/** Para no cansar a los clientes. */
const MAX_PER_DAY = 3;

const AudienceSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({ kind: z.literal("all") }),
    z.object({
      kind: z.literal("atRisk"),
      days: z.number({ error: "Poné cuántos días." }).int("Poné cuántos días.").min(7, "Elegí entre 7 y 365 días.").max(365, "Elegí entre 7 y 365 días."),
    }),
    z.object({ kind: z.literal("rewardReady") }),
    z.object({ kind: z.literal("tier"), tier: z.string({ error: "Elegí un nivel." }).trim().min(1, "Elegí un nivel.").max(30) }),
    z.object({ kind: z.literal("birthdayMonth") }),
  ],
  { error: "Elegí a quién le llega el mensaje." },
);

const PreviewSchema = z.object({ audience: AudienceSchema });

const SendSchema = z.object({
  title: z.string({ error: "Poné un título." }).trim().min(2, "Poné un título.").max(60, "El título puede tener hasta 60 caracteres."),
  body: z.string({ error: "Escribí el mensaje." }).trim().min(2, "Escribí el mensaje.").max(240, "El mensaje puede tener hasta 240 caracteres."),
  audience: AudienceSchema,
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí una fecha válida.").nullable().optional(),
});

/** La audiencia "nivel" tiene que existir en el programa. */
function checkAudience(audience: CampaignAudience, program: LoyaltyProgramView) {
  if (audience.kind === "tier" && !program.rules.tiers.some((t) => t.name === audience.tier)) return "Ese nivel ya no existe en el programa.";
  return null;
}

export async function GET(_req: Request, { params }: Params) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.view");
  if ("error" in found) return found.error;
  return ok(await listCampaigns(found.program.id));
}

/** Con ?preview=1 solo cuenta destinatarios. Sin eso, envía la campaña. */
export async function POST(req: Request, { params }: Params) {
  const preview = new URL(req.url).searchParams.get("preview") === "1";
  const body = await req.json().catch(() => null);

  if (preview) {
    const found = await apiProgram(params.slug, params.programId, "loyalty.view");
    if ("error" in found) return found.error;
    const parsed = PreviewSchema.safeParse(body);
    if (!parsed.success) return fail(zodError(parsed.error));
    const view = programView(found.program);
    const audience = normalizeAudience(parsed.data.audience);
    const problem = checkAudience(audience, view);
    if (problem) return fail(problem);
    return ok({ recipients: await countRecipients(view, audience) });
  }

  const found = await apiProgram(params.slug, params.programId, "loyalty.manage");
  if ("error" in found) return found.error;
  const { ctx, program } = found;
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) return fail(zodError(parsed.error));
  const input = parsed.data;
  if (program.status === "ARCHIVED") return fail("El programa está archivado.");
  if (program.status === "DRAFT") return fail("Activá el programa antes de mandar mensajes.");

  const view = programView(program);
  const audience = normalizeAudience(input.audience);
  const problem = checkAudience(audience, view);
  if (problem) return fail(problem);

  const now = new Date();
  const tz = latamCountry(ctx.workspace.country).timezone;
  let expiresAt: Date | null = null;
  if (input.expiresOn) {
    if (input.expiresOn < todayIn(tz, now)) return fail("La fecha de vencimiento ya pasó.");
    if (input.expiresOn > todayIn(tz, new Date(now.getTime() + 366 * DAY_MS))) return fail("El mensaje puede durar hasta un año.");
    expiresAt = zonedToUtc(`${input.expiresOn}T23:59`, tz);
    if (!expiresAt) return fail("Elegí una fecha válida.");
  }

  const recent = await prisma.loyaltyCampaign.count({ where: { programId: program.id, createdAt: { gte: new Date(now.getTime() - DAY_MS) } } });
  if (recent >= MAX_PER_DAY) return fail(`Para no cansar a tus clientes, podés mandar hasta ${MAX_PER_DAY} mensajes por día.`, 429);

  const recipients = await countRecipients(view, audience, now);
  if (recipients === 0) return fail("Con ese público no le llega a nadie. Probá con otro.");

  const campaign = await prisma.loyaltyCampaign.create({
    data: { programId: program.id, title: input.title, body: input.body, audience: asJson(audience), recipients, createdById: ctx.userId, expiresAt },
  });
  await audit(ctx.workspace.id, ctx.userId, "loyalty.campaign.send", "LoyaltyCampaign", campaign.id, { programId: program.id, audience: audience.kind, recipients });
  const author = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true } });
  return ok(campaignView(campaign, author?.name ?? null));
}
// creado por pato dev y askforvini
