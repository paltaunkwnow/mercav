import { createHmac } from "node:crypto";

const REDACTED = "***";
// Requires a dotted domain so secrets that merely contain "@" (e.g. "P@ssw0rd") use generic redaction.
const EMAIL_LIKE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * HMAC-SHA256 hex (keyed with PWN_IDENTIFIER_PEPPER) of the trimmed, lowercased
 * input. Normalize with ./normalization first so the same subject always
 * produces the same hash. Unkeyed sha256 of emails is trivially reversible by
 * dictionary, so a missing pepper is a hard error.
 */
export function hashSubject(input: string): string {
  const pepper = process.env.PWN_IDENTIFIER_PEPPER;
  if (!pepper) {
    throw new Error("PWN_IDENTIFIER_PEPPER is not set; refusing to hash Pwn identifiers");
  }
  return createHmac("sha256", pepper)
    .update(String(input ?? "").trim().toLowerCase(), "utf8")
    .digest("hex");
}

/** "juan.perez@gmail.com" -> "j***@g***". Never returns the original value. */
export function redactEmail(email: string): string {
  const value = String(email ?? "").trim();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) {
    return redactSubject(value.replace(/@/g, ""));
  }
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `${local[0]}${REDACTED}@${domain[0]}${REDACTED}`;
}

/** Generic redaction for any sensitive identifier (emails, usernames, tokens, passwords). */
export function redactSubject(input: string): string {
  const value = String(input ?? "").trim();
  if (value.length === 0) return REDACTED;

  if (EMAIL_LIKE_RE.test(value)) return redactEmail(value);

  const redacted = value.length <= 2 ? REDACTED : `${value[0]}${REDACTED}`;
  return redacted === value ? REDACTED : redacted;
}
