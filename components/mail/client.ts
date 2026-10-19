import type { MailAddress, MailAttachment, Mailbox, MailMessage as Message } from "@/lib/mail/types";
export type { MailUser, MailAddress, Mailbox, MailAttachment } from "@/lib/mail/types";
export type MailMessageSummary = Message;
export type MailMessage = Message & { textBody: string; attachments: MailAttachment[] };

export class MailRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function mailRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/mail${path}`, {
      ...options, credentials: "same-origin", cache: "no-store",
      headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), "X-Mercav-Mail": "1", ...options.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new MailRequestError("No pudimos conectar. Revisá tu conexión y volvé a intentar.", 0);
  }
  const body = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: unknown } | null;
  if (!response.ok || body?.success !== true || !body.data) {
    throw new MailRequestError(typeof body?.error === "string" ? body.error : "No pudimos completar la solicitud. Intentá nuevamente.", response.status);
  }
  return body.data;
}

export function mailboxLabel(mailbox: Mailbox): string {
  return ({ inbox: "Recibidos", sent: "Enviados", drafts: "Borradores", trash: "Papelera", junk: "Spam", archive: "Archivo" } as Record<string, string>)[mailbox.role ?? ""] ?? mailbox.name;
}

export function addressLabel(addresses: MailAddress[] | undefined): string {
  return addresses?.map((address) => address.name || address.email).join(", ") || "Sin remitente";
}

export function fileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
