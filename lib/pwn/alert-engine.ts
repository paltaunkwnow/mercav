import { redactSubject } from "./redaction";
import { isSeverity, isVerificationStatus, type PwnSeverity, type PwnVerificationStatus } from "./types";

export type PwnAlertKind = "BREACH" | "VULNERABILITY" | "EXPOSURE";

export interface BuildAlertInput {
  kind: PwnAlertKind;
  /** Already-safe display value (e.g. redacted email or domain). Emails are re-redacted defensively. */
  targetDisplay?: string;
  breachName?: string;
  cveId?: string;
  severity?: string;
  verificationStatus?: string;
  dataTypes?: string[];
  sourceName?: string;
  kev?: boolean;
}

export interface BuiltAlert {
  title: string;
  body: string;
  severity: PwnSeverity;
}

const VERIFICATION_LABELS: Record<PwnVerificationStatus, string> = {
  UNVERIFIED: "No verificado",
  PARTIALLY_CORROBORATED: "Parcialmente corroborado",
  CORROBORATED: "Corroborado",
  CONFIRMED: "Confirmado",
  DISPUTED: "Disputado",
};

const SEVERITY_LABELS: Record<PwnSeverity, string> = {
  INFO: "Informativa",
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const DATA_TYPE_LABELS: Record<string, string> = {
  "email addresses": "correos electrónicos",
  passwords: "contraseñas",
  usernames: "nombres de usuario",
  names: "nombres",
  "phone numbers": "números de teléfono",
  "physical addresses": "direcciones físicas",
  "ip addresses": "direcciones IP",
  "dates of birth": "fechas de nacimiento",
};

const MAX_FIELD_LENGTH = 120;

function clean(value: string | undefined): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, MAX_FIELD_LENGTH);
}

function safeTarget(value: string | undefined): string {
  const text = clean(value);
  if (!text) return "";
  return text.includes("@") && !text.includes("***") ? redactSubject(text) : text;
}

// Only category names are allowed through; anything that looks like a value
// (contains ":" or "=") is dropped so leaked secrets can never reach an alert.
function describeDataTypes(dataTypes: string[] | undefined): string {
  const labels = (dataTypes ?? [])
    .map((type) => clean(type))
    .filter((type) => type.length > 0 && !/[:=]/.test(type))
    .map((type) => DATA_TYPE_LABELS[type.toLowerCase()] ?? type.toLowerCase());
  return Array.from(new Set(labels)).join(", ");
}

export function buildAlert(input: BuildAlertInput): BuiltAlert {
  const severity: PwnSeverity = isSeverity(input.severity) ? input.severity : "MEDIUM";
  const status: PwnVerificationStatus = isVerificationStatus(input.verificationStatus)
    ? input.verificationStatus
    : "UNVERIFIED";
  const target = safeTarget(input.targetDisplay);
  const source = clean(input.sourceName);
  const lines: string[] = [];
  let title: string;

  if (input.kind === "VULNERABILITY") {
    const cve = clean(input.cveId) || "vulnerabilidad";
    title = input.kev ? `${cve} está siendo explotada activamente` : `Nueva vulnerabilidad relevante: ${cve}`;
    lines.push(
      input.kev
        ? `${cve} figura en el catálogo de vulnerabilidades explotadas conocidas (CISA KEV).`
        : `Se publicó información sobre ${cve}.`,
    );
    if (target) lines.push(`Objetivo monitoreado: ${target}.`);
    lines.push("Recomendación: revisa si usas el producto afectado y aplica el parche o la mitigación del fabricante.");
  } else {
    const breach = clean(input.breachName);
    const subject = target || "un objetivo monitoreado";
    title = breach ? `Posible exposición en ${breach}` : `Posible exposición de ${subject}`;
    lines.push(
      breach
        ? `${subject} aparece asociado a la brecha "${breach}".`
        : `Se detectó una posible exposición de ${subject}.`,
    );
    const types = describeDataTypes(input.dataTypes);
    if (types) lines.push(`Tipos de datos involucrados: ${types}.`);
    lines.push("Mercav Pwn nunca almacena ni muestra contraseñas.");
    lines.push("Recomendación: cambia la contraseña del servicio afectado, no la reutilices y activa la verificación en dos pasos.");
  }

  if (status === "UNVERIFIED" || status === "DISPUTED") {
    lines.push(`Estado: ${VERIFICATION_LABELS[status]}. Esta información no ha sido confirmada; trátala con cautela.`);
  } else {
    lines.push(`Estado de verificación: ${VERIFICATION_LABELS[status]}.`);
  }
  lines.push(`Severidad: ${SEVERITY_LABELS[severity]}.`);
  if (source) lines.push(`Fuente: ${source}.`);

  return { title: clean(title), body: lines.join("\n"), severity };
}
