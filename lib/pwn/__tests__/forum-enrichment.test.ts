import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { forumSignalPriorityRank, isGovernmentRelatedSignal } from "../../integrations/pwn/forum-classifier.ts";
import {
  domainMentionedInText,
  matchBreachNameInTitle,
  normalizeTitleForDedupe,
  titleKeyFromTitle,
} from "../../integrations/pwn/forum-signal-utils.ts";

describe("government priority", () => {
  it("flags government-related breach headlines", () => {
    assert.equal(isGovernmentRelatedSignal("Ministry of Health database leak"), true);
    assert.equal(forumSignalPriorityRank("Federal voter records dump", "DATABASE"), 280);
  });
});

describe("title dedupe key", () => {
  it("is stable for equivalent titles", () => {
    const a = titleKeyFromTitle("SQL Dump — 10M Records");
    const b = titleKeyFromTitle("sql dump 10m records");
    assert.equal(a, b);
    assert.ok(normalizeTitleForDedupe("  Hello!!  ").includes("hello"));
  });
});

describe("hibp title correlation", () => {
  it("matches breach names embedded in titles", () => {
    assert.equal(matchBreachNameInTitle("New details on the Adobe breach leak", ["Adobe"]), "Adobe");
    assert.equal(matchBreachNameInTitle("Random forum chatter", ["Adobe"]), null);
  });
});

describe("domain mention", () => {
  it("detects monitored domain in a title", () => {
    assert.equal(domainMentionedInText("Leak for acme.gov employee data", "acme.gov"), true);
    assert.equal(domainMentionedInText("Leak for other.org", "acme.gov"), false);
  });
});
