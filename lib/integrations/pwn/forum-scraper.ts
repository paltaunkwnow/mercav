import { createHash } from "node:crypto";
import {
  classifyForumSignal,
  forumSignalPriorityRank,
  isForumSignalWorthy,
  type ForumSignalKind,
} from "./forum-classifier";
import { kindRank, titleKeyFromTitle } from "./forum-signal-utils";
import { PWN_FEED_SOURCE_NAMES } from "./feed-catalog";
import { scrapeRssFeeds } from "./rss-scraper";

export type ForumThreadSignal = {
  title: string;
  link: string;
  author: string | null;
  category: string | null;
  forum: string | null;
  publishedAt: string | null;
  sourceName: string;
  signalKind: ForumSignalKind;
  priorityRank: number;
  titleKey?: string;
};

const SCRAPE_UA = "Mercav-Pwn/1.0 (+https://pwn.mercav.lat; defensive threat monitoring)";

const BLOCKLIST_HOST =
  /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i;

const DATABASE_FORUM_SLUG =
  /(?:database|databases|\bdb\b|dump|dumps|sql|leak|leaks|data-breach|breach|combo|rar|archive|exfil|mongodb|postgres)/i;

export function forumSignalKey(link: string): string {
  return createHash("sha256").update(link.trim().toLowerCase(), "utf8").digest("hex");
}

function assertAllowlistedUrl(raw: string, allowedHosts: string[]): string {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new TypeError("URL inválida");
  }
  if (parsed.protocol !== "https:") throw new TypeError("Solo HTTPS");
  const host = parsed.hostname.toLowerCase();
  if (BLOCKLIST_HOST.test(host) || !allowedHosts.includes(host)) {
    throw new TypeError("Host no permitido");
  }
  return parsed.toString();
}

async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent": SCRAPE_UA,
        accept: "text/html,application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function enrichSignal(input: Omit<ForumThreadSignal, "signalKind" | "priorityRank" | "titleKey">): ForumThreadSignal | null {
  if (!isForumSignalWorthy(input.title, input.category, input.forum)) return null;
  const signalKind = classifyForumSignal(input.title, input.category, input.forum);
  return {
    ...input,
    signalKind,
    priorityRank: forumSignalPriorityRank(input.title, signalKind, input.category, input.forum),
    titleKey: titleKeyFromTitle(input.title),
  };
}

function parseDarknetArmyHtml(html: string, pageUrl: string, sectionLabel: string): ForumThreadSignal[] {
  const base = assertAllowlistedUrl(pageUrl, ["darknetarmy.st"]);
  const origin = new URL(base).origin;
  const items: ForumThreadSignal[] = [];
  const seen = new Set<string>();
  const linkRe = /href="(\/threads\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(linkRe)) {
    const path = match[1];
    const title = stripTags(match[2]);
    if (title.length < 4 || title.length > 400) continue;
    const link = assertAllowlistedUrl(`${origin}${path}`, ["darknetarmy.st"]);
    if (seen.has(link)) continue;
    seen.add(link);
    const candidate = enrichSignal({
      title,
      link,
      author: null,
      category: sectionLabel,
      forum: "DarkNetArmy",
      publishedAt: null,
      sourceName: "FORUM_DARKNETARMY",
    });
    if (candidate) items.push(candidate);
  }
  return items;
}

function discoverDarknetArmyForumPages(html: string): string[] {
  const origin = "https://darknetarmy.st";
  const found = new Set<string>();
  for (const match of html.matchAll(/href="(\/forums\/[^"#?]+\/)"/gi)) {
    const path = match[1];
    const slug = path.toLowerCase();
    if (!DATABASE_FORUM_SLUG.test(slug)) continue;
    found.add(`${origin}${path}`);
  }
  return [...found].slice(0, 6);
}

const DARKNETARMY_STATIC = [
  "https://darknetarmy.st/forums/paid-accounts-login-leaks-usernames-passwords-cookies.44/",
  "https://darknetarmy.st/",
];

function sectionLabelForUrl(url: string): string {
  const slug = url.toLowerCase();
  if (DATABASE_FORUM_SLUG.test(slug) && !slug.includes("login") && !slug.includes("account")) {
    return "Filtraciones de bases de datos";
  }
  if (slug.includes("login") || slug.includes("account") || slug.includes(".44")) {
    return "Cuentas y credenciales";
  }
  return "Amenaza underground";
}

export async function scrapeDarknetArmyThreads(): Promise<ForumThreadSignal[]> {
  const merged: ForumThreadSignal[] = [];
  const seen = new Set<string>();
  const indexHtml = await fetchText("https://darknetarmy.st/", { headers: { referer: "https://darknetarmy.st/" } });
  const pages = [...new Set([...DARKNETARMY_STATIC, ...(indexHtml ? discoverDarknetArmyForumPages(indexHtml) : [])])];

  for (const page of pages) {
    const html = page === "https://darknetarmy.st/" && indexHtml ? indexHtml : await fetchText(page, { headers: { referer: "https://darknetarmy.st/" } });
    if (!html) continue;
    const label = sectionLabelForUrl(page);
    for (const item of parseDarknetArmyHtml(html, page, label)) {
      const key = item.link.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  merged.sort((a, b) => b.priorityRank - a.priorityRank || kindRank(b.signalKind) - kindRank(a.signalKind));
  return merged.slice(0, 85);
}

type WpPost = {
  link?: string;
  date?: string;
  title?: { rendered?: string };
  _embedded?: { author?: { name?: string }[]; "wp:term"?: { taxonomy?: string; name?: string }[][] };
};

async function scrapeHackreadQuery(search: string, maxPages: number): Promise<ForumThreadSignal[]> {
  const items: ForumThreadSignal[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= maxPages; page += 1) {
    const url = assertAllowlistedUrl(
      `https://hackread.com/wp-json/wp/v2/posts?page=${page}&per_page=10&search=${encodeURIComponent(search)}&_embed=true`,
      ["hackread.com"],
    );
    const body = await fetchText(url);
    if (!body) continue;
    let posts: WpPost[];
    try {
      posts = JSON.parse(body) as WpPost[];
    } catch {
      continue;
    }
    if (!Array.isArray(posts) || posts.length === 0) break;
    for (const post of posts) {
      const title = stripTags(post.title?.rendered ?? "");
      const link = post.link ?? "";
      if (!title || !link) continue;
      try {
        assertAllowlistedUrl(link, ["hackread.com"]);
      } catch {
        continue;
      }
      if (seen.has(link)) continue;
      let category = "Ciberseguridad";
      for (const group of post._embedded?.["wp:term"] ?? []) {
        for (const term of group ?? []) {
          if (term.taxonomy === "category" && term.name) category = term.name;
        }
      }
      const candidate = enrichSignal({
        title,
        link,
        author: post._embedded?.author?.[0]?.name ?? null,
        category,
        forum: "Hackread",
        publishedAt: post.date ?? null,
        sourceName: "FORUM_HACKREAD",
      });
      if (!candidate) continue;
      seen.add(link);
      items.push(candidate);
    }
  }
  return items;
}

export async function scrapeHackreadNews(): Promise<ForumThreadSignal[]> {
  const queries = [
    "database leak",
    "data breach",
    "sql dump",
    "mongodb leak",
    "ransomware leak",
    "government data breach",
    "healthcare breach",
    "records exposed",
    "voter data",
    "employee data leak",
  ];
  const byLink = new Map<string, ForumThreadSignal>();
  for (const query of queries) {
    for (const item of await scrapeHackreadQuery(query, 3)) {
      byLink.set(item.link.toLowerCase(), item);
    }
  }
  for (const item of await scrapeHackreadQuery("", 3)) {
    if (!byLink.has(item.link.toLowerCase()) && item.signalKind !== "CREDENTIALS") {
      byLink.set(item.link.toLowerCase(), item);
    }
  }
  return [...byLink.values()].slice(0, 55);
}

export function forumScrapeEnabled(): boolean {
  return process.env.PWN_ENABLED === "true" && process.env.PWN_FORUM_SCRAPE !== "false";
}

export async function collectForumSignals(enabledSources?: Set<string>): Promise<ForumThreadSignal[]> {
  if (!forumScrapeEnabled()) return [];
  const enabled = enabledSources ?? new Set(PWN_FEED_SOURCE_NAMES);
  const tasks: Promise<ForumThreadSignal[]>[] = [];
  if (enabled.has("FORUM_DARKNETARMY")) tasks.push(scrapeDarknetArmyThreads());
  if (enabled.has("FORUM_HACKREAD")) tasks.push(scrapeHackreadNews());
  tasks.push(scrapeRssFeeds(enabled));
  const chunks = await Promise.all(tasks);
  const byLink = new Map<string, ForumThreadSignal>();
  const byTitle = new Map<string, ForumThreadSignal>();
  for (const item of chunks.flat()) {
    const linkKey = item.link.toLowerCase();
    const tKey = item.titleKey ?? titleKeyFromTitle(item.title);
    const titled = byTitle.get(tKey);
    if (titled && titled.priorityRank >= item.priorityRank) {
      continue;
    }
    if (titled && titled.priorityRank < item.priorityRank) {
      byLink.delete(titled.link.toLowerCase());
    }
    byTitle.set(tKey, item);

    const existing = byLink.get(linkKey);
    if (!existing) {
      byLink.set(linkKey, item);
      continue;
    }
    if (item.priorityRank > existing.priorityRank || kindRank(item.signalKind) > kindRank(existing.signalKind)) {
      byLink.set(linkKey, item);
    }
  }
  return [...byLink.values()].sort((a, b) => b.priorityRank - a.priorityRank);
}

/** @deprecated use isForumSignalWorthy */
export function isLeakMonitoringText(text: string): boolean {
  return isForumSignalWorthy(text, null, null);
}
