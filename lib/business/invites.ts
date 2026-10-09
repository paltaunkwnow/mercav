import { createHash, randomBytes } from "node:crypto";

export const INVITE_DAYS = 7;

export function newInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
// creado por pato dev y askforvini
