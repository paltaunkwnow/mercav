import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { apiBusiness } from "@/lib/business/context";
import type { BusinessPermission } from "@/lib/business/permissions";
import { loadProgram } from "@/lib/business/loyalty/service";
import { normalizeDesign, normalizeRules, MAX_LOGO_BYTES } from "@/lib/business/loyalty/engine";
import { BENEFIT_KEYS, BUSINESS_TYPES, ICON_KEYS, PALETTES } from "@/lib/business/loyalty/templates";
import type { BenefitKey, LoyaltyDesign, LoyaltyIconKey, LoyaltyRules, LoyaltyTypeKey } from "@/lib/business/loyalty/types";

/** Respuesta de error con el formato de Business. */
export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function ok(data?: unknown, init?: { headers?: Record<string, string> }) {
  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store", ...init?.headers } });
}

/** Primer mensaje de zod, o uno genérico. */
export function zodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisá los datos.";
}

/**
 * Sesión + permiso + programa de esta empresa. Un programa de otra empresa responde 404 igual que uno que no existe.
 * Ojo: el programa trae kioskSecretEnc; nunca se devuelve tal cual (usar programView).
 */
export async function apiProgram(slug: string, programId: string, permission: BusinessPermission) {
  const auth = await apiBusiness(slug, permission);
  if ("error" in auth) return { error: auth.error };
  const program = await loadProgram({ id: programId });
  if (!program || program.workspaceId !== auth.ctx.workspace.id) return { error: fail("No encontrado", 404) };
  return { ctx: auth.ctx, program };
}

const int = (min: number, max: number, message: string) => z.number({ error: message }).int(message).min(min, message).max(max, message);
const HEX = /^#[0-9a-fA-F]{6}$/;

const RulesSchema = z
  .object({
    stampsGoal: int(2, 30, "La meta de sellos va de 2 a 30."),
    maxPerAction: int(1, 100_000, "Revisá el tope por vez."),
    maxPerDay: int(1, 1_000_000, "Revisá el tope por día."),
    cooldownMinutes: int(0, 1440, "La espera entre sumas va de 0 a 1440 minutos."),
    pointsPerUnit: int(1, 1000, "Los puntos por compra van de 1 a 1000."),
    unitAmount: int(1, 1_000_000, "Revisá el monto de compra por punto."),
    expiresDays: int(7, 3650, "El vencimiento va de 7 a 3650 días.").nullable(),
    welcomeBonus: int(0, 10_000, "Revisá el regalo de bienvenida."),
    birthdayBonus: int(0, 10_000, "Revisá el regalo de cumpleaños."),
    referralBonus: int(0, 10_000, "Revisá el premio por invitar."),
    selfService: z.boolean({ error: "Revisá el autoservicio." }),
    selfServiceMaxPerDay: int(1, 10, "El autoservicio permite de 1 a 10 sellos por día."),
    tiers: z
      .array(
        z.object({
          name: z.string({ error: "Cada nivel necesita un nombre." }).trim().min(1, "Cada nivel necesita un nombre.").max(30, "El nombre del nivel es muy largo."),
          minLifetime: int(1, 1_000_000, "Revisá el mínimo de cada nivel."),
          perk: z.string().trim().max(80, "El beneficio del nivel es muy largo.").default(""),
        }),
      )
      .max(5, "Hasta 5 niveles."),
  })
  .superRefine((r, ctx) => {
    if (r.maxPerDay < r.maxPerAction) ctx.addIssue({ code: "custom", message: "El tope por día no puede ser menor que el tope por vez." });
    const names = r.tiers.map((t) => t.name.toLowerCase());
    if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", message: "Hay dos niveles con el mismo nombre." });
    const mins = r.tiers.map((t) => t.minLifetime);
    if (new Set(mins).size !== mins.length) ctx.addIssue({ code: "custom", message: "Dos niveles no pueden pedir el mismo mínimo." });
  });

const DesignSchema = z.object({
  palette: z.enum(["noche", "espresso", "bosque", "oceano", "vino", "perla", "custom"], { error: "Elegí una paleta." }),
  base: z.string().regex(HEX, "Elegí un color de fondo válido.").nullable(),
  accent: z.string().regex(HEX, "Elegí un color de detalle válido.").nullable(),
  logoDataUrl: z.string().max(Math.ceil(MAX_LOGO_BYTES * 1.37), "El logo es muy pesado. Probá con una imagen más simple.").nullable(),
  displayName: z.string({ error: "Poné el nombre que va en la tarjeta." }).trim().min(1, "Poné el nombre que va en la tarjeta.").max(40, "El nombre de la tarjeta es muy largo."),
  subtitle: z.string().trim().max(40, "El subtítulo es muy largo."),
  backTitle: z.string().trim().max(40, "El título del dorso es muy largo."),
  benefits: z
    .array(z.string().refine((v) => BENEFIT_KEYS.includes(v as BenefitKey), "Ese beneficio no existe."))
    .min(1, "Elegí al menos un beneficio.")
    .max(4, "Elegí hasta 4 beneficios."),
  icon: z.string().refine((v) => ICON_KEYS.includes(v as LoyaltyIconKey), "Elegí un ícono."),
});

const RewardSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string({ error: "Cada premio necesita un nombre." }).trim().min(1, "Cada premio necesita un nombre.").max(60, "El nombre del premio es muy largo."),
  cost: int(1, 1_000_000, "El costo de cada premio tiene que ser un número entero desde 1."),
  description: z.string().trim().max(140, "La descripción del premio es muy larga.").nullable().optional(),
  active: z.boolean().optional(),
});

export const ProgramInputSchema = z.object({
  businessType: z.string({ error: "Elegí un rubro." }).refine((v) => BUSINESS_TYPES.some((t) => t.key === v), "Elegí un rubro."),
  name: z.string({ error: "Poné un nombre al programa." }).trim().min(2, "Poné un nombre al programa.").max(60, "El nombre del programa es muy largo."),
  type: z.enum(["STAMPS", "POINTS"], { error: "Elegí sellos o puntos." }),
  rules: RulesSchema,
  design: DesignSchema,
  rewards: z.array(RewardSchema).min(1, "Agregá al menos un premio.").max(12, "Hasta 12 premios por programa."),
});

export type ProgramInput = z.infer<typeof ProgramInputSchema>;

export type NormalizedProgram = {
  businessType: string;
  name: string;
  type: LoyaltyTypeKey;
  rules: LoyaltyRules;
  design: LoyaltyDesign;
  rewards: { id?: string; name: string; cost: number; description: string | null; active: boolean; sortOrder: number }[];
};

/** Normaliza lo validado con el motor. Devuelve un mensaje si algo no cierra. */
export function normalizeProgram(input: ProgramInput, workspaceName: string): { ok: true; value: NormalizedProgram } | { ok: false; error: string } {
  if (input.design.palette === "custom" && (!input.design.base || !input.design.accent)) return { ok: false, error: "Elegí los dos colores de tu paleta." };
  if (input.design.palette !== "custom" && !(input.design.palette in PALETTES)) return { ok: false, error: "Elegí una paleta." };
  const rules = normalizeRules(input.rules, input.businessType);
  // El autoservicio suma de a un sello: no aplica a programas por puntos.
  if (input.type === "POINTS") rules.selfService = false;
  const design = normalizeDesign(input.design, input.businessType, workspaceName);
  if (input.design.logoDataUrl && !design.logoDataUrl) return { ok: false, error: "No pudimos leer el logo. Subilo de nuevo en PNG o JPG." };
  const rewards = input.rewards.map((r, i) => ({
    id: r.id,
    name: r.name,
    cost: r.cost,
    description: r.description?.trim() ? r.description.trim() : null,
    active: r.active ?? true,
    sortOrder: i,
  }));
  if (!rewards.some((r) => r.active)) return { ok: false, error: "Dejá al menos un premio activo." };
  return { ok: true, value: { businessType: input.businessType, name: input.name, type: input.type, rules, design, rewards } };
}

export const asJson = (value: unknown) => value as Prisma.InputJsonValue;
// creado por pato dev y askforvini
