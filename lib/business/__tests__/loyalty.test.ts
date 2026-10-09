import { test } from "node:test";
import assert from "node:assert/strict";
import { birthdayDue, expiryState, normalizeDesign, normalizeRules, planEarn, planRedeem, pointsForPurchase, progressFor, tierFor } from "../loyalty/engine";
import { contrastRatio, resolvePalette, PALETTES, BUSINESS_TYPES } from "../loyalty/templates";
import { kioskCode, newClubCode, newReferralCode, newSerial, parseClubCode, serialFromScan, verifyKioskCode, newKioskSecret } from "../loyalty/codes";
import type { RewardView } from "../loyalty/types";

const now = new Date("2026-10-08T15:00:00Z");
const stamps = normalizeRules({}, "CAFE");
const points = normalizeRules({}, "RESTAURANTE");
const coffee: RewardView[] = [{ id: "r1", name: "Café gratis", description: null, cost: 10, active: true }];

const ctx = (over: Partial<Parameters<typeof planEarn>[1]> = {}) => ({ type: "STAMPS" as const, rules: stamps, earnedToday: 0, selfServiceToday: 0, lastEarnAt: null, source: "STAFF" as const, now, ...over });

test("reglas por rubro y saneamiento", () => {
  assert.equal(stamps.stampsGoal, 10);
  assert.equal(points.unitAmount, 10);
  const weird = normalizeRules({ stampsGoal: 999, maxPerDay: -5, expiresDays: 3, tiers: [{ name: "Oro", minLifetime: 50 }, { name: "Plata", minLifetime: 20 }, { name: "" }] }, "CAFE");
  assert.equal(weird.stampsGoal, 30);
  assert.equal(weird.maxPerDay, 1);
  assert.equal(weird.expiresDays, 7);
  assert.deepEqual(weird.tiers.map((t) => t.name), ["Plata", "Oro"]);
  assert.equal(normalizeRules({ expiresDays: null }, "CAFE").expiresDays, null);
});

test("sellos: topes por acción, por día y espera entre sumas", () => {
  assert.deepEqual(planEarn({ kind: "stamps", qty: 1 }, ctx()), { ok: true, amount: 1 });
  assert.equal(planEarn({ kind: "stamps", qty: 4 }, ctx()).ok, false);
  const daily = planEarn({ kind: "stamps", qty: 2 }, ctx({ earnedToday: 2 }));
  assert.equal(daily.ok, false);
  assert.match((daily as { message: string }).message, /solo se pueden sumar 1/);
  const cool = planEarn({ kind: "stamps", qty: 1 }, ctx({ lastEarnAt: new Date(now.getTime() - 30_000) }));
  assert.equal(cool.ok, false);
  assert.equal((cool as { code: string }).code, "COOLDOWN");
  assert.equal(planEarn({ kind: "purchase", amount: 50 }, ctx()).ok, false, "un programa de sellos no suma por monto");
});

test("puntos por monto de compra", () => {
  assert.equal(pointsForPurchase(95, points), 9);
  assert.equal(pointsForPurchase(9.99, points), 0);
  assert.deepEqual(planEarn({ kind: "purchase", amount: 250 }, ctx({ type: "POINTS", rules: points })), { ok: true, amount: 25 });
  assert.equal(planEarn({ kind: "purchase", amount: 5 }, ctx({ type: "POINTS", rules: points })).ok, false);
});

test("autoservicio: apagado por defecto, un sello por día", () => {
  assert.equal(planEarn({ kind: "stamps", qty: 1 }, ctx({ source: "SELF_SERVICE" })).ok, false);
  const on = { ...stamps, selfService: true };
  assert.deepEqual(planEarn({ kind: "stamps", qty: 3 }, ctx({ rules: on, source: "SELF_SERVICE" })), { ok: true, amount: 1 });
  assert.equal(planEarn({ kind: "stamps", qty: 1 }, ctx({ rules: on, source: "SELF_SERVICE", selfServiceToday: 1 })).ok, false);
});

test("progreso y textos", () => {
  const p = progressFor("STAMPS", stamps, coffee, 7);
  assert.equal(p.remaining, 3);
  assert.equal(p.label, "Te faltan 3 sellos para Café gratis");
  assert.equal(progressFor("STAMPS", stamps, coffee, 9).label, "Te falta 1 sello para Café gratis");
  const done = progressFor("STAMPS", stamps, coffee, 10);
  assert.equal(done.label, "¡Tenés Café gratis disponible!");
  assert.equal(done.available.length, 1);
  const multi: RewardView[] = [
    { id: "a", name: "Postre", description: null, cost: 100, active: true },
    { id: "b", name: "Cena", description: null, cost: 300, active: true },
  ];
  const pts = progressFor("POINTS", points, multi, 140);
  assert.equal(pts.available.length, 1);
  assert.equal(pts.nextReward?.name, "Cena");
  assert.equal(pts.goal, 300);
});

test("canje", () => {
  assert.deepEqual(planRedeem(10, coffee[0]), { ok: true, cost: 10 });
  assert.equal(planRedeem(9, coffee[0]).ok, false);
  assert.equal(planRedeem(50, { ...coffee[0], active: false }).ok, false);
});

test("vencimiento por inactividad", () => {
  const rules = { ...stamps, expiresDays: 30 };
  assert.equal(expiryState(new Date("2026-09-01T00:00:00Z"), rules, now).expired, true);
  const fresh = expiryState(new Date("2026-10-01T00:00:00Z"), rules, now);
  assert.deepEqual(fresh, { expired: false, expiresOn: "2026-10-31" });
  assert.equal(expiryState(new Date("2020-01-01T00:00:00Z"), stamps, now).expired, false, "sin vencimiento");
});

test("cumpleaños: una vez por año, dentro de los 30 días", () => {
  assert.equal(birthdayDue("10-05", null, stamps, "2026-10-08"), 2026);
  assert.equal(birthdayDue("10-05", 2026, stamps, "2026-10-08"), false);
  assert.equal(birthdayDue("08-01", null, stamps, "2026-10-08"), false, "más de 30 días después");
  assert.equal(birthdayDue("12-28", null, stamps, "2027-01-10"), 2026, "cruza el año");
  assert.equal(birthdayDue("10-05", null, { ...stamps, birthdayBonus: 0 }, "2026-10-08"), false);
});

test("niveles", () => {
  const tiers = [{ name: "Plata", minLifetime: 20, perk: "5 %" }, { name: "Oro", minLifetime: 50, perk: "10 %" }];
  assert.deepEqual(tierFor(10, tiers), { current: null, next: tiers[0], toNext: 10 });
  assert.deepEqual(tierFor(60, tiers), { current: tiers[1], next: null, toNext: null });
});

test("diseño: logos solo como imagen chica y paletas legibles", () => {
  const d = normalizeDesign({ palette: "custom", base: "#ffffff", accent: "#000000", logoDataUrl: "javascript:alert(1)", benefits: ["descuentos", "x", "descuentos"] }, "CAFE", "Café Sol");
  assert.equal(d.logoDataUrl, null);
  assert.deepEqual(d.benefits, ["descuentos"]);
  assert.equal(d.displayName, "Café Sol");
  const pal = resolvePalette(d);
  assert.equal(pal.light, true);
  for (const p of Object.values(PALETTES)) assert.ok(contrastRatio(p.text, p.base) >= 7, `${p.label} texto`);
  for (const p of Object.values(PALETTES)) assert.ok(contrastRatio(p.accent, p.base) >= 3, `${p.label} acento`);
  assert.ok(BUSINESS_TYPES.every((t) => t.benefits.length === 4));
});

test("códigos: serial, referido y QR rotativo", () => {
  const serial = newSerial();
  assert.match(serial, /^[A-Z2-7]{24}$/);
  assert.notEqual(serial, newSerial());
  assert.match(newReferralCode(), /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(serialFromScan(`https://app.mercav.lat/c/cafe-sol/t/${serial}`), serial);
  assert.equal(serialFromScan(serial.toLowerCase()), serial);
  assert.equal(serialFromScan("hola"), null);
  const secret = newKioskSecret();
  const code = kioskCode(secret, now);
  assert.match(code, /^\d{6}$/);
  assert.equal(verifyKioskCode(secret, code, now), true);
  assert.equal(verifyKioskCode(secret, code, new Date(now.getTime() + 30_000)), true, "acepta el período anterior");
  assert.equal(verifyKioskCode(secret, code, new Date(now.getTime() + 95_000)), false);
});
test("MercavClub: formato, control y lo que dicta el cliente", () => {
  const code = newClubCode();
  assert.match(code, /^MC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{5}$/);
  assert.equal(parseClubCode(code), code);
  // Tipeado en minúsculas, sin guiones y con espacios.
  assert.equal(parseClubCode(code.toLowerCase().replace(/-/g, " ")), code);
  // Un carácter cambiado no pasa el control.
  const body = code.replace(/-/g, "").slice(2);
  const swapped = body[0] === "A" ? "B" + body.slice(1) : "A" + body.slice(1);
  assert.equal(parseClubCode(`MC${swapped}`), null);
  assert.equal(parseClubCode("12345"), null);
  assert.equal(new Set(Array.from({ length: 200 }, () => newClubCode())).size, 200);
});
// creado por pato dev y askforvini
