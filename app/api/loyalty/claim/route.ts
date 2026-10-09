import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { earn } from "@/lib/business/loyalty/service";
import { normalizeRules } from "@/lib/business/loyalty/engine";
import { verifyKioskCode } from "@/lib/business/loyalty/codes";
import { decryptField } from "@/lib/business/crypto";
import { fail, limitByIp, ok, requireJson } from "../_lib/http";
import { JOIN_GRACE_MS, KIOSK_CODE_RE, SLUG_RE, cardCookieName, codeSeenRecently, findProgramCard, loadPublicProgram } from "../_lib/server";

export const dynamic = "force-dynamic";

const ClaimSchema = z.object({
  slug: z.string().regex(SLUG_RE, "No encontramos este club."),
  code: z.string().trim().regex(KIOSK_CODE_RE, "Ese código no es válido. Escaneá el QR del mostrador otra vez."),
});

/**
 * Autoservicio: el cliente escanea el QR rotativo del mostrador y suma 1 sello.
 * La tarjeta sale de la cookie httpOnly (nunca del cuerpo de la petición).
 */
export async function POST(req: NextRequest) {
  const limited = await limitByIp(req, "loyalty:claim", 10, 4);
  if (limited) return limited;
  const notJson = requireJson(req);
  if (notJson) return notJson;

  const parsed = ClaimSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);
  const { slug, code } = parsed.data;

  const program = await loadPublicProgram(slug);
  if (!program) return fail("No encontramos este club.", 404);

  const card = await findProgramCard(program.id, req.cookies.get(cardCookieName(program.id))?.value);
  if (!card) return fail("Primero sumate al club para guardar tus sellos.", 401, { code: "NO_CARD" });

  if (program.status !== "ACTIVE") return fail("Este club no está sumando sellos por ahora.", 400, { code: "PROGRAM_OFF" });
  const rules = normalizeRules(program.rules, program.businessType);
  const secret = decryptField(program.kioskSecretEnc);
  if (!rules.selfService || program.type !== "STAMPS" || !secret) {
    return fail("Este negocio no tiene autoservicio. Pedí tu sello en caja.", 400, { code: "SELF_SERVICE_OFF" });
  }

  const clientRef = `kiosk:${card.serial}:${code}`;
  const now = new Date();
  // Si ya se registró (recarga de la página), el servicio devuelve el mismo resultado aunque el código haya cambiado.
  const already = await prisma.loyaltyEvent.findUnique({ where: { clientRef }, select: { cardId: true } });
  if (!already) {
    const justJoined = now.getTime() - card.createdAt.getTime() <= JOIN_GRACE_MS;
    const valid = verifyKioskCode(secret, code, now) || (justJoined && codeSeenRecently(secret, code, now));
    if (!valid) return fail("Ese código ya cambió. Escaneá el QR del mostrador otra vez.", 400, { code: "CODE_EXPIRED" });
  } else if (already.cardId !== card.id) {
    return fail("Ese código ya cambió. Escaneá el QR del mostrador otra vez.", 400, { code: "CODE_EXPIRED" });
  }

  const result = await earn({ program, cardId: card.id, request: { kind: "stamps", qty: 1 }, source: "SELF_SERVICE", actorUserId: null, clientRef, now });
  if (!result.ok) return fail(result.message, result.status, { code: result.code });
  return ok({ card: result.card, event: result.event, replayed: result.replayed ?? false });
}
// creado por pato dev y askforvini
