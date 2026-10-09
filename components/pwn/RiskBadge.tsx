/** One badge shape for every Pwn status: sentence case, compact, readable in both themes. */
const BADGE = "h-6 shrink-0 gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold leading-none";

// Tokens de Pwn (globals.css, .p-world): magenta para alerta, amarillo para advertencia. El "dorado" acá es verde.
const ALERT_FILL = "border-[color-mix(in_srgb,var(--p-alert)_50%,transparent)] bg-[var(--p-alert-wash)] text-[var(--p-alert)]";
const ALERT_LINE = "border-[color-mix(in_srgb,var(--p-alert)_50%,transparent)] bg-transparent text-[var(--p-alert)]";
const WARN_FILL =
  "border-[color-mix(in_srgb,var(--p-warn)_55%,transparent)] bg-[color-mix(in_srgb,var(--p-warn)_12%,transparent)] text-[var(--p-warn)]";
const WARN_LINE = "border-[color-mix(in_srgb,var(--p-warn)_55%,transparent)] bg-transparent text-[var(--p-warn)]";

const RISK: Record<string, { label: string; className: string }> = {
  critical: { label: "Crítica", className: ALERT_FILL },
  high: { label: "Alta", className: ALERT_LINE },
  medium: { label: "Media", className: WARN_FILL },
  low: { label: "Baja", className: "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]" },
  informational: { label: "Informativa", className: "border-[var(--mv-hairline-strong)] bg-transparent text-[var(--text-secondary)]" },
  unknown: { label: "Sin clasificar", className: "border-[var(--mv-hairline)] bg-transparent text-[var(--text-tertiary)]" },
};

const VERIFICATION: Record<string, { label: string; className: string; note?: string }> = {
  UNVERIFIED: {
    label: "Sin verificar",
    className: "border-dashed border-[var(--text-tertiary)] bg-transparent text-[var(--text-secondary)]",
    note: "Afirmación sin verificar. No es un hecho confirmado.",
  },
  PARTIALLY_CORROBORATED: {
    label: "Parcialmente corroborada",
    className: "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
  },
  CORROBORATED: {
    label: "Corroborada",
    className: "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)] text-[var(--text-primary)]",
  },
  CONFIRMED: {
    label: "Confirmada",
    className: "border-[var(--text-secondary)] bg-[var(--mv-panel-hover)] text-[var(--text-primary)]",
  },
  DISPUTED: {
    label: "En disputa",
    className: "border-dashed border-[var(--text-tertiary)] bg-transparent text-[var(--text-secondary)]",
    note: "Registro en disputa: la fuente lo considera posiblemente fabricado. No es un hecho confirmado.",
  },
};

function riskKey(level?: string | null): string {
  const value = (level ?? "").toLowerCase();
  if (/crit/.test(value)) return "critical";
  if (/high|alta/.test(value)) return "high";
  if (/med/.test(value)) return "medium";
  if (/info/.test(value)) return "informational";
  if (/low|baja/.test(value)) return "low";
  return "unknown";
}

/** Pasa un nivel de riesgo a la clave de RISK (para usar el mismo color fuera de la insignia). */
export function riskTone(level?: string | null): "critical" | "high" | "medium" | "low" | "informational" | "unknown" {
  return riskKey(level) as "critical" | "high" | "medium" | "low" | "informational" | "unknown";
}

/** Insignia para un CVE en el catálogo KEV de CISA. */
export function KnownExploitedBadge() {
  return (
    <span className={`inline-flex items-center ${BADGE} ${ALERT_FILL}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      Explotación conocida
    </span>
  );
}

export function RiskBadge({ level }: { level?: string | null }) {
  const key = level ? riskKey(level) : "unknown";
  const tone = RISK[key] ?? RISK.unknown;
  const label = key === "unknown" && level ? level : tone.label;
  return (
    <span className={`inline-flex items-center ${BADGE} ${tone.className}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span className="sr-only">Riesgo: </span>
      {label}
    </span>
  );
}

export function verificationMeta(status?: string | null) {
  const key = (status ?? "").toUpperCase().replace(/\s+/g, "_");
  return VERIFICATION[key] ?? null;
}

const SIGNAL_KIND: Record<string, { label: string; className: string }> = {
  DATABASE: { label: "Base de datos", className: WARN_LINE },
  STEALER: { label: "Stealer logs", className: ALERT_LINE },
  CORPORATE: { label: "Robo corporativo", className: ALERT_FILL },
  MIXED: { label: "Mixto", className: WARN_FILL },
  CREDENTIALS: { label: "Cuentas / logs", className: "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]" },
  OTHER: { label: "Filtración", className: "border-[var(--mv-hairline-strong)] bg-transparent text-[var(--text-secondary)]" },
};

export function BoliviaPriorityBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-center ${BADGE} ${WARN_LINE}`}>
      <span className="sr-only">Prioridad: </span>
      Bolivia
    </span>
  );
}

export function GovernmentPriorityBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-center ${BADGE} ${ALERT_FILL}`}>
      <span className="sr-only">Prioridad: </span>
      Gobierno
    </span>
  );
}

export function SignalKindBadge({ kind }: { kind?: string | null }) {
  const key = (kind ?? "OTHER").toUpperCase();
  const tone = SIGNAL_KIND[key] ?? SIGNAL_KIND.OTHER;
  return (
    <span className={`inline-flex items-center ${BADGE} ${tone.className}`}>
      <span className="sr-only">Tipo de señal: </span>
      {tone.label}
    </span>
  );
}

export function VerificationBadge({ status }: { status?: string | null }) {
  const meta = verificationMeta(status);
  const label = meta?.label ?? (status ? status : "Verificación no indicada");
  const className = meta?.className ?? "border-dashed border-[var(--mv-hairline-strong)] bg-transparent text-[var(--text-secondary)]";
  return (
    <span className={`inline-flex items-center ${BADGE} ${className}`}>
      <span className="sr-only">Verificación: </span>
      {label}
    </span>
  );
}
// creado por pato dev y askforvini
