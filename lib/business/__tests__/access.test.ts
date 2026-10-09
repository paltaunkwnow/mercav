import { test } from "node:test";
import assert from "node:assert/strict";
import { can } from "../permissions";
import { isReservedSlug, slugify, uniqueSlug } from "../slug";
import { decryptField, encryptField, maskTail } from "../crypto";

test("matriz de permisos", () => {
  assert.ok(can("OWNER", "members.manage"));
  assert.ok(!can("HR_ADMIN", "members.manage"));
  assert.ok(can("HR_ADMIN", "payroll.close"));
  assert.ok(!can("HR_ADMIN", "payroll.reopen"));
  assert.ok(can("ACCOUNTANT", "payroll.export"));
  assert.ok(!can("ACCOUNTANT", "payroll.edit"));
  assert.ok(can("MANAGER", "employees.view"));
  assert.ok(!can("MANAGER", "employees.viewSensitive"));
  assert.ok(!can("EMPLOYEE", "employees.view"));
  assert.ok(!can(null, "employees.view"));
});

test("caja: quien entra como trabajador vende, pero no anula ni ve costos", () => {
  assert.ok(can("EMPLOYEE", "pos.sell"));
  assert.ok(!can("EMPLOYEE", "pos.void"));
  assert.ok(!can("EMPLOYEE", "pos.inventory"));
  assert.ok(!can("EMPLOYEE", "pos.reports"));
  assert.ok(can("MANAGER", "pos.void"));
  assert.ok(can("MANAGER", "pos.inventory"));
  assert.ok(can("ACCOUNTANT", "pos.reports"));
  assert.ok(!can("ACCOUNTANT", "pos.sell"));
  assert.ok(can("HR_ADMIN", "pos.configure"));
  assert.ok(!can("MANAGER", "pos.configure"));
});

test("slugs", async () => {
  assert.equal(slugify("Café & Panadería Ñandú S.R.L."), "cafe-panaderia-nandu-s-r-l");
  assert.equal(slugify("!"), "empresa");
  assert.ok(isReservedSlug("nueva"));
  const taken = new Set(["acme", "acme-2"]);
  assert.equal(await uniqueSlug("ACME", async (s) => taken.has(s)), "acme-3");
  assert.equal(await uniqueSlug("Nueva", async () => false), "nueva-2");
});

test("cifrado de campos: ida y vuelta, y texto alterado", () => {
  process.env.NEXTAUTH_SECRET ||= "test-secret";
  const enc = encryptField("1234567 SC");
  assert.ok(enc && enc.startsWith("v1:"));
  assert.notEqual(enc, encryptField("1234567 SC"), "IV distinto en cada cifrado");
  assert.equal(decryptField(enc), "1234567 SC");
  const parts = enc!.split(":");
  parts[3] = Buffer.from("otro").toString("base64");
  assert.equal(decryptField(parts.join(":")), null);
  assert.equal(encryptField("  "), null);
  assert.equal(maskTail("1000234567"), "••••4567");
});
// creado por pato dev y askforvini
