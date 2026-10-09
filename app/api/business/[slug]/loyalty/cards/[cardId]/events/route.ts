import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { cardHistory, earn, programInclude, redeem, type ActionResult } from "@/lib/business/loyalty/service";
import type { EarnRequest } from "@/lib/business/loyalty/engine";
import { fail, ok } from "@/app/api/loyalty/_lib/http";

export const dynamic = "force-dynamic";

const EventSchema = z.object({
  action: z.enum(["earn", "redeem"], { error: "Acción inválida." }),
  qty: z.number().int("Elegí cuántos sumar.").min(1, "Elegí cuántos sumar.").max(100_000).optional(),
  amount: z.number().positive("Ingresá el monto de la compra.").max(1_000_000_000, "Revisá el monto.").optional(),
  rewardId: z.string().min(1).max(64).optional(),
  // Lo genera la caja por cada toque y lo repite si reintenta: así un corte de señal no suma dos veces.
  clientRef: z.string().regex(/^[A-Za-z0-9-]{8,64}$/, "Referencia inválida."),
});

/** Sumar o canjear desde la caja. El servicio aplica topes, esperas y la regla de no sellarse a uno mismo. */
export async function POST(req: Request, { params }: { params: { slug: string; cardId: string } }) {
  const auth = await apiBusiness(params.slug, "loyalty.stamp");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const parsed = EventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);
  const input = parsed.data;

  const card = await prisma.loyaltyCard.findUnique({ where: { id: params.cardId }, include: { program: { include: programInclude } } });
  if (!card || card.program.workspaceId !== ctx.workspace.id) return fail("No encontramos esa tarjeta en tu negocio.", 404);

  // La referencia queda atada a la tarjeta: no se puede "reproducir" una acción de otra.
  const clientRef = `staff:${card.id}:${input.clientRef}`;
  let result: ActionResult;
  if (input.action === "earn") {
    let request: EarnRequest;
    if (card.program.type === "STAMPS") request = { kind: "stamps", qty: input.qty ?? 1 };
    else if (input.amount !== undefined) request = { kind: "purchase", amount: input.amount };
    else if (input.qty !== undefined) request = { kind: "stamps", qty: input.qty };
    else return fail("Ingresá el monto de la compra.", 400);
    result = await earn({ program: card.program, cardId: card.id, request, source: "STAFF", actorUserId: ctx.userId, clientRef });
  } else {
    if (!input.rewardId) return fail("Elegí qué premio canjear.", 400);
    result = await redeem({ program: card.program, cardId: card.id, rewardId: input.rewardId, actorUserId: ctx.userId, clientRef });
  }

  if (!result.ok) return fail(result.message, result.status, { code: result.code });
  return ok({ card: result.card, event: result.event, replayed: result.replayed ?? false, history: await cardHistory(card.id, 5) });
}
// creado por pato dev y askforvini
