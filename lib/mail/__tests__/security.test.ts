import test from "node:test";
import assert from "node:assert/strict";
import { assertMailOrigin, mailConfig } from "../config";
import { sealCredential, openCredential, newToken, hashToken } from "../crypto";
import { trustedJmapUrl } from "../jmap";
import { composeSchema, corporateEmail, mailId } from "../validation";

process.env.MAIL_ENABLED = "true";
process.env.MAIL_PUBLIC_URL = "https://mail.mercav.lat";
process.env.MAIL_JMAP_URL = "https://mx1.mercav.lat/.well-known/jmap";
process.env.MAIL_SESSION_KEY = "ab".repeat(32);

test("mail mutations require exact origin and custom header, including sibling domains", () => {
  const make = (origin: string, header = "1") => new Request("https://mail.mercav.lat/api/mail/send", { method: "POST", headers: { Origin: origin, "X-Mercav-Mail": header } });
  assert.doesNotThrow(() => assertMailOrigin(make("https://mail.mercav.lat")));
  assert.throws(() => assertMailOrigin(make("https://mercav.lat")));
  assert.throws(() => assertMailOrigin(make("https://evil.test")));
  assert.throws(() => assertMailOrigin(make("https://mail.mercav.lat", "")));
  assert.throws(() => assertMailOrigin(new Request("https://mail.mercav.lat/api/mail/send", { method: "POST" })));
});

test("credentials encrypted per session cannot be opened for another account or after tampering", () => {
  const encrypted = sealCredential("private-password", "account-one");
  assert.ok(!encrypted.includes("private-password"));
  assert.equal(openCredential(encrypted, "account-one"), "private-password");
  assert.throws(() => openCredential(encrypted, "account-two"));
  const [iv, tag, body] = encrypted.split(".");
  const altered = Buffer.from(body, "base64url"); altered[0] ^= 1;
  assert.throws(() => openCredential(`${iv}.${tag}.${altered.toString("base64url")}`, "account-one"));
  assert.throws(() => openCredential("invalid", "account-one"));
  const token = newToken();
  assert.equal(token.length, 43);
  assert.notEqual(hashToken(token), token);
});

test("JMAP discovery URLs cannot leak credentials to another host", () => {
  assert.equal(trustedJmapUrl("https://mx1.mercav.lat/jmap").hostname, "mx1.mercav.lat");
  for (const url of ["https://evil.test/jmap", "http://mx1.mercav.lat/jmap", "https://u:p@mx1.mercav.lat/jmap", "https://mx1.mercav.lat.evil.test/jmap"]) assert.throws(() => trustedJmapUrl(url));
});

test("mail allowlist validation rejects public domains and ambiguous IDs", () => {
  assert.equal(corporateEmail.parse(" Person@mercav.lat "), "person@mercav.lat");
  for (const email of ["person@gmail.com", "person@evilmercav.lat", "person@mercav.lat.evil.test"]) assert.equal(corporateEmail.safeParse(email).success, false);
  for (const id of ["../secret", "x/y", "x\n", ""]) assert.equal(mailId.safeParse(id).success, false);
});

test("compose rejects header injection, empty send and excessive recipients, while drafts may be empty", () => {
  const base = { to: ["person@example.com"], subject: "Hola", text: "Mensaje" };
  assert.equal(composeSchema.safeParse(base).success, true);
  assert.equal(composeSchema.safeParse({ ...base, subject: "Hello\r\nBcc: victim@example.com" }).success, false);
  assert.equal(composeSchema.safeParse({ ...base, to: [] }).success, false);
  assert.equal(composeSchema.safeParse({ ...base, to: [], draft: true }).success, true);
  assert.equal(composeSchema.safeParse({ ...base, to: Array(40).fill("a@example.com"), cc: Array(40).fill("b@example.com") }).success, false);
});

test("mail fails closed when disabled", () => {
  process.env.MAIL_ENABLED = "false";
  assert.throws(() => mailConfig());
  process.env.MAIL_ENABLED = "true";
});
