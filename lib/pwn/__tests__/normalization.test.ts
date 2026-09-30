import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCve, normalizeDomain, normalizeEmail } from "../normalization";
import { canManageMonitoring, isAdmin } from "../permissions";
import { getSourceCatalog } from "../source-catalog";

test("normalizeEmail", () => {
  assert.equal(normalizeEmail("  Juan@Gmail.COM "), "juan@gmail.com");
  assert.equal(normalizeEmail("no-at-sign"), null);
  assert.equal(normalizeEmail("a@localhost"), null);
  assert.equal(normalizeEmail("a b@x.com"), null);
  assert.equal(normalizeEmail("a@www.foo.com"), "a@www.foo.com");
  assert.equal(normalizeEmail("a@foo.com/path"), null);
});

test("normalizeDomain", () => {
  assert.equal(normalizeDomain("https://www.Mercav.lat:443/path?q=1"), "mercav.lat");
  assert.equal(normalizeDomain("*.example.com."), "example.com");
  assert.equal(normalizeDomain("192.168.0.1"), null);
  assert.equal(normalizeDomain("-bad-.com"), null);
  assert.equal(normalizeDomain(""), null);
});

test("normalizeCve", () => {
  assert.equal(normalizeCve(" cve-2024-3094 "), "CVE-2024-3094");
  assert.equal(normalizeCve("CVE-2021-44228"), "CVE-2021-44228");
  assert.equal(normalizeCve("CVE-24-1"), null);
});

test("permissions", () => {
  assert.equal(canManageMonitoring("u1", "u1"), true);
  assert.equal(canManageMonitoring("u1", "u2"), false);
  assert.equal(canManageMonitoring(null, "u1"), false);
  assert.equal(isAdmin(["FREELANCER", "ADMIN"]), true);
  assert.equal(isAdmin(["FREELANCER"]), false);
  assert.equal(isAdmin(undefined), false);
});

test("source catalog flags depend on env presence only", () => {
  const without = getSourceCatalog({});
  assert.deepEqual(without.map((s) => s.key), ["HIBP", "NVD", "CISA_KEV"]);
  assert.equal(without.find((s) => s.key === "HIBP")?.enabled, false);
  assert.equal(without.find((s) => s.key === "NVD")?.enabled, true);
  assert.equal(getSourceCatalog({ HIBP_API_KEY: "x" }).find((s) => s.key === "HIBP")?.enabled, true);
  assert.equal(getSourceCatalog({ HIBP_API_KEY: "   " }).find((s) => s.key === "HIBP")?.enabled, false);
});
// creado por pato dev y askforvini
