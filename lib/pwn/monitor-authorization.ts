export const MONITOR_AUTH_MESSAGE_MAX = 280;

export type MonitorVerificationStatus = "PENDING" | "REQUESTED" | "VERIFIED" | "DENIED";

export type MonitorAuthBadge = {
  label: string;
  tone: "pending" | "waiting" | "ok" | "denied";
};

/** Only emails that are not the signed-in account need an administrator. */
export function needsAdminAuthorization(targetType: string, isAccountEmail: boolean): boolean {
  return targetType === "EMAIL" && !isAccountEmail;
}

export function canRequestMonitorAuthorization(status: string): boolean {
  return status === "PENDING" || status === "DENIED";
}

export function canDecideMonitorAuthorization(status: string): boolean {
  return status === "REQUESTED";
}

export function requestBlockedReason(status: string, targetType?: string): string | null {
  if (targetType === "DOMAIN") return "Los dominios se consultan y se patrullan sin autorización.";
  if (status === "VERIFIED") return "Este objetivo ya está autorizado.";
  if (status === "REQUESTED") return "Ya hay una solicitud pendiente de un administrador.";
  if (canRequestMonitorAuthorization(status)) return null;
  return "No se puede solicitar autorización para este objetivo.";
}

export function decisionBlockedReason(status: string): string | null {
  if (canDecideMonitorAuthorization(status)) return null;
  if (status === "VERIFIED") return "Este objetivo ya está autorizado.";
  return "No hay una solicitud pendiente para este objetivo.";
}

export function sanitizeAuthorizationMessage(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.slice(0, MONITOR_AUTH_MESSAGE_MAX);
}

export function monitorAuthBadge(status: string): MonitorAuthBadge {
  if (status === "VERIFIED") return { label: "En seguimiento", tone: "ok" };
  if (status === "REQUESTED") return { label: "Esperando al administrador", tone: "waiting" };
  if (status === "DENIED") return { label: "Rechazada", tone: "denied" };
  return { label: "Pendiente de autorización", tone: "pending" };
}

export function monitorAuthHint(status: string, targetType: string): string | null {
  if (targetType === "DOMAIN" || status === "VERIFIED") return null;
  if (status === "REQUESTED") {
    return "Un administrador debe autorizar el patrullaje de este correo. La consulta puntual no espera esa autorización.";
  }
  if (status === "DENIED") {
    return "La solicitud fue rechazada. Puedes volver a pedir autorización para el patrullaje.";
  }
  return "Este correo no es el de tu cuenta. Puedes consultarlo ahora; el patrullaje y las alertas piden autorización de un administrador.";
}

export function adminRequestCopy(ownerLabel: string, display: string, typeLabel: string): { title: string; body: string } {
  return {
    title: "Solicitud de patrullaje Pwn",
    body: `${ownerLabel} pide autorización para patrullar el ${typeLabel} ${display}.`,
  };
}

export function ownerDecisionCopy(approved: boolean, display: string): { title: string; body: string } {
  if (approved) {
    return {
      title: "Patrullaje autorizado",
      body: `Un administrador autorizó patrullar ${display}. Ya se pueden generar alertas de ese correo.`,
    };
  }
  return {
    title: "Patrullaje no autorizado",
    body: `Un administrador rechazó patrullar ${display}. Puedes volver a solicitarlo si hace falta.`,
  };
}

export function pendingConsultationCopy(display: string): { title: string; body: string } {
  return {
    title: "Pendiente de autorización",
    body: `${display} se puede consultar ya. El patrullaje y las alertas esperan a un administrador.`,
  };
}
// creado por pato dev y askforvini
