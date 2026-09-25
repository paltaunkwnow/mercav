import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { hashSubject, redactEmail, redactSubject } from "../redaction";
import { buildAlert } from "../alert-engine";

test("redactEmail keeps only first char of local part and domain", () => {
  assert.equal(redactEmail("juan.perez@gmail.com"), "j***@g***");
  assert.equal(redactEmail("  Ana@Empresa.com.bo "), "A***@E***");
});

test("redactEmail never exposes the local part or full domain", () => {
  const email = "maria.lopez@banco-ejemplo.com";
  const out = redactEmail(email);
  assert.notEqual(out, email);
  assert.ok(!out.includes("maria"));
  assert.ok(!out.includes("banco-ejemplo"));
});

test("redactEmail handles malformed input without echoing it", () => {
  assert.equal(redactEmail(""), "***");
  assert.equal(redactEmail("@"), "***");
  assert.notEqual(redactEmail("sinarroba"), "sinarroba");
});

test("redactSubject never echoes a plaintext password", () => {
  const passwords = ["P@ssw0rd!2024", "hunter2", "correct horse battery staple", "ab", "x"];
  for (const password of passwords) {
    const out = redactSubject(password);
    assert.notEqual(out, password);
    assert.ok(!out.includes(password), `leaked: ${password}`);
    assert.ok(out.length <= 4);
  }
  assert.equal(redactSubject("P@ssw0rd!2024"), "P***");
});

test("redactSubject routes emails through redactEmail", () => {
  assert.equal(redactSubject("pedro@mercav.lat"), "p***@m***");
});

test("redactSubject never returns its input even if it already looks redacted", () => {
  assert.notEqual(redactSubject("a***"), "a***");
});

test("hashSubject is peppered HMAC-SHA256 hex, normalized and does not contain the input", () => {
  const previous = process.env.PWN_IDENTIFIER_PEPPER;
  process.env.PWN_IDENTIFIER_PEPPER = "test-pepper";
  try {
    const hash = hashSubject("Juan@Gmail.com");
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.equal(hash, hashSubject("  juan@gmail.com "));
    assert.equal(
      hashSubject("abc"),
      createHmac("sha256", "test-pepper").update("abc", "utf8").digest("hex"),
    );
    assert.notEqual(
      hashSubject("abc"),
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    assert.ok(!hash.includes("juan"));
  } finally {
    if (previous === undefined) delete process.env.PWN_IDENTIFIER_PEPPER;
    else process.env.PWN_IDENTIFIER_PEPPER = previous;
  }
});

test("hashSubject throws instead of falling back to unsalted sha256", () => {
  const previous = process.env.PWN_IDENTIFIER_PEPPER;
  delete process.env.PWN_IDENTIFIER_PEPPER;
  try {
    assert.throws(() => hashSubject("abc"), /PWN_IDENTIFIER_PEPPER/);
  } finally {
    if (previous !== undefined) process.env.PWN_IDENTIFIER_PEPPER = previous;
  }
});

test("buildAlert output never includes passwords or raw emails", () => {
  const alert = buildAlert({
    kind: "BREACH",
    targetDisplay: "juan.perez@gmail.com",
    breachName: "EjemploBreach",
    dataTypes: ["Email addresses", "Passwords", "password: hunter2"],
    severity: "HIGH",
    verificationStatus: "UNVERIFIED",
    sourceName: "Have I Been Pwned",
  });
  const text = `${alert.title}\n${alert.body}`;
  assert.ok(!text.includes("hunter2"));
  assert.ok(!text.includes("juan.perez"));
  assert.ok(text.includes("j***@g***"));
  assert.ok(text.includes("No verificado"));
  assert.ok(!text.includes("Estado de verificación: Confirmado"));
  assert.equal(alert.severity, "HIGH");
});

test("buildAlert describes KEV vulnerabilities in Spanish", () => {
  const alert = buildAlert({ kind: "VULNERABILITY", cveId: "CVE-2024-3094", kev: true, severity: "CRITICAL", verificationStatus: "CONFIRMED" });
  assert.match(alert.title, /explotada activamente/);
  assert.match(alert.body, /CISA KEV/);
  assert.equal(alert.severity, "CRITICAL");
});
// creado por Patodev y Invertilo
