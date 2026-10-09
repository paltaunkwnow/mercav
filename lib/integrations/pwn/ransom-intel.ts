import { classifyForumSignal, forumSignalPriorityRank } from "./forum-classifier";
import { titleKeyFromTitle } from "./forum-signal-utils";
import { normalizeAuthor } from "./author";
import type { ForumThreadSignal } from "./forum-scraper";
import { fetchAllowlistedText } from "./safe-fetch";

const SCRAPE_UA = "Mercav-Pwn/1.0 (+https://app.mercav.lat/pwn; defensive threat monitoring)";
const VICTIMS_URL = "https://api.ransomware.live/v2/recentvictims";
const ATTACKS_URL = "https://api.ransomware.live/v2/recentcyberattacks";
const SEARCH_BOLIVIA_URL = "https://api.ransomware.live/v2/searchvictims/bolivia";
const PUBLIC_HOSTS = ["www.ransomware.live", "ransomware.live"];
const LATAM = new Set([
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "GT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PE",
  "PY",
  "SV",
  "UY",
  "VE",
]);

type RawItem = Record<string, unknown>;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function publicIntelUrl(raw: RawItem): string | null {
  const candidates = [raw.url, raw.permalink, raw.page, raw.link, raw.website];
  for (const candidate of candidates) {
    const value = text(candidate);
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") continue;
      if (!PUBLIC_HOSTS.includes(parsed.hostname.toLowerCase())) continue;
      return parsed.toString();
    } catch {
      continue;
    }
  }
  const victim = text(raw.victim) ?? text(raw.post_title) ?? text(raw.target) ?? text(raw.organization);
  if (!victim) return null;
  return `https://www.ransomware.live/id/${encodeURIComponent(victim)}`;
}

function unwrapList(payload: unknown): RawItem[] {
  if (Array.isArray(payload)) return payload.filter((item): item is RawItem => Boolean(item) && typeof item === "object");
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  for (const key of ["victims", "cyberattacks", "attacks", "data", "items", "recentvictims", "recentcyberattacks"]) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((item): item is RawItem => Boolean(item) && typeof item === "object");
  }
  return [];
}

function isBoliviaRecord(raw: RawItem): boolean {
  const country = (text(raw.country) ?? "").toUpperCase();
  if (country === "BO") return true;
  const blob = `${text(raw.victim) ?? ""} ${text(raw.website) ?? ""} ${text(raw.post_title) ?? ""}`.toLowerCase();
  return /(?:\.gob\.bo|\.com\.bo|\.edu\.bo|\.net\.bo|\bbolivia\b)/.test(blob);
}

function latamBoost(country: string, rank: number): number {
  if (country === "BO") return rank + 80;
  return country && LATAM.has(country) ? rank + 40 : rank;
}

export function mapRansomwareVictim(raw: RawItem): ForumThreadSignal | null {
  const victim = text(raw.victim) ?? text(raw.post_title);
  const group = normalizeAuthor(text(raw.group) ?? text(raw.group_name));
  const link = publicIntelUrl(raw);
  if (!victim || !link) return null;
  const country = (text(raw.country) ?? "").toUpperCase();
  const activity = text(raw.activity) ?? text(raw.sector);
  const title = `${victim}: corporate data leak claimed by ${group ?? "unknown group"}`;
  const category = [activity, country, "Robo corporativo"].filter(Boolean).join(" · ");
  const signalKind = classifyForumSignal(title, category, "Ransomware.live");
  const priorityRank = latamBoost(country, forumSignalPriorityRank(title, signalKind, category, "Ransomware.live"));
  return {
    title: title.slice(0, 500),
    link,
    author: group,
    category: category.slice(0, 120),
    forum: "Ransomware.live",
    publishedAt: text(raw.discovered) ?? text(raw.attackdate) ?? text(raw.published),
    sourceName: "FEED_RANSOMWARELIVE",
    signalKind,
    priorityRank,
    titleKey: titleKeyFromTitle(title),
  };
}

export function mapCyberAttack(raw: RawItem): ForumThreadSignal | null {
  const victim = text(raw.victim) ?? text(raw.target) ?? text(raw.organization) ?? text(raw.post_title);
  const actor = normalizeAuthor(
    text(raw.group) ?? text(raw.group_name) ?? text(raw.attacker) ?? text(raw.threat_actor),
  );
  const link = publicIntelUrl(raw);
  if (!victim || !link) return null;
  const country = (text(raw.country) ?? "").toUpperCase();
  const activity = text(raw.activity) ?? text(raw.sector) ?? text(raw.attack);
  const title = `${victim}: information theft / cyberattack${actor ? ` by ${actor}` : ""}`;
  const category = [activity, country, "Ciberataque"].filter(Boolean).join(" · ");
  const signalKind = classifyForumSignal(title, category, "Ransomware.live");
  const priorityRank = latamBoost(country, forumSignalPriorityRank(title, signalKind, category, "Ransomware.live"));
  return {
    title: title.slice(0, 500),
    link,
    author: actor,
    category: category.slice(0, 120),
    forum: "Ransomware.live",
    publishedAt: text(raw.discovered) ?? text(raw.attackdate) ?? text(raw.date) ?? text(raw.published),
    sourceName: "FEED_RANSOMWARELIVE",
    signalKind,
    priorityRank,
    titleKey: titleKeyFromTitle(title),
  };
}

const API_HOSTS = ["api.ransomware.live"];

async function fetchJson(url: string): Promise<unknown> {
  // Sin seguir redirects fuera de api.ransomware.live y con parseo tolerante a JSON roto.
  const body = await fetchAllowlistedText(url, API_HOSTS, {
    timeoutMs: 12_000,
    headers: { "user-agent": SCRAPE_UA, accept: "application/json" },
  });
  if (!body) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

export async function scrapeRansomwareLive(): Promise<ForumThreadSignal[]> {
  try {
    // Sequential: this API rate-limits. Bolivia is searched first so local
    // claims are not dropped just because they fell out of the global recents.
    const searched = unwrapList(await fetchJson(SEARCH_BOLIVIA_URL).catch(() => null)).filter(isBoliviaRecord);
    const recent = unwrapList(await fetchJson(VICTIMS_URL).catch(() => null));
    const attacks = unwrapList(await fetchJson(ATTACKS_URL).catch(() => null));
    const seen = new Set<string>();
    const items: ForumThreadSignal[] = [];
    const mapped = [
      ...searched.map(mapRansomwareVictim),
      ...recent.slice(0, 120).map(mapRansomwareVictim),
      ...attacks.slice(0, 60).map(mapCyberAttack),
    ];
    for (const item of mapped) {
      if (!item) continue;
      const key = item.link.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}
