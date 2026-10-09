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

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha y hora local. Un valor solo-fecha ("2024-03-01") se muestra como día, sin hora inventada. */
export function formatWhen(value: string | null | undefined): string | null {
  if (!value) return null;
  if (DATE_ONLY.test(value)) return formatDay(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Solo el día, en UTC. Para fechas que la fuente da sin hora (fecha de una filtración en HIBP,
 * alta en KEV, publicación de un CVE): en hora local, "2024-03-01" se correría al 29 de febrero.
 */
export function formatDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(DATE_ONLY.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: "UTC" }).format(date);
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

/** Shared Pwn inputs — built on the system `mv-input`, so dark and light themes come from the tokens. */
export const pwnFieldClass = "mv-input h-11 text-[0.9375rem] disabled:cursor-not-allowed disabled:opacity-50";

export const pwnFieldClassLg = "mv-input h-12 disabled:cursor-not-allowed disabled:opacity-50";

export const pwnFieldLabelClass = "block text-sm font-medium text-[var(--text-secondary)]";

export const pwnFormLabelClass = "block text-sm font-medium text-[var(--text-primary)]";

/** Primary form / search panels on Pwn pages. mv-panel ya trae el radio de 1.25rem. */
export const pwnPanelClass = "mv-panel p-5 md:p-7";

/** Result cards (one finding, alert, target…). Dashed outline is reserved for unverified claims. */
export const pwnCardClass = "mv-panel p-5 md:p-6";

export const pwnUnverifiedCardClass = "border-dashed !border-[var(--mv-hairline-strong)]";

/** Caja interna de una tarjeta (nota, cita, aviso): radio de control. */
export const pwnInsetClass = "rounded-[0.875rem] border border-[var(--mv-hairline)] px-4 py-3";

/** Cuadro del ícono de una tarjeta. */
export const pwnIconTileClass =
  "grid h-11 w-11 shrink-0 place-items-center rounded-[0.875rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold";

/** Botón chico con área táctil de 44 px. */
export const pwnTapClass = "min-h-11";

/** Agranda el área táctil de un enlace chico (insignia, autor) a 44 px de alto sin cambiar cómo se ve. */
export const pwnHitAreaClass = "relative before:absolute before:inset-x-0 before:-inset-y-3 before:content-['']";

/** Small factual tag (data types, forum names). */
export const pwnTagClass =
  "inline-flex items-center rounded-full border border-[var(--mv-hairline-strong)] px-2.5 py-1 text-xs text-[var(--text-secondary)]";

/** Bordes y fondos con los tokens de Pwn: magenta para alertas, amarillo para advertencias. */
export const pwnAlertToneClass =
  "border-[color-mix(in_srgb,var(--p-alert)_45%,transparent)] bg-[var(--p-alert-wash)] text-[var(--p-alert)]";
export const pwnWarnToneClass =
  "border-[color-mix(in_srgb,var(--p-warn)_55%,transparent)] bg-[color-mix(in_srgb,var(--p-warn)_12%,transparent)] text-[var(--p-warn)]";

// creado por pato dev y askforvini
