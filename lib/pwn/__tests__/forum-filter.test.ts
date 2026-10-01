import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyForumSignal,
  forumSignalPriorityRank,
  isBoliviaRelatedSignal,
  isForumSignalWorthy,
  isGovernmentRelatedSignal,
} from "../../integrations/pwn/forum-classifier.ts";
import { forumSignalKey, isLeakMonitoringText } from "../../integrations/pwn/forum-scraper.ts";
import { resolveEnabledFeedSources } from "../../integrations/pwn/feed-catalog.ts";

describe("classifyForumSignal", () => {
  it("tags database dumps separately from account leaks", () => {
    assert.equal(classifyForumSignal("14M customer MongoDB dump for sale"), "CORPORATE");
    assert.equal(classifyForumSignal("719 STEAM COOKIES fresh logs"), "CREDENTIALS");
    assert.equal(classifyForumSignal("Revolut customers after data breach phishing"), "CORPORATE");
    assert.equal(classifyForumSignal("CC Drop Part 16 full info"), "CREDENTIALS");
    assert.equal(classifyForumSignal("27X STEAM ACC FULL CAPTURE", "Cuentas y filtraciones"), "CREDENTIALS");
    assert.equal(classifyForumSignal("TAX RETURN MASTERY", "Filtraciones de bases de datos"), "OTHER");
    assert.equal(isGovernmentRelatedSignal("27X STEAM ACC", "Cuentas y filtraciones"), false);
    assert.equal(classifyForumSignal("SQL dump + 50k user:pass combo"), "MIXED");
  });

  it("tags stealer logs and corporate theft", () => {
    assert.equal(classifyForumSignal("Lumma logs 12k employees of acme.local"), "MIXED");
    assert.equal(classifyForumSignal("Fresh Redline stealer logs 2026-09"), "STEALER");
    assert.equal(classifyForumSignal("Employee database leak from Globex Corp"), "CORPORATE");
    assert.equal(classifyForumSignal("Ministry of Health SQL dump 4M records"), "DATABASE");
  });

  it("isForumSignalWorthy keeps database titles without login keywords", () => {
    assert.equal(isForumSignalWorthy("Hospital records database leak 2026"), true);
    assert.equal(isForumSignalWorthy("How to install VPN on Android"), false);
    assert.equal(isForumSignalWorthy("Medela", "Noticias", "Have I Been Pwned"), true);
    assert.equal(classifyForumSignal("Medela", "Noticias", "Have I Been Pwned"), "CORPORATE");
    assert.equal(isForumSignalWorthy("SOURCE CODE DATABASE ISRAEL"), true);
    assert.equal(isForumSignalWorthy("Acme Corp notifies customers after security incident"), true);
  });

  it("prioritizes government sector leaks", () => {
    assert.equal(isGovernmentRelatedSignal("Municipal government database exposed"), true);
    assert.ok(forumSignalPriorityRank("Municipal government database exposed", "DATABASE") >= 200);
  });

  it("flags Bolivian government domains even when HIBP never listed them", () => {
    assert.equal(isBoliviaRelatedSignal("seprec.gob.bo: corporate data leak claimed by krybit", "Government & Defense · BO · Robo corporativo"), true);
    assert.equal(isGovernmentRelatedSignal("seprec.gob.bo: corporate data leak claimed by krybit"), true);
    assert.ok(
      forumSignalPriorityRank(
        "seprec.gob.bo: corporate data leak claimed by krybit",
        "CORPORATE",
        "Government & Defense · BO · Robo corporativo",
      ) >
        forumSignalPriorityRank("Acme Corp: corporate data leak claimed by lockbit", "CORPORATE", "Retail · US · Robo corporativo"),
    );
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

describe("resolveEnabledFeedSources", () => {
  it("keeps catalog sources that were never inserted in the database", () => {
    const enabled = resolveEnabledFeedSources(
      ["FORUM_DARKNETARMY", "FEED_RANSOMWARELIVE", "RSS_HIBP_BREACHES"],
      [{ name: "FORUM_DARKNETARMY", enabled: true }],
    );
    assert.equal(enabled.has("FEED_RANSOMWARELIVE"), true);
    assert.equal(enabled.has("RSS_HIBP_BREACHES"), true);
    assert.equal(enabled.has("FORUM_DARKNETARMY"), true);
  });

  it("honors an explicit disable", () => {
    const enabled = resolveEnabledFeedSources(
      ["FORUM_DARKNETARMY", "FEED_RANSOMWARELIVE"],
      [{ name: "FEED_RANSOMWARELIVE", enabled: false }],
    );
    assert.equal(enabled.has("FEED_RANSOMWARELIVE"), false);
    assert.equal(enabled.has("FORUM_DARKNETARMY"), true);
  });
});
// creado por pato dev y askforvini
