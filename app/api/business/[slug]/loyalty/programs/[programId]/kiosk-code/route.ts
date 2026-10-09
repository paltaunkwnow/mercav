import { prisma } from "@/lib/prisma";
import { decryptField, encryptField } from "@/lib/business/crypto";
import { KIOSK_STEP_SECONDS, kioskCode, newKioskSecret } from "@/lib/business/loyalty/codes";
import { normalizeRules } from "@/lib/business/loyalty/engine";
import { apiProgram, fail, ok } from "../../_shared";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * Código del QR del mostrador (cambia cada KIOSK_STEP_SECONDS). Lo pide la tablet del negocio, con sesión de staff.
 * Si el secreto falta o no se puede leer (por ejemplo, cambió la clave), se genera uno nuevo una sola vez.
 */
export async function GET(_req: Request, { params }: { params: { slug: string; programId: string } }) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.stamp");
  if ("error" in found) return found.error;
  const { program } = found;
  if (program.status !== "ACTIVE") return fail("El programa no está activo. Activalo para usar el autoservicio.", 409);
  const rules = normalizeRules(program.rules, program.businessType);
  if (program.type !== "STAMPS" || !rules.selfService) return fail("El autoservicio está apagado. Prendelo en Ajustes, en Extras.", 409);

  let secret = decryptField(program.kioskSecretEnc);
  if (!secret) {
    await prisma.loyaltyProgram.updateMany({ where: { id: program.id, kioskSecretEnc: program.kioskSecretEnc }, data: { kioskSecretEnc: encryptField(newKioskSecret()) } });
    const fresh = await prisma.loyaltyProgram.findUnique({ where: { id: program.id }, select: { kioskSecretEnc: true } });
    secret = decryptField(fresh?.kioskSecretEnc);
    if (!secret) return fail("No pudimos generar el código. Probá de nuevo.", 500);
  }

  const now = new Date();
  const elapsed = Math.floor(now.getTime() / 1000) % KIOSK_STEP_SECONDS;
  return ok({ code: kioskCode(secret, now), expiresIn: KIOSK_STEP_SECONDS - elapsed, step: KIOSK_STEP_SECONDS }, { headers: NO_STORE });
}
// creado por pato dev y askforvini
