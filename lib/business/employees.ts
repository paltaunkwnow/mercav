import { z } from "zod";
import type { BusinessEmployee } from "@prisma/client";
import { decryptField, encryptField } from "./crypto";
import { isoDay } from "./format";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** yyyy-mm-dd que existe de verdad (2026-02-30 no) y cae entre `min` y hoy + `maxDaysAhead`. */
function validDay(value: string, min: string, maxDaysAhead: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return false;
  const max = new Date(Date.now() + maxDaysAhead * 86_400_000).toISOString().slice(0, 10);
  return value >= min && value <= max;
}

const hireDay = z.string().refine((v) => validDay(v, "1950-01-01", 366), "Fecha de ingreso inválida");
const birthDay = z.string().refine((v) => validDay(v, "1900-01-01", 0), "Fecha de nacimiento inválida");
export const endDaySchema = z.string().refine((v) => validDay(v, "1950-01-01", 366), "Fecha de baja inválida");

export const EmployeeInputSchema = z.object({
  firstName: z.string().trim().min(1, "Falta el nombre").max(80),
  lastName: z.string().trim().min(1, "Falta el apellido").max(80),
  ci: optionalText(20),
  ciExt: optionalText(10),
  birthDate: birthDay.optional().nullable().or(z.literal("")).transform((v) => v || null),
  sex: z.enum(["F", "M"]).optional().nullable().or(z.literal("")).transform((v) => v || null),
  nationality: optionalText(40),
  email: z.string().trim().email("Correo inválido").max(120).optional().nullable().or(z.literal("")).transform((v) => v || null),
  phone: optionalText(30),
  position: optionalText(80),
  hireDate: hireDay,
  contractType: z.enum(["INDEFINIDO", "PLAZO_FIJO", "EVENTUAL", "PASANTIA", "CONSULTORIA"]),
  baseSalary: z.coerce
    .number()
    .min(0, "El haber básico no puede ser negativo")
    .max(1_000_000, "El haber básico es demasiado alto")
    .transform((v) => Math.round(v * 100) / 100),
  bankName: optionalText(60),
  bankAccount: optionalText(40),
  nua: optionalText(20),
  cnsNumber: optionalText(30),
  notes: optionalText(1000),
});

export type EmployeeInput = z.infer<typeof EmployeeInputSchema>;

const asDate = (v: string | null) => (v ? new Date(`${v}T00:00:00.000Z`) : null);

/** Datos listos para Prisma: fechas a medianoche UTC y campos sensibles cifrados. */
export function employeeData(input: EmployeeInput) {
  const { ci, bankAccount, birthDate, hireDate, ...rest } = input;
  return {
    ...rest,
    ciEnc: encryptField(ci),
    bankAccountEnc: encryptField(bankAccount),
    birthDate: asDate(birthDate),
    hireDate: asDate(hireDate)!,
  };
}

/**
 * Lo que ve cualquier rol con acceso al directorio (también un Encargado): sin salario, documentos,
 * datos de contacto ni notas internas. Todo lo personal va en `sensitive`.
 */
export type EmployeeView = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string | null;
  hireDate: string;
  endDate: string | null;
  contractType: string;
  status: "ACTIVE" | "INACTIVE";
  linked: boolean;
  /** Solo con permiso employees.viewSensitive (o la propia persona). */
  sensitive: {
    baseSalary: number;
    ci: string | null;
    ciExt: string | null;
    /** Hay un documento guardado pero no se pudo descifrar (clave distinta). */
    ciUnreadable: boolean;
    bankName: string | null;
    bankAccount: string | null;
    bankUnreadable: boolean;
    birthDate: string | null;
    sex: string | null;
    nationality: string | null;
    email: string | null;
    phone: string | null;
    nua: string | null;
    cnsNumber: string | null;
    notes: string | null;
  } | null;
};

export function toEmployeeView(e: BusinessEmployee, withSensitive: boolean): EmployeeView {
  const ci = withSensitive ? decryptField(e.ciEnc) : null;
  const bankAccount = withSensitive ? decryptField(e.bankAccountEnc) : null;
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    fullName: `${e.lastName} ${e.firstName}`.trim(),
    position: e.position,
    hireDate: isoDay(e.hireDate),
    endDate: e.endDate ? isoDay(e.endDate) : null,
    contractType: e.contractType,
    status: e.status,
    linked: !!e.userId,
    sensitive: withSensitive
      ? {
          baseSalary: Number(e.baseSalary),
          ci,
          ciExt: e.ciExt,
          ciUnreadable: !!e.ciEnc && ci === null,
          bankName: e.bankName,
          bankAccount,
          bankUnreadable: !!e.bankAccountEnc && bankAccount === null,
          birthDate: e.birthDate ? isoDay(e.birthDate) : null,
          sex: e.sex,
          nationality: e.nationality,
          email: e.email,
          phone: e.phone,
          nua: e.nua,
          cnsNumber: e.cnsNumber,
          notes: e.notes,
        }
      : null,
  };
}

/**
 * Datos para actualizar un legajo. Si el documento o la cuenta no cambiaron, o lo guardado no se
 * puede leer y el campo vino vacío, se conserva el cifrado existente en vez de borrarlo.
 */
export function employeeUpdateData(before: BusinessEmployee, input: EmployeeInput) {
  const data = employeeData(input);
  const keep = (stored: string | null, incoming: string | null) => {
    if (!stored) return false;
    const plain = decryptField(stored);
    return plain === null ? !incoming : plain === incoming;
  };
  if (keep(before.ciEnc, input.ci)) data.ciEnc = before.ciEnc;
  if (keep(before.bankAccountEnc, input.bankAccount)) data.bankAccountEnc = before.bankAccountEnc;
  return data;
}

/** Qué campos cambiaron (para auditoría), sin valores de CI ni cuenta. */
export function changedFields(before: BusinessEmployee, input: EmployeeInput) {
  const fields: string[] = [];
  const compare: [string, unknown, unknown][] = [
    ["firstName", before.firstName, input.firstName],
    ["lastName", before.lastName, input.lastName],
    ["ci", decryptField(before.ciEnc), input.ci],
    ["ciExt", before.ciExt, input.ciExt],
    ["birthDate", before.birthDate ? isoDay(before.birthDate) : null, input.birthDate],
    ["sex", before.sex, input.sex],
    ["nationality", before.nationality, input.nationality],
    ["email", before.email, input.email],
    ["phone", before.phone, input.phone],
    ["position", before.position, input.position],
    ["hireDate", isoDay(before.hireDate), input.hireDate],
    ["contractType", before.contractType, input.contractType],
    ["bankName", before.bankName, input.bankName],
    ["bankAccount", decryptField(before.bankAccountEnc), input.bankAccount],
    ["nua", before.nua, input.nua],
    ["cnsNumber", before.cnsNumber, input.cnsNumber],
    ["notes", before.notes, input.notes],
  ];
  for (const [name, a, b] of compare) if ((a ?? null) !== (b ?? null)) fields.push(name);
  return fields;
}
// creado por pato dev y askforvini
