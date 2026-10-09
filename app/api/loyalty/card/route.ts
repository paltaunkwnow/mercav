import type { NextRequest } from "next/server";
import { cardView, programView } from "@/lib/business/loyalty/service";
import { fail, limitByIp, ok } from "../_lib/http";
import { SERIAL_RE, SLUG_RE, cardCookieName, loadCardForSlug, setCardCookie } from "../_lib/server";

export const dynamic = "force-dynamic";

/**
 * Estado de una tarjeta para la página del cliente (se consulta cada 15 s mientras está a la vista).
 * Solo devuelve la vista de la tarjeta: nada de celular, correo ni cumpleaños.
 * Con remember=1 deja la tarjeta recordada en este navegador (para el autoservicio).
 */
export async function GET(req: NextRequest) {
  const limited = await limitByIp(req, "loyalty:card", 60, 40);
  if (limited) return limited;

  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const serial = (req.nextUrl.searchParams.get("serial") ?? "").toUpperCase();
  if (!SLUG_RE.test(slug) || !SERIAL_RE.test(serial)) return fail("No encontramos esta tarjeta.", 404);

  const card = await loadCardForSlug(slug, serial);
  if (!card) return fail("No encontramos esta tarjeta.", 404);

  const program = programView(card.program);
  const res = ok({ card: cardView(card, program), program: { type: program.type, rules: { stampsGoal: program.rules.stampsGoal } } });
  if (req.nextUrl.searchParams.get("remember") === "1" && req.cookies.get(cardCookieName(card.programId))?.value !== card.serial) {
    setCardCookie(res, card.programId, card.serial);
  }
  return res;
}
// creado por pato dev y askforvini
