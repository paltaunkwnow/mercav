import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAlertBody } from "../alert-body";
import { buildAlert } from "../alert-engine";
import { nextStepsForDataTypes } from "../next-steps";

test("alert bodies keep their lines, list the recommendation and expose safe links", () => {
  const built = buildAlert({
    kind: "FORUM_SIGNAL",
    targetDisplay: "empresa.com",
    forumTitle: "Empresa leak",
    forumLink: "https://example.org/thread/1",
    forumSignalKey: "abc",
    sourceName: "RSS",
    verificationStatus: "UNVERIFIED",
  });
  const view = parseAlertBody(built.body);
  assert.ok(view.paragraphs.length >= 2);
  assert.ok(view.steps.length >= 3);
  assert.match(view.steps[0], /^Revisá/);
  assert.deepEqual(view.links, [{ href: "https://example.org/thread/1", label: "example.org" }]);
  assert.equal(view.paragraphs.some((line) => line.startsWith("Fuente:")), false);
});

test("non-http links in an alert are dropped", () => {
  const view = parseAlertBody("Hola\nEnlace externo: javascript:alert(1)");
  assert.deepEqual(view.links, []);
  assert.deepEqual(view.paragraphs, ["Hola"]);
});

test("next steps follow the exposed data types", () => {
  const ids = (types: string[]) => nextStepsForDataTypes(types).map((group) => group.id);
  assert.deepEqual(ids(["Passwords", "Phone numbers"]), ["passwords", "phone"]);
  assert.deepEqual(ids(["Credit cards"]), ["cards"]);
  assert.deepEqual(ids(["Email addresses", "IP addresses", "Usernames"]), ["email"]);
  assert.deepEqual(ids(["Contraseñas", "Teléfonos", "Direcciones físicas"]), ["passwords", "phone", "personal"]);
  assert.deepEqual(ids([]), []);
});
// creado por pato dev y askforvini
