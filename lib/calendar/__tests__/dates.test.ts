import { test } from "node:test";
import assert from "node:assert/strict";
import { boliviaDecrees, boliviaHolidays } from "../bolivia";
import { countryEntries } from "../countries";
import { groupConsecutive, longWeekends, parseDateParam, rangeLabel, relativeDay, relativeRange, upcomingFrom, workingDays } from "../dates";
import { hebrewMonthEs, spanishHebrewName } from "../hebrew-names";
import { buildIcs } from "../ics";
import { buildCalendar, upcomingGroups } from "../index";
import { jewishEntries } from "../jewish";
import { normalizePrefs } from "../sources";

test("Tishá BeAv postergado al domingo sale en español", () => {
  const tisha = jewishEntries(2029).find((e) => e.key === "JUDIO:tisha-bav");
  assert.equal(tisha?.date, "2029-07-22");
  assert.equal(tisha?.title, "Tishá BeAv (postergado)");
});

test("nombres hebreos compartidos con Kosher", () => {
  assert.equal(hebrewMonthEs("Nisan"), "Nisán");
  assert.equal(hebrewMonthEs("sivan"), "Siván");
  assert.equal(hebrewMonthEs("adar I"), "Adar I");
  assert.equal(spanishHebrewName("Lag BaOmer"), "Lag Baomer");
  assert.equal(spanishHebrewName("Rosh Chodesh Sivan"), "Rosh Jodesh Siván");
  assert.equal(spanishHebrewName("Chanukah: 8th Day"), "Janucá: 8.º día");
});

test("feriados de varios días: una entrada por día", () => {
  const turismo = countryEntries(2026, "UY").festive.filter((e) => e.key === "UY:semana-de-turismo");
  assert.deepEqual(
    turismo.map((e) => e.date),
    ["2026-03-30", "2026-03-31", "2026-04-01", "2026-04-02", "2026-04-03"],
  );
  assert.equal(new Set(turismo.map((e) => e.id)).size, turismo.length);
  const semanaSanta = countryEntries(2026, "VE").festive.filter((e) => e.key === "VE:semana-santa");
  assert.equal(semanaSanta.length, 7);
  const carnaval = countryEntries(2026, "BR").festive.filter((e) => e.key === "BR:carnaval").map((e) => e.date);
  assert.deepEqual(carnaval, ["2026-02-14", "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-18"]);
});

test("nombres en español sin cambiar la clave (las ocultas siguen andando)", () => {
  const tiradentes = countryEntries(2026, "BR").national.find((e) => e.date === "2026-04-21");
  assert.equal(tiradentes?.title, "Día de Tiradentes");
  assert.equal(tiradentes?.key, "BR:dia-de-tiradentes");
  const sabado = countryEntries(2026, "GT").national.find((e) => e.date === "2026-04-04");
  assert.equal(sabado?.title, "Sábado Santo");
});

test("ICS: UID estable sin fecha, SEQUENCE y LAST-MODIFIED", () => {
  const prefs = normalizePrefs({ country: "BO", sources: ["FERIADOS_NACIONALES", "JUDIO_FIESTAS"] });
  const stamp = new Date("2026-10-08T00:00:00Z");
  const ics = buildIcs(buildCalendar(2027, prefs), { name: "Mercav", stamp });
  const uids = ics.split("\r\n").filter((l) => l.startsWith("UID:"));
  assert.ok(uids.length > 0);
  assert.equal(new Set(uids).size, uids.length, "UID únicos");
  assert.ok(uids.every((u) => (u.match(/@/g) ?? []).length === 1 && !/\d{8}/.test(u)), "un solo @ y sin fecha");
  assert.ok(uids.includes("UID:JUDIO-pesach-2027-1@mercav.lat"));
  assert.ok(uids.includes("UID:JUDIO-pesach-2027-8@mercav.lat"));
  assert.ok(ics.includes("SEQUENCE:0\r\n"));
  assert.ok(ics.includes("LAST-MODIFIED:20261008T000000Z\r\n"));
  // Recortar por fechas no cambia el UID de un mismo día.
  const cut = buildIcs(buildCalendar(2027, prefs), { name: "Mercav", stamp, from: "2027-04-25" });
  assert.ok(cut.includes("UID:JUDIO-pesach-2027-8@mercav.lat"));
  assert.ok(!cut.includes("UID:JUDIO-pesach-2027-1@mercav.lat"));
});

test("ICS escapa comas, punto y coma y saltos", () => {
  const ics = buildIcs([{ id: "X:a@2026-01-01", key: "X:a", date: "2026-01-01", title: "Uno, dos; tres", source: "FECHAS_FESTIVAS", dayOff: false, note: "a\nb" }], {
    name: "Mercav",
    stamp: new Date("2026-01-01T00:00:00Z"),
  });
  assert.ok(ics.includes("SUMMARY:Uno\\, dos\\; tres\r\n"));
  assert.ok(ics.includes("DESCRIPTION:a\\nb\r\n"));
});

test("Pésaj y Janucá se juntan en una sola fecha con rango", () => {
  const groups = groupConsecutive(jewishEntries(2027).filter((e) => e.source === "JUDIO_FIESTAS"));
  const pesach = groups.filter((g) => g.key === "JUDIO:pesach");
  assert.equal(pesach.length, 1);
  assert.equal(pesach[0].title, "Pésaj");
  assert.equal(pesach[0].date, "2027-04-22");
  assert.equal(pesach[0].end, "2027-04-29");
  assert.equal(pesach[0].dayOff, true);
  // Rosh Jodesh Tevet cae en medio de Janucá: igual queda una sola Janucá.
  const chanukah = groupConsecutive(jewishEntries(2026).filter((e) => e.source === "JUDIO_MENORES" || e.source === "JUDIO_ROSH_JODESH")).filter(
    (g) => g.key === "JUDIO:chanukah",
  );
  assert.equal(chanukah.length, 1);
  assert.equal(chanukah[0].title, "Janucá");
  assert.equal(rangeLabel(chanukah[0].date, chanukah[0].end), "Del 4 al 12 de diciembre");
});

test("un feriado civil trasladado del domingo no se junta con su conmemoración", () => {
  const andino = groupConsecutive(buildCalendar(2026, normalizePrefs({ country: "BO", sources: ["FERIADOS_NACIONALES"] }))).filter(
    (g) => g.key === "BO:anio-nuevo-andino",
  );
  assert.equal(andino.length, 2);
  const carnaval = groupConsecutive(buildCalendar(2026, normalizePrefs({ country: "BO", sources: ["FERIADOS_NACIONALES"] }))).filter((g) => g.key === "BO:carnaval");
  assert.equal(carnaval.length, 1);
  assert.equal(carnaval[0].days, 2);
});

test("próximas fechas: una fecha en curso sigue apareciendo", () => {
  const prefs = normalizePrefs({ country: "BO", sources: ["JUDIO_FIESTAS"] });
  const next = upcomingGroups(prefs, "2027-04-25", 2);
  assert.equal(next[0].key, "JUDIO:pesach");
  assert.equal(next[0].date, "2027-04-22");
  assert.equal(relativeRange(next[0].date, next[0].end, "2027-04-25"), "En curso");
  assert.deepEqual(upcomingFrom([], "2027-01-01", 3), []);
});

test("fechas relativas con Intl en español", () => {
  assert.equal(relativeDay("2026-10-09", "2026-10-09"), "Hoy");
  assert.equal(relativeDay("2026-10-10", "2026-10-09"), "Mañana");
  assert.equal(relativeDay("2026-10-12", "2026-10-09"), "Dentro de 3 días");
  assert.equal(relativeDay("2026-11-06", "2026-10-09"), "Dentro de 4 semanas");
  assert.equal(relativeDay("2027-02-09", "2026-10-09"), "Dentro de 4 meses");
});

test("días hábiles y fines de semana largos", () => {
  const off2026 = new Set(boliviaHolidays(2026).map((e) => e.date));
  // Febrero de 2026: 20 días de lunes a viernes menos Carnaval (lunes 16 y martes 17).
  assert.equal(workingDays(2026, 1, off2026), 18);
  assert.deepEqual(longWeekends(2026, 1, off2026), [{ kind: "largo", start: "2026-02-14", end: "2026-02-17" }]);
  // Corpus Christi 2027 cae jueves 27 de mayo y no hay feriado extra: puente posible el viernes.
  const off2027 = new Set(boliviaHolidays(2027).map((e) => e.date));
  assert.deepEqual(longWeekends(2027, 4, off2027), [{ kind: "puente", holiday: "2027-05-27", bridge: "2027-05-28" }]);
});

test("links con fecha: solo fechas reales y dentro de los años navegables", () => {
  assert.equal(parseDateParam("2026-12-04", "2026-10-09"), "2026-12-04");
  assert.equal(parseDateParam("2026-02-30", "2026-10-09"), null);
  assert.equal(parseDateParam("2040-01-01", "2026-10-09"), null);
  assert.equal(parseDateParam("hoy", "2026-10-09"), null);
  assert.equal(parseDateParam(undefined, "2026-10-09"), null);
});

test("decretos de Bolivia por año para la nota al pie", () => {
  assert.deepEqual(boliviaDecrees(2026), ["DS 5506", "DS 5521"]);
  assert.deepEqual(boliviaDecrees(2027), []);
});
// creado por pato dev y askforvini
