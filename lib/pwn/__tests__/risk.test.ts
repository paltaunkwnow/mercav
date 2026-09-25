import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRisk } from "../risk-engine";

test("critical with full confidence is CRITICAL", () => {
  assert.deepEqual(scoreRisk({ severity: "CRITICAL", confidence: 100 }), { score: 90, level: "CRITICAL" });
});

test("low confidence dampens a critical claim", () => {
  const result = scoreRisk({ severity: "CRITICAL", confidence: 0 });
  assert.equal(result.score, 36);
  assert.equal(result.level, "LOW");
});

test("KEV raises risk", () => {
  const base = scoreRisk({ severity: "HIGH", confidence: 100 });
  const kev = scoreRisk({ severity: "HIGH", confidence: 100, kev: true });
  assert.equal(base.level, "HIGH");
  assert.equal(kev.level, "CRITICAL");
  assert.ok(kev.score > base.score);
});

test("password-range exposure raises risk over plain email", () => {
  const email = scoreRisk({ severity: "MEDIUM", confidence: 80, exposureKind: "EMAIL" });
  const password = scoreRisk({ severity: "MEDIUM", confidence: 80, exposureKind: "PASSWORD_RANGE" });
  assert.ok(password.score > email.score);
});

test("unknown severity and exposure kinds fall back safely", () => {
  assert.deepEqual(scoreRisk({ severity: "???", confidence: 100 }), scoreRisk({ severity: "MEDIUM", confidence: 100 }));
  assert.deepEqual(
    scoreRisk({ severity: "LOW", confidence: 50, exposureKind: "toString" }),
    scoreRisk({ severity: "LOW", confidence: 50 }),
  );
});

test("is deterministic and bounded 0-100", () => {
  const input = { severity: "HIGH", confidence: 64, kev: true, exposureKind: "ASSET" };
  assert.deepEqual(scoreRisk(input), scoreRisk(input));
  for (const confidence of [-10, 0, 50, 100, 1000, Number.NaN]) {
    const { score } = scoreRisk({ severity: "CRITICAL", confidence, kev: true, exposureKind: "PASSWORD_RANGE" });
    assert.ok(Number.isInteger(score) && score >= 0 && score <= 100);
  }
});

test("INFO severity stays INFO", () => {
  assert.equal(scoreRisk({ severity: "INFO", confidence: 100 }).level, "INFO");
});
// creado por Patodev y Invertilo
