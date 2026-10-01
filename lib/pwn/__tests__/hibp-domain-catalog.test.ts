import { test } from "node:test";
import assert from "node:assert/strict";
import { breachesForDomain, matchesBreachDomain } from "../hibp-domain";

test("catalog domain match ignores missing hosts and trailing dots", () => {
  assert.equal(matchesBreachDomain("adobe.com", "adobe.com"), true);
  assert.equal(matchesBreachDomain("adobe.com.", "ADOBE.COM"), true);
  assert.equal(matchesBreachDomain("www.adobe.com", "adobe.com"), true);
  assert.equal(matchesBreachDomain("adobe.com", "helpx.adobe.com"), true);
  assert.equal(matchesBreachDomain(null, "adobe.com"), false);
  assert.equal(matchesBreachDomain("google.com", "adobe.com"), false);
});

test("breachesForDomain keeps only matching catalog rows", () => {
  const rows = [
    { name: "Adobe", domain: "adobe.com" },
    { name: "Gmail", domain: "google.com" },
  ];
  assert.deepEqual(
    breachesForDomain(rows, "adobe.com").map((item) => item.name),
    ["Adobe"],
  );
});
// creado por pato dev y askforvini
