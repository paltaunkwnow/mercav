import type { NextRequest } from "next/server";
import { z } from "zod";
import { sessionUserId } from "@/lib/calendar/server";
import { linkCardToUser } from "@/lib/business/loyalty/service";
import { fail, limitByIp, ok, requireJson } from "../_lib/http";
import { SLUG_RE, cardCookieName, findProgramCard, loadPublicProgram } from "../_lib/server";

export const dynamic = "force-dynamic";

const LinkSchema = z.object({
  slug: z.string().regex(SLUG_RE, "No encontramos este club."),
  phoneLast4: z.string().trim().regex(/^\d{4}$/, "Escribí los últimos 4 números de tu celular.").optional(),
  ack: z.literal(true, { error: "Confirmá que tus datos son reales." }),
});

/**
 * El cliente guarda su tarjeta en su cuenta Mercav. La tarjeta sale de la cookie de este navegador (nunca del
 * cuerpo); si tiene celular, pide sus últimos 4 números. Queda pendiente hasta que el negocio vea su documento.
 * /api/loyalty no pasa por la sesión en el middleware: se exige acá.
 */
export async function POST(req: NextRequest) {
  const userId = await sessionUserId();
  if (!userId) return fail("Entrá a tu cuenta para guardar la tarjeta.", 401, { code: "NO_SESSION" });
  const limited = await limitByIp(req, "loyalty:link", 6, 3, userId);
  if (limited) return limited;
  const notJson = requireJson(req);
  if (notJson) return notJson;

  const parsed = LinkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);

  const program = await loadPublicProgram(parsed.data.slug);
  if (!program) return fail("No encontramos este club.", 404);
  const card = await findProgramCard(program.id, req.cookies.get(cardCookieName(program.id))?.value);
  if (!card) return fail("Abrí tu tarjeta en este celular y volvé a intentarlo.", 404, { code: "NO_CARD" });

  if (card.phone) {
    const last4 = card.phone.replace(/\D/g, "").slice(-4);
    if (parsed.data.phoneLast4 !== last4) return fail("Esos números no coinciden con el celular de la tarjeta.", 400, { code: "PHONE_MISMATCH" });
  }

  const result = await linkCardToUser(card.id, userId);
  if (!result.ok) return fail(result.message, result.status);
  return ok({ holderStatus: result.card.holderStatus });
}
// creado por pato dev y askforvini
