import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeAuthor, authorKey } from "../../integrations/pwn/author.ts";
import { parseDarknetArmyHtml } from "../../integrations/pwn/forum-scraper.ts";
import { mapCyberAttack, mapRansomwareVictim } from "../../integrations/pwn/ransom-intel.ts";

describe("normalizeAuthor", () => {
  it("drops anonymous handles and trims", () => {
    assert.equal(normalizeAuthor("  DarkSeller  "), "DarkSeller");
    assert.equal(normalizeAuthor("anonymous"), null);
    assert.equal(normalizeAuthor("@lockbit"), "lockbit");
  });

  it("builds a stable author key", () => {
    assert.equal(authorKey("LockBit"), authorKey("lockbit"));
  });
});

describe("parseDarknetArmyHtml", () => {
  it("reads the poster from data-author next to the thread link", () => {
    const html = `
      <div class="structItem structItem--thread" data-author="LogVendor">
        <div class="structItem-title">
          <a href="/threads/lumma-stealer-logs-employees.99/">Lumma stealer logs 8k employees of acme.local</a>
        </div>
        <time datetime="2026-09-30T12:00:00+00:00"></time>
      </div>
    `;
    const items = parseDarknetArmyHtml(html, "https://darknetarmy.st/", "Stealer logs");
    assert.equal(items.length, 1);
    assert.equal(items[0]?.author, "LogVendor");
    assert.equal(items[0]?.signalKind, "MIXED");
  });
});

describe("leak intel mappers", () => {
  it("maps a ransomware victim as corporate theft by group", () => {
    const item = mapRansomwareVictim({
      victim: "Hospital Santa Cruz",
      group: "lockbit",
      country: "BO",
      activity: "Healthcare",
      url: "https://www.ransomware.live/id/hospital",
      discovered: "2026-09-30T10:00:00+00:00",
    });
    assert.ok(item);
    assert.equal(item?.author, "lockbit");
    assert.equal(item?.signalKind, "CORPORATE");
    assert.match(item?.link ?? "", /^https:\/\/www\.ransomware\.live\//);
  });

  it("maps a Bolivian government victim with a public permalink", () => {
    const item = mapRansomwareVictim({
      victim: "seprec.gob.bo",
      group: "krybit",
      country: "BO",
      activity: "Government & Defense",
      url: "https://www.ransomware.live/id/seprec",
      attackdate: "2026-07-05T00:00:00+00:00",
    });
    assert.ok(item);
    assert.match(item?.title ?? "", /seprec\.gob\.bo/);
    assert.equal(item?.signalKind, "CORPORATE");
    assert.match(item?.category ?? "", /\bBO\b/);
    assert.ok((item?.priorityRank ?? 0) > 200);
  });

  it("maps a cyberattack as information theft, never an onion link", () => {
    const item = mapCyberAttack({
      victim: "Banco Ejemplo",
      attacker: "Scattered Spider",
      country: "AR",
      url: "https://www.ransomware.live/id/banco",
      claim_url: "http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/leak",
    });
    assert.ok(item);
    assert.equal(item?.author, "Scattered Spider");
    assert.doesNotMatch(item?.link ?? "", /\.onion/i);
  });
});
