import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyForumSignal,
  forumSignalPriorityRank,
  isForumSignalWorthy,
  isGovernmentRelatedSignal,
} from "../../integrations/pwn/forum-classifier.ts";
import { forumSignalKey, isLeakMonitoringText } from "../../integrations/pwn/forum-scraper.ts";

describe("classifyForumSignal", () => {
  it("tags database dumps separately from account leaks", () => {
    assert.equal(classifyForumSignal("14M customer MongoDB dump for sale"), "DATABASE");
    assert.equal(classifyForumSignal("719 STEAM COOKIES fresh logs"), "CREDENTIALS");
    assert.equal(classifyForumSignal("Revolut customers after data breach phishing"), "DATABASE");
    assert.equal(classifyForumSignal("CC Drop Part 16 full info"), "CREDENTIALS");
    assert.equal(classifyForumSignal("27X STEAM ACC FULL CAPTURE", "Cuentas y filtraciones"), "CREDENTIALS");
    assert.equal(classifyForumSignal("TAX RETURN MASTERY", "Filtraciones de bases de datos"), "OTHER");
    assert.equal(isGovernmentRelatedSignal("27X STEAM ACC", "Cuentas y filtraciones"), false);
    assert.equal(classifyForumSignal("SQL dump + 50k user:pass combo"), "MIXED");
  });

  it("isForumSignalWorthy keeps database titles without login keywords", () => {
    assert.equal(isForumSignalWorthy("Hospital records database leak 2026"), true);
    assert.equal(isForumSignalWorthy("How to install VPN on Android"), false);
  });

  it("prioritizes government sector leaks", () => {
    assert.equal(isGovernmentRelatedSignal("Municipal government database exposed"), true);
    assert.ok(forumSignalPriorityRank("Municipal government database exposed", "DATABASE") >= 200);
  });
});

describe("forumSignalKey", () => {
  it("is stable for the same URL", () => {
    const a = forumSignalKey("https://example.com/threads/abc");
    const b = forumSignalKey("https://example.com/threads/abc");
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });
});

describe("isLeakMonitoringText shim", () => {
  it("delegates to isForumSignalWorthy", () => {
    assert.equal(isLeakMonitoringText("New database leak with 10k records"), true);
    assert.equal(isLeakMonitoringText("Weekly announcement from staff"), false);
  });
});
// creado por Patodev y Invertilo
