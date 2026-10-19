import "server-only";
import { MailError, mailConfig } from "./config";
import type { MailAttachment, Mailbox, MailMessage } from "./types";

const CORE = "urn:ietf:params:jmap:core";
const MAIL = "urn:ietf:params:jmap:mail";
const SUBMISSION = "urn:ietf:params:jmap:submission";
type JmapSession = { apiUrl: string; uploadUrl: string; downloadUrl: string; primaryAccounts: Record<string, string>; accounts: Record<string, { isPersonal: boolean }>; capabilities: Record<string, unknown> };
export type MailConnection = { email: string; password: string; accountId?: string };
type JmapResult = { list?: unknown[]; ids?: string[]; total?: number; position?: number; created?: Record<string, { id: string }>; updated?: Record<string, unknown>; notCreated?: Record<string, unknown>; notUpdated?: Record<string, unknown>; [key: string]: unknown };

export function trustedJmapUrl(value: string): URL {
  const url = new URL(value);
  const { jmapUrl } = mailConfig();
  if (url.origin !== jmapUrl.origin || url.username || url.password) throw new MailError(502, "El servidor de correo devolvió una dirección no autorizada.");
  return url;
}

async function request(connection: MailConnection, url: URL, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Basic ${Buffer.from(`${connection.email}:${connection.password}`).toString("base64")}` }, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch { throw new MailError(502, "El servidor de correo no respondió. Intentá de nuevo en un momento."); }
  if (response.status === 401 || response.status === 403) throw new MailError(401, "Credenciales de correo inválidas o acceso suspendido.");
  if (!response.ok) throw new MailError(502, "El servidor de correo no pudo completar la solicitud.");
  return response;
}

export async function discoverMail(connection: MailConnection): Promise<JmapSession> {
  const response = await request(connection, mailConfig().jmapUrl);
  const session = await response.json() as JmapSession;
  const accountId = session.primaryAccounts?.[MAIL];
  if (!accountId || !session.accounts?.[accountId]?.isPersonal || !session.capabilities?.[MAIL]) throw new MailError(502, "No hay un buzón personal habilitado para esta cuenta.");
  trustedJmapUrl(session.apiUrl);
  if (connection.accountId && connection.accountId !== accountId) throw new MailError(401, "El acceso al buzón cambió. Iniciá sesión de nuevo.");
  return session;
}

export async function jmapCall(connection: MailConnection, method: string, args: Record<string, unknown>, submission = false): Promise<JmapResult> {
  const session = await discoverMail(connection);
  const response = await request(connection, trustedJmapUrl(session.apiUrl), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ using: submission ? [CORE, MAIL, SUBMISSION] : [CORE, MAIL], methodCalls: [[method, { ...args, accountId: session.primaryAccounts[MAIL] }, "m"]] }),
  });
  const data = await response.json() as { methodResponses?: [string, JmapResult, string][] };
  const result = data.methodResponses?.find((entry) => entry[2] === "m");
  if (!result || result[0] === "error") throw new MailError(502, "El servidor no pudo procesar esa operación de correo.");
  return result[1];
}

export async function getMailboxes(connection: MailConnection): Promise<Mailbox[]> {
  const result = await jmapCall(connection, "Mailbox/get", { properties: ["id", "name", "role", "totalEmails", "unreadEmails"] });
  return (result.list || []) as Mailbox[];
}

const SUMMARY_PROPERTIES = ["id", "threadId", "subject", "preview", "from", "to", "cc", "bcc", "receivedAt", "keywords", "mailboxIds", "hasAttachment"];
export async function listMessages(connection: MailConnection, mailboxId: string | undefined, q: string | undefined, position: number) {
  const filter = { ...(mailboxId ? { inMailbox: mailboxId } : {}), ...(q ? { text: q } : {}) };
  const query = await jmapCall(connection, "Email/query", { filter, sort: [{ property: "receivedAt", isAscending: false }], position, limit: 51 });
  const ids = (query.ids || []).slice(0, 50);
  if (!ids.length) return { messages: [], hasMore: false };
  const result = await jmapCall(connection, "Email/get", { ids, properties: SUMMARY_PROPERTIES });
  const byId = new Map((result.list as MailMessage[] || []).map((message) => [message.id, message]));
  return { messages: ids.map((id) => byId.get(id)).filter(Boolean), hasMore: (query.ids || []).length > 50 };
}

type RawMessage = Omit<MailMessage, "textBody"> & { textBody?: { partId: string }[]; bodyValues?: Record<string, { value: string }>; attachments?: MailAttachment[] };
export async function getMessage(connection: MailConnection, id: string): Promise<MailMessage> {
  const result = await jmapCall(connection, "Email/get", { ids: [id], properties: [...SUMMARY_PROPERTIES, "textBody", "bodyValues", "attachments"], fetchTextBodyValues: true, maxBodyValueBytes: 200_000 });
  const raw = result.list?.[0] as RawMessage | undefined;
  if (!raw) throw new MailError(404, "No encontramos ese mensaje.");
  const { bodyValues, textBody, ...rest } = raw;
  return { ...rest, textBody: (textBody || []).map((part) => bodyValues?.[part.partId]?.value || "").join("\n\n"), attachments: (raw.attachments || []).map((a) => ({ blobId: a.blobId, name: a.name || "adjunto", type: a.type || "application/octet-stream", size: a.size })) };
}

export async function updateMessage(connection: MailConnection, id: string, action: string, mailboxId?: string) {
  let patch: Record<string, unknown>;
  if (action === "move") {
    if (!(await getMailboxes(connection)).some((box) => box.id === mailboxId)) throw new MailError(400, "La carpeta no existe.");
    patch = { mailboxIds: { [mailboxId!]: true } };
  } else {
    const keyword = ["read", "unread"].includes(action) ? "$seen" : "$flagged";
    patch = { [`keywords/${keyword}`]: ["read", "star"].includes(action) ? true : null };
  }
  const result = await jmapCall(connection, "Email/set", { update: { [id]: patch } });
  if (result.notUpdated?.[id] || !(id in (result.updated || {}))) throw new MailError(409, "No pudimos actualizar el mensaje. Actualizá la bandeja.");
}

export interface ComposeInput { to: string[]; cc: string[]; bcc: string[]; subject: string; text: string; draft: boolean; draftId?: string; attachments: MailAttachment[] }
export async function composeMessage(connection: MailConnection, input: ComposeInput) {
  const mailboxes = await getMailboxes(connection);
  const drafts = mailboxes.find((box) => box.role === "drafts");
  const sent = mailboxes.find((box) => box.role === "sent");
  if (!drafts || (!input.draft && !sent)) throw new MailError(409, "Configurá las carpetas Borradores y Enviados en el servidor.");
  const identitiesResult = await jmapCall(connection, "Identity/get", {}, true);
  const identities = identitiesResult.list as { id: string; email: string; name: string }[] || [];
  const identity = identities.find((entry) => entry.email.toLowerCase() === connection.email.toLowerCase());
  if (!identity) throw new MailError(403, "No hay una identidad de envío autorizada para tu correo.");
  const email = {
    from: [{ name: identity.name, email: identity.email }],
    to: input.to.map((email) => ({ email })), cc: input.cc.map((email) => ({ email })), bcc: input.bcc.map((email) => ({ email })),
    subject: input.subject, keywords: { "$draft": true }, mailboxIds: { [drafts.id]: true },
    textBody: [{ partId: "body", type: "text/plain" }], bodyValues: { body: { value: input.text } },
    attachments: input.attachments.map((attachment) => ({ ...attachment, disposition: "attachment" })),
  };
  let id = input.draftId;
  if (id) {
    const previous = await getMessage(connection, id);
    if (!previous.keywords.$draft || !previous.mailboxIds[drafts.id]) throw new MailError(409, "Ese mensaje ya no es un borrador.");
    // JMAP Email bodies are immutable. Replace a saved draft with a new Email;
    // only delete the previous draft after successful creation of the replacement.
  }
  const created = await jmapCall(connection, "Email/set", { create: { draft: email } });
  const newId = created.created?.draft?.id;
  if (!newId) throw new MailError(502, "No pudimos guardar el borrador.");
  if (id) await jmapCall(connection, "Email/set", { destroy: [id] });
  id = newId;
  if (input.draft) return { id, draftId: id, sent: false };
  const submission = await jmapCall(connection, "EmailSubmission/set", {
    create: { send: { emailId: id, identityId: identity.id } },
    onSuccessUpdateEmail: { "#send": { keywords: { "$seen": true }, mailboxIds: { [sent!.id]: true } } },
  }, true);
  if (!submission.created?.send) throw new MailError(502, "No se confirmó el envío. Revisá Borradores y Enviados antes de reintentar.");
  return { id, sent: true };
}

export async function uploadAttachment(connection: MailConnection, data: ArrayBuffer, type: string) {
  const session = await discoverMail(connection);
  const url = trustedJmapUrl(session.uploadUrl.replace("{accountId}", encodeURIComponent(session.primaryAccounts[MAIL])));
  const response = await request(connection, url, { method: "POST", headers: { "Content-Type": type }, body: data });
  return await response.json() as { blobId: string; type: string; size: number };
}

export async function downloadAttachment(connection: MailConnection, attachment: MailAttachment) {
  const session = await discoverMail(connection);
  const replacements: Record<string, string> = { accountId: session.primaryAccounts[MAIL], blobId: attachment.blobId, name: attachment.name, type: "application/octet-stream" };
  const url = trustedJmapUrl(session.downloadUrl.replace(/\{(accountId|blobId|name|type)\}/g, (_, key: string) => encodeURIComponent(replacements[key])));
  return request(connection, url);
}
