import type { NextRequest } from "next/server";
import { z } from "zod";
import { joinProgram } from "@/lib/business/loyalty/service";
import { validBirthday } from "@/components/business/loyalty/public/format";
import { fail, limitByIp, ok, requireJson } from "../_lib/http";
import { SLUG_RE, cardPath, loadPublicProgram, setCardCookie } from "../_lib/server";

export const dynamic = "force-dynamic";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((v) => v || null);

const JoinSchema = z.object({
  slug: z.string().regex(SLUG_RE, "No encontramos este club."),
  name: z.string({ error: "Contanos tu nombre." }).trim().min(1, "Contanos tu nombre.").max(60, "El nombre es muy largo (hasta 60 letras)."),
  phone: optionalText(30, "Revisá el número de celular."),
  email: z
    .string()
    .trim()
    .max(120, "El correo es muy largo.")
    .email("Revisá el correo.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  birthday: z
    .string()
    .refine(validBirthday, "Revisá la fecha de tu cumpleaños.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  marketingConsent: z.boolean().optional().default(false),
  // Un código de invitación mal escrito no frena el alta: se ignora.
  ref: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && /^[A-Za-z0-9]{4,12}$/.test(v.trim()) ? v.trim().toUpperCase() : null)),
});

/** Alta de un cliente en un club. Deja la tarjeta recordada en este navegador. */
export async function POST(req: NextRequest) {
  const limited = await limitByIp(req, "loyalty:join", 8, 2);
  if (limited) return limited;
  const notJson = requireJson(req);
  if (notJson) return notJson;

  const parsed = JoinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá los datos.", 400);
  const input = parsed.data;

  const program = await loadPublicProgram(input.slug);
  if (!program) return fail("No encontramos este club.", 404);

  const result = await joinProgram({
    program,
    name: input.name,
    phone: input.phone,
    email: input.email,
    birthday: input.birthday,
    marketingConsent: input.marketingConsent,
    referralCode: input.ref,
    // La tarjeta no se ata a la sesión: muchas altas se hacen desde el celular del local.
    userId: null,
  });
  if (!result.ok) return fail(result.message, result.status);

  const res = ok({ url: cardPath(program.slug, result.card.serial) }, 201);
  setCardCookie(res, program.id, result.card.serial);
  return res;
}
// creado por pato dev y askforvini
