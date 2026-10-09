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
import { scrapeRansomwareLive } from "./ransom-intel";
import { normalizeAuthor } from "./author";
import { fetchAllowlistedText } from "./safe-fetch";

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

const SCRAPE_UA = "Mercav-Pwn/1.0 (+https://app.mercav.lat/pwn; defensive threat monitoring)";

const BLOCKLIST_HOST =
  /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i;

const DATABASE_FORUM_SLUG =
  /(?:database|databases|\bdb\b|dump|dumps|sql|leak|leaks|leaked|data-breach|breach|combo|rar|archive|exfil|mongodb|postgres|stealer|stealers|logs|ulp|cookies|credential|corporate|government|gobierno|company|combolist|source-?code|marketplace|cracked|hacked)/i;

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

// Hosts que este módulo scrapea directamente; los redirects fuera de esta lista se cortan.
const SCRAPE_HOSTS = ["darknetarmy.st", "hackread.com", "www.hackread.com"];

async function fetchText(url: string, init?: { headers?: Record<string, string> }): Promise<string | null> {
  return fetchAllowlistedText(url, SCRAPE_HOSTS, {
    timeoutMs: 20_000,
    headers: {
      "user-agent": SCRAPE_UA,
      accept: "text/html,application/json",
      ...(init?.headers ?? {}),
    },
  });
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

export function scrubPublicTitle(title: string): string {
  return title.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]");
}

function enrichSignal(input: Omit<ForumThreadSignal, "signalKind" | "priorityRank" | "titleKey">): ForumThreadSignal | null {
  const title = scrubPublicTitle(input.title);
  if (!isForumSignalWorthy(title, input.category, input.forum)) return null;
  const signalKind = classifyForumSignal(title, input.category, input.forum);
  return {
    ...input,
    title,
    author: normalizeAuthor(input.author),
    signalKind,
    priorityRank: forumSignalPriorityRank(title, signalKind, input.category, input.forum),
    titleKey: titleKeyFromTitle(title),
  };
}

function authorFromWindow(window: string): string | null {
  const dataAuthor = window.match(/data-author="([^"]+)"/i)?.[1];
  const username = window.match(/class="[^"]*username[^"]*"[^>]*>([^<]+)</i)?.[1];
  return normalizeAuthor(dataAuthor ?? username ?? null);
}

export function parseDarknetArmyHtml(html: string, pageUrl: string, sectionLabel: string): ForumThreadSignal[] {
  if (/just a moment|cf-challenge|attention required/i.test(html)) return [];
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
    const idx = match.index ?? 0;
    const nearby = html.slice(Math.max(0, idx - 1400), idx + match[0].length + 500);
    const publishedAt = nearby.match(/datetime="([^"]+)"/i)?.[1] ?? null;
    const candidate = enrichSignal({
      title,
      link,
      author: authorFromWindow(nearby),
      category: sectionLabel,
      forum: "DarkNetArmy",
      publishedAt,
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
  return [...found].slice(0, 24);
}

const DARKNETARMY_STATIC = [
  "https://darknetarmy.st/forums/paid-accounts-login-leaks-usernames-passwords-cookies.44/",
  "https://darknetarmy.st/",
];

function sectionLabelForUrl(url: string): string {
  const slug = url.toLowerCase();
  if (/(?:stealer|ulp|logs|cookies)/i.test(slug) && !/(?:database|sql|mongodb)/i.test(slug)) {
    return "Stealer logs";
  }
  if (/(?:government|gobierno|gov|municipal|minister)/i.test(slug)) {
    return "Robo corporativo";
  }
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
  return merged.slice(0, 140);
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
        author: normalizeAuthor(post._embedded?.author?.[0]?.name ?? null),
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
    "stealer logs",
    "lumma logs",
    "infostealer",
    "corporate data leak",
    "government data breach",
    "bolivia data breach",
    "bolivia ransomware",
    "employee database",
    "data breach",
    "data leak",
    "ransomware victim",
    "source code leak",
    "sql dump",
  ];
  const byLink = new Map<string, ForumThreadSignal>();
  for (const query of queries) {
    for (const item of await scrapeHackreadQuery(query, 1)) {
      byLink.set(item.link.toLowerCase(), item);
    }
  }
  return [...byLink.values()].slice(0, 90);
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
  if (enabled.has("FEED_RANSOMWARELIVE")) tasks.push(scrapeRansomwareLive());
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
// creado por pato dev y askforvini
