/** Formatos de Business. Sin dependencias: cliente y servidor. */

const BS = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatBs(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `Bs ${BS.format(Number.isFinite(n) ? n : 0)}`;
}

export function formatNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return BS.format(Number.isFinite(n) ? n : 0);
}

export const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function periodLabel(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(d);
}

/** yyyy-mm-dd de una fecha guardada a medianoche UTC. */
export function isoDay(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export const CONTRACT_LABELS: Record<string, string> = {
  INDEFINIDO: "Indefinido",
  PLAZO_FIJO: "Plazo fijo",
  EVENTUAL: "Eventual",
  PASANTIA: "Pasantía",
  CONSULTORIA: "Consultoría",
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  SANTA_CRUZ: "Santa Cruz",
  LA_PAZ: "La Paz",
  COCHABAMBA: "Cochabamba",
  CHUQUISACA: "Chuquisaca",
  POTOSI: "Potosí",
  ORURO: "Oruro",
  TARIJA: "Tarija",
  BENI: "Beni",
  PANDO: "Pando",
};
// creado por pato dev y askforvini
