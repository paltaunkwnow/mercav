const CONFIDENCE: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const STATUS: Record<string, string> = {
  OPEN: "Abierta",
  READ: "Leída",
  DETECTED: "Detectada",
  ENRICHED: "Enriquecida",
  SCORED: "Puntuada",
  CREATED: "Creada",
  DELIVERED: "Entregada",
  ACKNOWLEDGED: "Reconocida",
  RESOLVED: "Resuelta",
};

export function formatConfidence(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value <= 1) return `${Math.round(value * 100)} %`;
    if (value >= 0 && value <= 100) return `${Math.round(value)} %`;
  }
  const key = String(value).trim().toLowerCase();
  return CONFIDENCE[key] ?? String(value);
}

export function formatScore(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${Math.round(value)} / 100`;
}

export function formatWhen(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatRelative(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `Hace ${days} d`;
  return formatWhen(value);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("es").format(value);
}

export function formatStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  if (status.length > 40) return null;
  return STATUS[status.toUpperCase()] ?? status;
}

export function isClosedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return ["RESOLVED", "ACKNOWLEDGED", "CLOSED", "RESUELTA", "RECONOCIDA"].includes(status.toUpperCase());
}

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

/** Shared Pwn inputs — soft dark fill, readable in light theme on pwn pages. */
export const pwnFieldClass = [
  "h-11 w-full rounded-xl border px-3.5 text-sm",
  "border-white/10 bg-[#141416] text-white",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
  "placeholder:text-gray-500",
  "light:border-black/10 light:bg-[#e8e6e0] light:text-[#1a1714] light:shadow-none light:placeholder:text-gray-500",
  "transition-[border-color,box-shadow] hover:border-white/15 light:hover:border-black/15",
  "focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15",
  focusRing,
].join(" ");

export const pwnFieldClassLg = pwnFieldClass.replace("h-11", "h-12").replace("px-3.5", "px-4");

export const pwnFieldLabelClass = "block text-xs font-medium uppercase tracking-wide text-gray-400";

export const pwnFormLabelClass = "block text-xs font-medium uppercase tracking-wide text-gray-400";

/** Primary form / search panels on Pwn pages. */
export const pwnPanelClass =
  "rounded-3xl border border-dashed border-white/15 bg-bg-secondary/50 p-6 md:p-7 backdrop-blur-sm";
// creado por Patodev y Invertilo
