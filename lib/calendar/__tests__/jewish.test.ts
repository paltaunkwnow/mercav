import { test } from "node:test";
import assert from "node:assert/strict";
import { jewishEntries } from "../jewish";
import { buildCalendar, upcomingEntries } from "../index";
import { normalizePrefs } from "../sources";
import { buildIcs, foldLine } from "../ics";

test("fiestas de Tishrei 5787 en la diáspora", () => {
  const y = jewishEntries(2026);
  const on = (date: string, title: RegExp) => y.some((e) => e.date === date && title.test(e.title));
  assert.ok(on("2026-09-12", /^Rosh Hashaná 5787$/));
  assert.ok(on("2026-09-13", /Rosh Hashaná \(2\.º día\)/));
  assert.ok(on("2026-09-21", /^Iom Kipur$/));
  assert.ok(on("2026-09-27", /Sucot \(2\.º día\)/));
  assert.ok(on("2026-10-04", /Simjat Torá/));
  const yk = y.find((e) => e.date === "2026-09-21")!;
  assert.equal(yk.dayOff, true);
  assert.match(yk.note ?? "", /víspera al atardecer/);
  assert.match(yk.hebrewDate ?? "", /^10 de Tishrei de 5787$/);
});

test("las vísperas no son fechas propias, la 1.ª vela de Janucá sí", () => {
  const y = jewishEntries(2026);
  assert.ok(!y.some((e) => e.date === "2026-09-11"));
  const first = y.find((e) => e.date === "2026-12-04");
  assert.equal(first?.title, "Janucá: 1.ª vela");
  assert.equal(first?.source, "JUDIO_MENORES");
});

test("Pésaj 5787: 8 días en la diáspora, 7 en Israel", () => {
  const diaspora = jewishEntries(2027).filter((e) => e.key === "JUDIO:pesach");
  const israel = jewishEntries(2027, { israel: true }).filter((e) => e.key === "JUDIO:pesach");
  assert.equal(diaspora[0].date, "2027-04-22");
  assert.equal(diaspora.at(-1)!.date, "2027-04-29");
  assert.equal(israel.at(-1)!.date, "2027-04-28");
});

test("ayunos y Rosh Jodesh van en su fuente", () => {
  const y = jewishEntries(2026);
  assert.equal(y.find((e) => e.title === "Ayuno de Guedalia")?.source, "JUDIO_AYUNOS");
  assert.ok(y.some((e) => e.source === "JUDIO_ROSH_JODESH" && e.title === "Rosh Jodesh Jeshván"));
  assert.ok(!y.some((e) => e.title === "Sigd"), "fechas modernas fuera de la lista no aparecen");
});

test("buildCalendar respeta fuentes, departamento y ocultas", () => {
  const prefs = normalizePrefs({ country: "BO", sources: ["FERIADOS_NACIONALES", "FERIADOS_REGIONALES", "JUDIO_AYUNOS"], region: "SANTA_CRUZ", hidden: ["BO:navidad"] });
  const list = buildCalendar(2026, prefs);
  assert.ok(list.some((e) => e.key === "BO:dep-santa-cruz"));
  assert.ok(!list.some((e) => e.key === "BO:navidad"));
  assert.ok(!list.some((e) => e.source === "JUDIO_FIESTAS"));
  assert.ok(list.some((e) => e.source === "JUDIO_AYUNOS"));
  const withHidden = buildCalendar(2026, prefs, { includeHidden: true });
  assert.equal(withHidden.find((e) => e.key === "BO:navidad")?.hidden, true);
});

test("normalizePrefs descarta lo desconocido y usa el país de la cuenta", () => {
  const p = normalizePrefs({ country: "XX", sources: ["FERIADOS_NACIONALES", "X", "FERIADOS_NACIONALES"], region: "no válida!", israel: "si", hidden: [1, "a"] }, "ar");
  assert.deepEqual(p, { country: "AR", region: null, sources: ["FERIADOS_NACIONALES"], israel: false, hidden: ["a"] });
  assert.equal(normalizePrefs(null, "MX").country, "MX");
  assert.equal(normalizePrefs(null, "US").country, "BO");
});

test("otros países de Latinoamérica: Argentina, Brasil con estado y México", () => {
  const ar = buildCalendar(2026, normalizePrefs({ country: "AR", sources: ["FERIADOS_NACIONALES", "FECHAS_FESTIVAS"] }));
  const independencia = ar.find((e) => e.date === "2026-07-09");
  assert.equal(independencia?.dayOff, true);
  assert.match(independencia?.key ?? "", /^AR:/);
  const optional = ar.find((e) => e.date === "2026-03-23");
  assert.equal(optional?.dayOff, false);
  assert.equal(optional?.source, "FECHAS_FESTIVAS");
  const sp = buildCalendar(2026, normalizePrefs({ country: "BR", region: "SP", sources: ["FERIADOS_REGIONALES"] }));
  assert.ok(sp.some((e) => e.date === "2026-07-09" && e.source === "FERIADOS_REGIONALES"), "Revolución Constitucionalista en São Paulo");
  const mx = buildCalendar(2026, normalizePrefs({ country: "MX", sources: ["FERIADOS_NACIONALES"] }));
  assert.ok(mx.some((e) => e.date === "2026-09-16" && e.dayOff), "Independencia de México");
});

test("upcomingEntries cruza el fin de año", () => {
  const next = upcomingEntries(normalizePrefs({ country: "BO", sources: ["FERIADOS_NACIONALES"] }), "2026-12-26", 2);
  assert.equal(next[0].date, "2027-01-01");
});

test("ICS válido: CRLF, día completo y líneas plegadas", () => {
  const ics = buildIcs(buildCalendar(2026, normalizePrefs({ country: "BO", sources: ["FERIADOS_NACIONALES"] })), { name: "Mercav — Feriados", stamp: new Date("2026-10-08T00:00:00Z") });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20260806\r\n"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20260807\r\n"));
  assert.ok(ics.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));
  const folded = foldLine("DESCRIPTION:" + "á".repeat(80));
  assert.ok(folded.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75));
});
// creado por pato dev y askforvini
