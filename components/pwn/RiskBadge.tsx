/** One badge shape for every Pwn status: sentence case, compact, readable in both themes. */
const BADGE = "h-6 shrink-0 gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold leading-none";

const RISK: Record<string, { label: string; className: string }> = {
  critical: { label: "Crítica", className: "border-red-400/40 bg-red-500/10 text-red-200 [.light_&]:text-red-800 [.light_&]:border-red-700/30" },
  high: { label: "Alta", className: "border-orange-300/40 bg-orange-500/10 text-orange-100 [.light_&]:text-orange-800 [.light_&]:border-orange-700/30" },
  medium: { label: "Media", className: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold" },
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
    className: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold",
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
  if (/low|baja|info/.test(value)) return value.includes("info") ? "informational" : "low";
  if (/info/.test(value)) return "informational";
  return level ? "unknown" : "unknown";
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
  DATABASE: { label: "Base de datos", className: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold" },
  STEALER: { label: "Stealer logs", className: "border-fuchsia-300/40 bg-fuchsia-500/10 text-fuchsia-100 [.light_&]:text-fuchsia-800 [.light_&]:border-fuchsia-700/30" },
  CORPORATE: { label: "Robo corporativo", className: "border-sky-300/40 bg-sky-500/10 text-sky-100 [.light_&]:text-sky-800 [.light_&]:border-sky-700/30" },
  MIXED: { label: "Mixto", className: "border-amber-300/40 bg-amber-500/10 text-amber-100 [.light_&]:text-amber-800 [.light_&]:border-amber-700/30" },
  CREDENTIALS: { label: "Cuentas / logs", className: "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]" },
  OTHER: { label: "Filtración", className: "border-[var(--mv-hairline-strong)] bg-transparent text-[var(--text-secondary)]" },
};

export function BoliviaPriorityBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-center ${BADGE} border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold`}>
      <span className="sr-only">Prioridad: </span>
      Bolivia
    </span>
  );
}

export function GovernmentPriorityBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-center ${BADGE} border-red-400/50 bg-red-500/15 text-red-100 [.light_&]:border-red-700/30 [.light_&]:text-red-800`}>
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
