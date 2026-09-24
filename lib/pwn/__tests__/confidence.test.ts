import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreConfidence } from "../confidence-engine";

test("unverified claims stay Low even from a highly reliable, loud source", () => {
  const result = scoreConfidence({ sourceReliability: 100, verificationStatus: "UNVERIFIED", corroboratingSources: 50 });
  assert.equal(result.label, "Low");
  assert.ok(result.score <= 30);
});

test("disputed claims are the lowest band", () => {
  const disputed = scoreConfidence({ sourceReliability: 100, verificationStatus: "DISPUTED", corroboratingSources: 10 });
  const unverified = scoreConfidence({ sourceReliability: 100, verificationStatus: "UNVERIFIED", corroboratingSources: 10 });
  assert.equal(disputed.label, "Low");
  assert.ok(disputed.score < unverified.score);
});

test("unknown status is treated as unverified, never confirmed", () => {
  const result = scoreConfidence({ sourceReliability: 100, verificationStatus: "TOTALLY_REAL", corroboratingSources: 5 });
  assert.deepEqual(result, scoreConfidence({ sourceReliability: 100, verificationStatus: "UNVERIFIED", corroboratingSources: 5 }));
});

test("confirmed with a reliable source is High", () => {
  const result = scoreConfidence({ sourceReliability: 90, verificationStatus: "CONFIRMED", corroboratingSources: 1 });
  assert.equal(result.label, "High");
  assert.ok(result.score >= 70 && result.score <= 100);
});

test("partially corroborated is capped in Medium", () => {
  const result = scoreConfidence({ sourceReliability: 100, verificationStatus: "PARTIALLY_CORROBORATED", corroboratingSources: 10 });
  assert.equal(result.label, "Medium");
  assert.ok(result.score <= 60);
});

test("verification ordering is monotonic for identical inputs", () => {
  const order = ["DISPUTED", "UNVERIFIED", "PARTIALLY_CORROBORATED", "CORROBORATED", "CONFIRMED"];
  const scores = order.map((status) =>
    scoreConfidence({ sourceReliability: 60, verificationStatus: status, corroboratingSources: 2 }).score,
  );
  for (let i = 1; i < scores.length; i++) assert.ok(scores[i] > scores[i - 1], `${order[i]} <= ${order[i - 1]}`);
});

test("is deterministic, bounded and tolerant of bad numbers", () => {
  const input = { sourceReliability: 73, verificationStatus: "CORROBORATED", corroboratingSources: 3 };
  assert.deepEqual(scoreConfidence(input), scoreConfidence(input));
  for (const reliability of [-50, 0, 500, Number.NaN, Number.POSITIVE_INFINITY]) {
    const { score } = scoreConfidence({ sourceReliability: reliability, verificationStatus: "CONFIRMED", corroboratingSources: -3 });
    assert.ok(Number.isInteger(score) && score >= 0 && score <= 100);
  }
});
