import type { LoyaltyProgramView, LoyaltyTypeKey } from "@/lib/business/loyalty/types";

/** Textos de cada estado del programa. Puro: servidor y cliente. */

export type ProgramStatus = LoyaltyProgramView["status"];

export const STATUS_LABELS: Record<ProgramStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  ARCHIVED: "Archivado",
};

export function statusDescription(status: ProgramStatus, type: LoyaltyTypeKey) {
  const what = type === "STAMPS" ? "sellos" : "puntos";
  switch (status) {
    case "DRAFT":
      return "Todavía no recibe clientes. Revisá el diseño y los premios, y activalo cuando esté listo.";
    case "ACTIVE":
      return `Tus clientes ya se pueden sumar y juntar ${what}.`;
    case "PAUSED":
      return `No se suman clientes nuevos ni ${what}. Las tarjetas y los saldos se mantienen.`;
    case "ARCHIVED":
      return "Está guardado sin uso. Nadie puede sumarse, sumar ni canjear. Podés restaurarlo cuando quieras.";
  }
}

export const statusChipClass = (status: ProgramStatus) => (status === "ACTIVE" ? "mv-chip mv-chip-gold" : "mv-chip");

// creado por pato dev y askforvini
