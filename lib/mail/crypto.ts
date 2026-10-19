import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mailConfig } from "./config";

export function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function newToken() { return randomBytes(32).toString("base64url"); }
export function sealCredential(value: string, accountId: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", mailConfig().key, iv);
  cipher.setAAD(Buffer.from(accountId));
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}
export function openCredential(value: string, accountId: string) {
  const [iv, tag, payload] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", mailConfig().key, iv);
  cipher.setAAD(Buffer.from(accountId));
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(payload), cipher.final()]).toString("utf8");
}
