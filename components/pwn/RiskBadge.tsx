const RISK: Record<string, { label: string; className: string }> = {
  critical: { label: "Crítica", className: "border-red-400/40 bg-red-500/10 text-red-200" },
  high: { label: "Alta", className: "border-orange-300/40 bg-orange-500/10 text-orange-100" },
  medium: { label: "Media", className: "border-gold/40 bg-gold/10 text-gold" },
  low: { label: "Baja", className: "border-white/15 bg-white/5 text-gray-300" },
  informational: { label: "Informativa", className: "border-white/15 bg-white/5 text-gray-400" },
  unknown: { label: "Sin clasificar", className: "border-white/10 bg-transparent text-gray-400" },
};

const VERIFICATION: Record<string, { label: string; className: string; note?: string }> = {
  UNVERIFIED: {
    label: "Sin verificar",
    className: "border-dashed border-gray-400 bg-transparent text-gray-200",
    note: "Afirmación sin verificar. No es un hecho confirmado.",
  },
  PARTIALLY_CORROBORATED: {
    label: "Parcialmente corroborada",
    className: "border-white/20 bg-white/5 text-gray-200",
  },
  CORROBORATED: {
    label: "Corroborada",
    className: "border-white/25 bg-white/5 text-white",
  },
  CONFIRMED: {
    label: "Confirmada",
    className: "border-gold/40 bg-gold/10 text-gold",
  },
  DISPUTED: {
    label: "En disputa",
    className: "border-dashed border-white/30 bg-transparent text-gray-200",
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
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.className}`}>
      <span className="sr-only">Riesgo: </span>
      {label}
    </span>
  );
}

export function verificationMeta(status?: string | null) {
  const key = (status ?? "").toUpperCase().replace(/\s+/g, "_");
  return VERIFICATION[key] ?? null;
}

export function VerificationBadge({ status }: { status?: string | null }) {
  const meta = verificationMeta(status);
  const label = meta?.label ?? (status ? status : "Verificación no indicada");
  const className = meta?.className ?? "border-dashed border-white/20 bg-transparent text-gray-300";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${className}`}>
      <span className="sr-only">Verificación: </span>
      {label}
    </span>
  );
}
