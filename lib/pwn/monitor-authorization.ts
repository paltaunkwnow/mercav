export const MONITOR_AUTH_MESSAGE_MAX = 280;

export type MonitorVerificationStatus = "PENDING" | "REQUESTED" | "VERIFIED" | "DENIED";

/**
 * Cómo se prueba que un objetivo es de quien lo sigue.
 * - ACCOUNT: el correo de la cuenta, ya confirmado (Google o cuenta verificada).
 * - EMAIL_LINK: enlace enviado a ese buzón, abierto con la misma cuenta.
 * - ADMIN_AUTHORIZATION: sin correo saliente configurado, un administrador lo aprueba.
 * - DNS_TXT: registro `mercav-pwn=<token>` en el DNS del dominio.
 */
export type ConfirmationMethod = "ACCOUNT" | "EMAIL_LINK" | "ADMIN_AUTHORIZATION" | "DNS_TXT";

export type MonitorAuthBadge = {
  label: string;
  tone: "pending" | "waiting" | "ok" | "denied";
};

/** Solo el correo de la cuenta, y solo si la cuenta confirmó ese buzón, se verifica solo. */
export function canAutoVerifyEmail(input: { isAccountEmail: boolean; accountConfirmed: boolean }): boolean {
  return input.isAccountEmail && input.accountConfirmed;
}

export function confirmationMethodFor(input: {
  targetType: string;
  isAccountEmail: boolean;
  accountConfirmed: boolean;
  mailerReady: boolean;
}): ConfirmationMethod {
  if (input.targetType === "DOMAIN") return "DNS_TXT";
  if (canAutoVerifyEmail(input)) return "ACCOUNT";
  return input.mailerReady ? "EMAIL_LINK" : "ADMIN_AUTHORIZATION";
}

/** Correos que no se pueden probar solos. Los dominios usan DNS, no un administrador. */
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
  if (targetType === "DOMAIN") return "Los dominios se verifican con un registro DNS TXT, no con un administrador.";
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

export function monitorAuthBadge(status: string, targetType?: string): MonitorAuthBadge {
  if (status === "VERIFIED") return { label: "Verificado", tone: "ok" };
  if (status === "REQUESTED") return { label: "Esperando al administrador", tone: "waiting" };
  if (status === "DENIED") return { label: "Rechazada", tone: "denied" };
  if (targetType === "DOMAIN") return { label: "Falta el registro DNS", tone: "pending" };
  return { label: "Falta confirmar el correo", tone: "pending" };
}

export function monitorAuthHint(
  status: string,
  targetType: string,
  method?: ConfirmationMethod | null,
  isAccountEmail?: boolean,
): string | null {
  if (status === "VERIFIED") return null;
  if (targetType === "DOMAIN") {
    return "Agregá el registro TXT al DNS de este dominio y tocá Comprobar. Hasta entonces, la consulta usa el catálogo público y no hay patrullaje ni alertas.";
  }
  if (method === "EMAIL_LINK") {
    return "Te enviamos un enlace a ese correo. Abrilo con esta misma cuenta para confirmar que es tuyo. Mientras tanto, la consulta solo dice si aparece o no.";
  }
  if (status === "REQUESTED") {
    return "Un administrador revisa la solicitud. La consulta puntual no espera esa autorización, pero solo dice si aparece o no.";
  }
  if (status === "DENIED") {
    return "La solicitud fue rechazada. Podés volver a pedir autorización para el patrullaje.";
  }
  if (isAccountEmail) {
    return "Tu cuenta todavía no confirmó este correo y este entorno no envía correos de confirmación. Podés pedir autorización a un administrador.";
  }
  return "Este correo no es el de tu cuenta. Podés consultarlo ya (solo si aparece o no); el detalle, el patrullaje y las alertas piden autorización de un administrador.";
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
    body: `Un administrador rechazó patrullar ${display}. Podés volver a solicitarlo si hace falta.`,
  };
}

export function pendingConsultationCopy(display: string): { title: string; body: string } {
  return {
    title: "Pendiente de autorización",
    body: `${display} se puede consultar ya (solo si aparece o no). El detalle, el patrullaje y las alertas esperan a un administrador.`,
  };
}

export function mailboxLinkCopy(display: string): { title: string; body: string } {
  return {
    title: "Revisá ese correo",
    body: `Te enviamos un enlace a ${display}. Abrilo con esta misma cuenta en las próximas 48 h para confirmar que es tuyo.`,
  };
}
// creado por pato dev y askforvini
