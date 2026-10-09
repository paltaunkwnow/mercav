import { z } from "zod";
import { apiBusiness } from "@/lib/business/context";
import { findCardInWorkspace } from "@/lib/business/loyalty/service";
import { serialFromScan } from "@/lib/business/loyalty/codes";
import { fail, ok } from "@/app/api/loyalty/_lib/http";
import { fixTypedSerial, staffCardPayload } from "@/app/api/loyalty/_lib/staff";

export const dynamic = "force-dynamic";

const ScanSchema = z.object({
  code: z.string({ error: "Escaneá o escribí el código de la tarjeta." }).trim().min(1, "Escaneá o escribí el código de la tarjeta.").max(500, "Ese código no es de una tarjeta."),
  // El programa elegido en la caja es solo una preferencia: manda el de la tarjeta.
  programId: z.string().max(64).optional().nullable(),
});

/** La caja abre una tarjeta por lo que leyó el escáner (link de la tarjeta o serial). */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const auth = await apiBusiness(params.slug, "loyalty.stamp");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const parsed = ScanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá el código.", 400);

  const serial = serialFromScan(parsed.data.code) ?? serialFromScan(fixTypedSerial(parsed.data.code));
  if (!serial) return fail("Ese código no es de una tarjeta de fidelización.", 400, { code: "NOT_A_CARD" });

  const card = await findCardInWorkspace(ctx.workspace.id, serial);
  if (!card) return fail("No encontramos esa tarjeta en tu negocio.", 404, { code: "NOT_FOUND" });
  if (card.status === "BLOCKED") return fail("Esta tarjeta está bloqueada. Consultá con el encargado.", 400, { code: "BLOCKED" });

  return ok(await staffCardPayload(card));
}
// creado por pato dev y askforvini
