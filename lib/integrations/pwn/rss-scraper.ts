import {
  classifyForumSignal,
  forumSignalPriorityRank,
  isForumSignalWorthy,
} from "./forum-classifier";
import { pwnRssFeedDefinitions } from "./feed-catalog";
import type { ForumThreadSignal } from "./forum-scraper";
import { normalizeAuthor } from "./author";
import { titleKeyFromTitle } from "./forum-signal-utils";

const SCRAPE_UA = "Mercav-Pwn/1.0 (+https://pwn.mercav.lat; defensive threat monitoring)";
const RSS_ITEMS_PER_FEED = 25;
const RSS_FETCH_CONCURRENCY = 8;

type RssFeed = ReturnType<typeof pwnRssFeedDefinitions>[number];

function assertAllowlistedUrl(raw: string, allowedHosts: string[]): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:") return null;
    if (!allowedHosts.includes(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssItems(xml: string): { title: string; link: string; pubDate: string | null; author: string | null }[] {
  const items: { title: string; link: string; pubDate: string | null; author: string | null }[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of blocks) {
    const titleMatch = block.match(/<title(?:[^>]*)>([\s\S]*?)<\/title>/i);
    const linkMatch =
      block.match(/<link(?:[^>]*)>([\s\S]*?)<\/link>/i) ??
      block.match(/<link[^>]+href="([^"]+)"/i);
    const dateMatch = block.match(/<(?:pubDate|published|updated)>([\s\S]*?)<\//i);
    const authorMatch =
      block.match(/<dc:creator(?:[^>]*)>([\s\S]*?)<\/dc:creator>/i) ??
      block.match(/<author>([\s\S]*?)<\/author>/i) ??
      block.match(/<name>([\s\S]*?)<\/name>/i);
    const title = decodeXml(titleMatch?.[1] ?? "");
    const link = decodeXml(typeof linkMatch?.[1] === "string" ? linkMatch[1] : "");
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: dateMatch?.[1]?.trim() ?? null,
      author: normalizeAuthor(authorMatch?.[1] ? decodeXml(authorMatch[1]) : null),
    });
  }
  return items;
}

async function fetchFeed(feed: RssFeed, maxItems: number): Promise<ForumThreadSignal[]> {
  try {
    const response = await fetch(feed.url, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": SCRAPE_UA, accept: "application/rss+xml, application/xml, text/xml, application/atom+xml" },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const out: ForumThreadSignal[] = [];
    for (const item of parseRssItems(xml)) {
      const link = assertAllowlistedUrl(item.link, feed.allowedLinkHosts);
      if (!link) continue;
      if (!isForumSignalWorthy(item.title, feed.forumLabel, feed.forumLabel)) continue;
      const signalKind = classifyForumSignal(item.title, feed.forumLabel, feed.forumLabel);
      out.push({
        title: item.title.slice(0, 500),
        link,
        author: item.author,
        category: "Noticias",
        forum: feed.forumLabel,
        publishedAt: item.pubDate,
        sourceName: feed.sourceName,
        signalKind,
        priorityRank: forumSignalPriorityRank(item.title, signalKind, feed.forumLabel, feed.forumLabel),
        titleKey: titleKeyFromTitle(item.title),
      });
      if (out.length >= maxItems) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function mapInPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

export const RSS_SOURCE_NAMES = pwnRssFeedDefinitions().map((f) => f.sourceName);

export async function scrapeRssFeeds(enabledSources: Set<string>): Promise<ForumThreadSignal[]> {
  const feeds = pwnRssFeedDefinitions().filter((feed) => enabledSources.has(feed.sourceName));
  const chunks = await mapInPool(feeds, RSS_FETCH_CONCURRENCY, (feed) => fetchFeed(feed, RSS_ITEMS_PER_FEED));
  return chunks.flat();
}
// creado por pato dev y askforvini
