import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARD_FILTERS,
  cleanQuery,
  customerSheetRows,
  describeAudience,
  isAtRisk,
  minRewardCost,
  parseCardFilter,
  parsePage,
  percent,
  phoneDigits,
  rewardLine,
  shortDay,
  weeklySeries,
  type CustomerRow,
} from "../loyalty/stats-core";

const now = new Date("2026-10-08T15:00:00Z");
const tz = "America/La_Paz";

test("semanas móviles: ocho puntos, de la más vieja a la más nueva", () => {
  const series = weeklySeries(
    [
      { week: 0, kind: "earn", count: 5 },
      { week: 0, kind: "redeem", count: 2 },
      { week: 7, kind: "earn", count: 1 },
      { week: 8, kind: "earn", count: 99 },
      { week: -1, kind: "earn", count: 99 },
    ],
    now,
    tz,
  );
  assert.equal(series.length, 8);
  assert.deepEqual(series[7], { label: "2 oct", from: "2026-10-02", visits: 5, redeems: 2 });
  assert.equal(series[0].visits, 1, "la semana 7 es la primera");
  assert.equal(series.reduce((n, p) => n + p.visits, 0), 6, "fuera de rango no cuenta");
  assert.equal(series[0].from, "2026-08-14");
});

test("fechas cortas en la zona de la empresa", () => {
  // 02:00 UTC del 1 de enero todavía es 31 de diciembre en La Paz.
  assert.equal(shortDay(new Date("2027-01-01T02:00:00Z"), tz), "31 dic");
  assert.equal(shortDay(new Date("2027-01-01T12:00:00Z"), tz), "1 ene");
});

test("porcentajes y premio más barato", () => {
  assert.equal(percent(1, 3), 33);
  assert.equal(percent(5, 0), 0);
  assert.equal(minRewardCost([{ cost: 10, active: true }, { cost: 4, active: false }, { cost: 8, active: true }]), 8);
  assert.equal(minRewardCost([{ cost: 4, active: false }]), null);
});

test("filtros, páginas y búsqueda", () => {
  assert.equal(parseCardFilter("atRisk"), "atRisk");
  assert.equal(parseCardFilter("hack"), "all");
  assert.equal(parseCardFilter(null), "all");
  assert.equal(CARD_FILTERS.length, 4);
  assert.equal(parsePage("3"), 3);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("abc"), 1);
  assert.equal(parsePage("99999999"), 10_000);
  assert.equal(cleanQuery("  Ana   María  "), "Ana María");
  assert.equal(phoneDigits("+591 7000-1234"), "59170001234");
  assert.equal(phoneDigits("ana@correo.com"), null);
  assert.equal(phoneDigits("12"), null);
});

test("en riesgo: sin visitas en 30 días (o nunca volvió)", () => {
  assert.equal(isAtRisk("2026-09-01T00:00:00Z", "2026-01-01T00:00:00Z", now), true);
  assert.equal(isAtRisk("2026-10-01T00:00:00Z", "2026-01-01T00:00:00Z", now), false);
  assert.equal(isAtRisk(null, "2026-10-05T00:00:00Z", now), false, "recién sumado");
  assert.equal(isAtRisk(null, "2026-08-01T00:00:00Z", now), true);
});

test("Excel de clientes", () => {
  const row: CustomerRow = {
    id: "c1",
    customerNo: 12,
    holderStatus: "PENDING",
    name: "Ana Pérez",
    phone: "70001234",
    email: null,
    balance: 3,
    lifetime: 13,
    visits: 9,
    lastVisitAt: "2026-10-08T02:00:00Z",
    tier: "Oro",
    status: "ACTIVE",
    rewardReady: false,
    atRisk: false,
    marketingConsent: true,
    createdAt: "2026-01-10T12:00:00Z",
  };
  const rows = customerSheetRows([row], { type: "STAMPS", timeZone: tz });
  assert.equal(rows.length, 2);
  assert.equal(rows[0][4], "Saldo (sellos)");
  assert.deepEqual(rows[1], [12, "Ana Pérez", "70001234", "", 3, 13, 9, "2026-10-07", "Oro", "2026-01-10", "Sí", "Activa"]);
});

test("textos de audiencia y premio", () => {
  assert.equal(describeAudience({ kind: "atRisk", days: 45 }), "Clientes que no vienen hace 45 días o más");
  assert.equal(describeAudience({ kind: "tier", tier: "Oro" }), "Nivel Oro");
  assert.equal(describeAudience({ kind: "all" }), "Todos los clientes");
  assert.equal(rewardLine("STAMPS", 10, "Café gratis"), "Juntá 10 sellos y llevate Café gratis.");
  assert.equal(rewardLine("POINTS", 10, ""), "Sumá puntos con cada compra y canjealos por un premio.");
});
// creado por pato dev y askforvini
