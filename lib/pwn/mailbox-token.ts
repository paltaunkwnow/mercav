import { createHash, randomBytes } from "node:crypto";

/** Un enlace de confirmación vale 48 h. */
export const MAILBOX_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * Token `<vence en base36>.<aleatorio>`. Se guarda solo su hash: como el hash cubre
 * el vencimiento, cambiarlo en el enlace invalida el token.
 */
export function issueMailboxToken(now = Date.now(), ttlMs = MAILBOX_TOKEN_TTL_MS): { token: string; tokenHash: string; expiresAt: Date } {
  const expiresAt = new Date(now + ttlMs);
  const token = `${Math.floor(expiresAt.getTime() / 1000).toString(36)}.${randomBytes(24).toString("base64url")}`;
  return { token, tokenHash: hashMailboxToken(token), expiresAt };
}

export function hashMailboxToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Forma válida y todavía vigente. No prueba que el token exista: eso lo hace el hash en la base. */
export function mailboxTokenUsable(token: string, now = Date.now()): boolean {
  const match = /^([0-9a-z]{1,10})\.([A-Za-z0-9_-]{20,64})$/.exec(token);
  if (!match) return false;
  const expiresAtSeconds = parseInt(match[1], 36);
  if (!Number.isFinite(expiresAtSeconds)) return false;
  return expiresAtSeconds * 1000 > now;
}
// creado por pato dev y askforvini
