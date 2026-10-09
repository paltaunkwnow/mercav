import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";
import { programInclude, unlinkCardHolder, verifyCardHolder } from "@/lib/business/loyalty/service";
import { HOLDER_DOC_TYPES } from "@/lib/business/loyalty/notice";
import { fail, limitByIp, ok } from "@/app/api/loyalty/_lib/http";
import { staffCardPayload } from "@/app/api/loyalty/_lib/staff";

export const dynamic = "force-dynamic";

const HolderSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    docType: z.enum(HOLDER_DOC_TYPES, { error: "Elegí el tipo de documento." }),
    docLast4: z.string().trim().regex(/^[A-Za-z0-9]{4}$/, "Escribí los últimos 4 caracteres del documento."),
    confirm: z.literal(true, { error: "Confirmá que revisaste el documento en persona." }),
  }),
  z.object({ action: z.literal("unlink") }),
]);

/**
 * Titular de la tarjeta. "verify": el cajero vio el documento en persona y coincide con la tarjeta y la cuenta
 * (cambia el serial). "unlink": la saca de la cuenta (solo quien administra Fidelización).
 * Se guarda el tipo y los últimos 4 caracteres del documento, nunca el número entero.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string; cardId: string } }) {
  const parsed = HolderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);

  const auth = await apiBusiness(params.slug, parsed.data.action === "verify" ? "loyalty.stamp" : "loyalty.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const limited = await limitByIp(req, "loyalty:holder", 20, 10, ctx.userId);
  if (limited) return limited;

  const card = await prisma.loyaltyCard.findFirst({ where: { id: params.cardId, program: { workspaceId: ctx.workspace.id } }, select: { id: true, userId: true } });
  if (!card) return fail("No encontramos esa tarjeta en tu negocio.", 404);
  if (card.userId === ctx.userId) return fail("No podés validar tu propia tarjeta. Pedíselo a otra persona del equipo.", 403);

  const result =
    parsed.data.action === "verify"
      ? await verifyCardHolder(card.id, ctx.userId, { type: parsed.data.docType, last4: parsed.data.docLast4.toUpperCase() })
      : await unlinkCardHolder(card.id);
  if (!result.ok) return fail(result.message, result.status);
  await audit(ctx.workspace.id, ctx.userId, parsed.data.action === "verify" ? "loyalty.holder.verify" : "loyalty.holder.unlink", "LoyaltyCard", card.id);

  const full = await prisma.loyaltyCard.findUniqueOrThrow({ where: { id: card.id }, include: { program: { include: programInclude } } });
  return ok(await staffCardPayload(full));
}
// creado por pato dev y askforvini
