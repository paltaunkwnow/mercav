import { test } from "node:test";
import assert from "node:assert/strict";
import { explainHibpBreach, translateDataClasses, extractBreachLinks } from "../breach-copy";

const MEDELA = `In September 2026, Swiss medical device company <a href="https://undercodenews.com/medela-targeted-by-shinyhunters-a-ransomware-warning-puts-swiss-healthcare-data-under-pressure-video/" target="_blank" rel="noopener">Medela was the target of a ShinyHunters "pay or leak" extortion campaign</a>. The data allegedly obtained in the breach was later published publicly and included 424k unique email addresses belonging predominantly to healthcare professionals, Medela staff and leads. The exposed data consisted primarily of corporate contact information, including names, physical addresses and phone numbers, with some records also containing associated support tickets.`;

test("Medela HIBP blurb becomes Spanish without HTML", () => {
  const copy = explainHibpBreach(MEDELA, {
    name: "Medela",
    recordCount: 423_947,
    dataTypes: [
      "Email addresses",
      "Employers",
      "Job titles",
      "Names",
      "Phone numbers",
      "Physical addresses",
      "Salutations",
      "Support tickets",
    ],
    publishedAt: "2026-09-30T07:48:00.000Z",
  });

  const blob = [copy.summary, copy.detail, copy.implication].filter(Boolean).join(" ");
  assert.ok(copy.summary);
  assert.doesNotMatch(blob, /<a\b/i);
  assert.doesNotMatch(blob, /href=/i);
  assert.doesNotMatch(blob, /target="_blank"/i);
  assert.doesNotMatch(blob, /was the target/i);
  assert.doesNotMatch(blob, /Email addresses/);
  assert.doesNotMatch(blob, /The exposed data/i);
  assert.doesNotMatch(blob, /\band\b/);
  assert.match(copy.summary ?? "", /septiembre de 2026/i);
  assert.match(copy.summary ?? "", /Medela/);
  assert.match(copy.summary ?? "", /ShinyHunters/);
  assert.match(copy.summary ?? "", /paga o filtramos|extorsión/);
  assert.match(blob, /424 mil|423\.947/);
  assert.match(copy.implication ?? "", /phishing|correo/i);
  assert.equal(copy.links.length, 1);
  assert.equal(
    copy.links[0]?.href,
    "https://undercodenews.com/medela-targeted-by-shinyhunters-a-ransomware-warning-puts-swiss-healthcare-data-under-pressure-video/",
  );
  assert.match(copy.links[0]?.label ?? "", /undercodenews\.com/);
});

test("extractBreachLinks ignores javascript and onion urls", () => {
  const links = extractBreachLinks(
    `<a href="javascript:alert(1)">x</a><a href="http://abc.onion/leak">y</a><a href="https://nvd.nist.gov/x">z</a>`,
  );
  assert.equal(links.length, 1);
  assert.equal(links[0]?.href, "https://nvd.nist.gov/x");
});

test("translateDataClasses maps HIBP chips to Spanish", () => {
  assert.deepEqual(translateDataClasses(["Email addresses", "Job titles", "Support tickets"]), [
    "Correos electrónicos",
    "Cargos",
    "Tickets de soporte",
  ]);
});

test("empty description still yields a Spanish lead from the name", () => {
  const copy = explainHibpBreach(null, { name: "Acme", recordCount: 1200, dataTypes: ["Passwords"] });
  assert.match(copy.summary ?? "", /Acme/);
  assert.doesNotMatch(copy.summary ?? "", /In /);
  assert.match(copy.detail ?? "", /1\.200|1200/);
  assert.match(copy.implication ?? "", /contraseña/i);
});

test("already Spanish copy is not treated as English HTML", () => {
  const copy = explainHibpBreach("En marzo de 2025 se conoció una filtración de datos de Ejemplo.", {
    name: "Ejemplo",
  });
  assert.equal(copy.summary, "En marzo de 2025 se conoció una filtración de datos de Ejemplo.");
  assert.equal(copy.detail, null);
});
// creado por pato dev y askforvini
