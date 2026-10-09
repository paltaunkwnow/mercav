import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const DNS_TXT_PREFIX = "mercav-pwn=";

export function generateVerificationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashVerificationToken(token) };
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** True only when a TXT record is exactly `mercav-pwn=<token>` for the stored hash. */
export function txtRecordMatches(record: string, tokenHash: string): boolean {
  if (!record.startsWith(DNS_TXT_PREFIX)) return false;
  const candidate = Buffer.from(hashVerificationToken(record.slice(DNS_TXT_PREFIX.length)), "hex");
  const expected = Buffer.from(tokenHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/** resolveTxt devuelve cada registro partido en trozos de hasta 255 bytes: los unimos. */
export function flattenTxtRecords(records: string[][]): string[] {
  return records.map((chunks) => chunks.join("").trim()).filter(Boolean);
}

export function anyTxtRecordMatches(records: string[][], tokenHash: string): boolean {
  return flattenTxtRecords(records).some((record) => txtRecordMatches(record, tokenHash));
}

export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
// creado por pato dev y askforvini
