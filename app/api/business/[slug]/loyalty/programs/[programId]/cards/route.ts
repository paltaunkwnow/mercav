import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/business/audit";
import { joinProgram, programInclude, programView } from "@/lib/business/loyalty/service";
import { parseClubCode } from "@/lib/business/loyalty/codes";
import { findUserByClubCode } from "@/lib/business/loyalty/club";
import { limitByIp } from "@/app/api/loyalty/_lib/http";
import { cardPath } from "@/app/api/loyalty/_lib/server";
import { staffCardPayload } from "@/app/api/loyalty/_lib/staff";
import { listCustomers } from "@/lib/business/loyalty/stats";
import { cleanQuery, parseCardFilter, parsePage } from "@/lib/business/loyalty/stats-core";
import { apiProgram, fail, ok, zodError } from "../../_shared";

export const dynamic = "force-dynamic";

/** Clientes del programa: búsqueda por nombre, celular o correo, filtros y páginas de 20. */
export async function GET(req: Request, { params }: { params: { slug: string; programId: string } }) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.view");
  if ("error" in found) return found.error;
  const url = new URL(req.url);
  const result = await listCustomers(programView(found.program), {
    filter: parseCardFilter(url.searchParams.get("filter")),
    query: cleanQuery(url.searchParams.get("q")),
    page: parsePage(url.searchParams.get("page")),
  });
  return ok(result);
}
const RegisterSchema = z.object({
  name: z.string({ error: "Escribí el nombre y apellido." }).trim().min(2, "Escribí el nombre y apellido.").max(60, "El nombre es muy largo."),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email("Revisá el correo.").max(120).optional().nullable().or(z.literal("")),
  birthday: z.string().regex(/^\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  marketingConsent: z.boolean().default(false),
  clubCode: z.string().trim().max(20).optional().nullable().or(z.literal("")),
  ack: z.literal(true, { error: "Confirmá que cargaste los datos reales del cliente." }),
});

/**
 * Alta de un cliente desde el negocio (cajero o encargado). Con su código MercavClub la tarjeta queda en su cuenta,
 * pendiente de validar el documento. No deja cookie: el cliente abre su tarjeta escaneando el QR que devuelve.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string; programId: string } }) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.stamp");
  if ("error" in found) return found.error;
  const { ctx, program } = found;
  const limited = await limitByIp(req, "loyalty:register", 20, 10, ctx.userId);
  if (limited) return limited;

  const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(zodError(parsed.error), 400);
  const body = parsed.data;

  let userId: string | null = null;
  if (body.clubCode) {
    const code = parseClubCode(body.clubCode);
    const user = code ? await findUserByClubCode(code) : null;
    if (!user) return fail("Ese código MercavClub no es válido. Pedile al cliente que lo revise en su cuenta.", 400);
    if (user.id === ctx.userId) return fail("No podés registrarte a vos mismo con tu código.", 403);
    userId = user.id;
  }

  const result = await joinProgram({
    program,
    name: body.name,
    phone: body.phone || null,
    email: body.email || null,
    birthday: body.birthday || null,
    marketingConsent: body.marketingConsent,
    referralCode: null,
    userId,
    actorUserId: ctx.userId,
    realDataAck: true,
  });
  if (!result.ok) return fail(result.message, result.status);
  await audit(ctx.workspace.id, ctx.userId, "loyalty.card.register", "LoyaltyCard", result.card.id);

  const full = await prisma.loyaltyCard.findUniqueOrThrow({ where: { id: result.card.id }, include: { program: { include: programInclude } } });
  return ok({ ...(await staffCardPayload(full)), url: cardPath(program.slug, result.card.serial) });
}
// creado por pato dev y askforvini
