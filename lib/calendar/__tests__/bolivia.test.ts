import { test } from "node:test";
import assert from "node:assert/strict";
import { boliviaDepartmental, boliviaHolidays, boliviaNational, easterSunday } from "../bolivia";

const dayOffDates = (entries: { date: string; dayOff: boolean }[]) => entries.filter((e) => e.dayOff).map((e) => e.date);

test("Pascua para años conocidos", () => {
  assert.equal(easterSunday(2025), "2025-04-20");
  assert.equal(easterSunday(2026), "2026-04-05");
  assert.equal(easterSunday(2027), "2027-03-28");
});

test("2026 sigue el DS 5521", () => {
  const off = dayOffDates(boliviaNational(2026));
  // Estado Plurinacional pasa del jueves 22 al viernes 23.
  assert.ok(!off.includes("2026-01-22"));
  assert.ok(off.includes("2026-01-23"));
  assert.ok(off.includes("2026-02-16") && off.includes("2026-02-17"), "Carnaval");
  assert.ok(off.includes("2026-04-03"), "Viernes Santo");
  assert.ok(off.includes("2026-06-04") && off.includes("2026-06-05"), "Corpus + adicional");
  // Año Nuevo Andino cae domingo 21: se descansa el lunes 22.
  assert.ok(!off.includes("2026-06-21"));
  assert.ok(off.includes("2026-06-22"));
  assert.ok(off.includes("2026-08-06") && off.includes("2026-08-07"), "Independencia + adicional");
  assert.ok(off.includes("2026-11-02"), "Todos Santos (lunes)");
  assert.ok(off.includes("2026-12-25"));
});

test("el domingo trasladado queda como conmemoración sin descanso", () => {
  const andino = boliviaNational(2026).filter((e) => e.key === "BO:anio-nuevo-andino");
  assert.deepEqual(
    andino.map((e) => [e.date, e.dayOff]),
    [
      ["2026-06-21", false],
      ["2026-06-22", true],
    ],
  );
});

test("Carnaval, Viernes Santo y Corpus nunca se trasladan", () => {
  for (const year of [2024, 2025, 2026, 2027, 2028]) {
    const keys = boliviaNational(year).filter((e) => ["BO:carnaval", "BO:viernes-santo", "BO:corpus-christi"].includes(e.key) && !e.dayOff);
    assert.equal(keys.length, 0, `año ${year}`);
  }
});

test("Todos los Difuntos se traslada solo desde el DS 5483", () => {
  // 2 de noviembre de 2025 fue domingo y el DS 5483 es del 29 de octubre de 2025.
  assert.ok(dayOffDates(boliviaNational(2025)).includes("2025-11-03"));
  // 2 de noviembre de 2014 también fue domingo, pero regía la excepción.
  const y2014 = dayOffDates(boliviaNational(2014));
  assert.ok(y2014.includes("2014-11-02"));
  assert.ok(!y2014.includes("2014-11-03"));
});

test("departamentales: Santa Cruz y traslado desde el DS 5019", () => {
  assert.deepEqual(dayOffDates(boliviaDepartmental(2026, "SANTA_CRUZ")), ["2026-09-24"]);
  // 24 de septiembre de 2023 fue domingo, después del DS 5019 (13/09/2023).
  assert.deepEqual(dayOffDates(boliviaDepartmental(2023, "SANTA_CRUZ")), ["2023-09-25"]);
  // 16 de julio de 2023 fue domingo, antes del DS 5019: no se trasladaba.
  assert.deepEqual(dayOffDates(boliviaDepartmental(2023, "LA_PAZ")), ["2023-07-16"]);
});

test("boliviaHolidays devuelve solo días de descanso, ordenados", () => {
  const list = boliviaHolidays(2026, "SANTA_CRUZ");
  assert.ok(list.every((e) => e.dayOff));
  assert.ok(list.some((e) => e.date === "2026-09-24"));
  const dates = list.map((e) => e.date);
  assert.deepEqual(dates, [...dates].sort());
});
// creado por pato dev y askforvini
