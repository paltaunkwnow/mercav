import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { normalizePhone, programInclude } from "@/lib/business/loyalty/service";
import { parseClubCode } from "@/lib/business/loyalty/codes";
import { fail, limitByIp, ok } from "@/app/api/loyalty/_lib/http";
import { staffCardPayload } from "@/app/api/loyalty/_lib/staff";

export const dynamic = "force-dynamic";

const SearchSchema = z.object({
  query: z.string({ error: "Escribí el número de cliente, el código MercavClub o el celular." }).trim().min(1).max(40),
  programId: z.string().max(64).optional(),
});

/**
 * Buscar un cliente en el mostrador por número de cliente (#12), código MercavClub (MC-…) o celular.
 * Siempre dentro de los programas de esta empresa; "no encontrado" es igual exista o no el código en otro lado.
 * Por POST para que nada quede en URLs.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "loyalty.stamp");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const limited = await limitByIp(req, "loyalty:search", 30, 15, ctx.userId);
  if (limited) return limited;

  const parsed = SearchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá la búsqueda.", 400);
  const { query, programId } = parsed.data;
  const inWorkspace = { workspaceId: ctx.workspace.id, ...(programId ? { id: programId } : {}) };

  const club = parseClubCode(query);
  const numberMatch = /^#?\s*(\d{1,6})$/.exec(query);
  const where = club
    ? { user: { clubCode: club }, program: inWorkspace }
    : numberMatch
      ? { customerNo: Number(numberMatch[1]), program: inWorkspace }
      : (() => {
          const phone = normalizePhone(query, ctx.workspace.country);
          return phone ? { phone, program: inWorkspace } : null;
        })();
  if (!where) return fail("Escribí el número de cliente (#12), el código MercavClub o el celular.", 400);

  const cards = await prisma.loyaltyCard.findMany({ where, include: { program: { include: programInclude } }, take: 10, orderBy: { createdAt: "asc" } });
  if (!cards.length) return fail("No encontramos a ese cliente en tu negocio.", 404, { code: "NOT_FOUND", kind: club ? "club" : numberMatch ? "number" : "phone" });

  // Un resultado: la tarjeta lista para sellar. Varios (el mismo número en dos clubes): que el cajero elija.
  if (cards.length === 1) {
    if (cards[0].status === "BLOCKED") return fail("Esta tarjeta está bloqueada. Consultá con el encargado.", 400, { code: "BLOCKED" });
    return ok({ match: await staffCardPayload(cards[0]) });
  }
  return ok({
    choices: cards.map((c) => ({ serial: c.serial, programName: c.program.name, customerName: c.customerName, customerNo: c.customerNo, status: c.status })),
  });
}
// creado por pato dev y askforvini
