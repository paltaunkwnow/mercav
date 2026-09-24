import { createHash } from "node:crypto";
import type { ForumSignalKind } from "./forum-classifier";
import {
  classifyForumSignal,
  forumSignalPriorityRank,
  isGovernmentRelatedSignal,
} from "./forum-classifier";

export function normalizeTitleForDedupe(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function titleKeyFromTitle(title: string): string {
  const normalized = normalizeTitleForDedupe(title);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function deriveSignalFields(title: string, category?: string | null, forum?: string | null) {
  const signalKind = classifyForumSignal(title, category, forum);
  return {
    signalKind,
    priorityRank: forumSignalPriorityRank(title, signalKind, category, forum),
    titleKey: titleKeyFromTitle(title),
    isGovernment: isGovernmentRelatedSignal(title, category, forum),
  };
}

const DOMAIN_IN_TEXT =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:gov|gob|edu|mil|[a-z]{2,24})\b/gi;

export function extractDomainsFromText(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(DOMAIN_IN_TEXT)) {
    const raw = match[0]?.toLowerCase();
    if (!raw || raw.length < 4 || raw.includes("..")) continue;
    if (/^(?:example|localhost|mercav)\./.test(raw)) continue;
    found.add(raw);
  }
  return [...found];
}

export function domainMentionedInText(text: string, domain: string): boolean {
  const needle = domain.toLowerCase().trim();
  if (!needle) return false;
  const hay = text.toLowerCase();
  if (hay.includes(needle)) return true;
  const root = needle.split(".").slice(-2).join(".");
  if (root !== needle && hay.includes(root)) return true;
  return extractDomainsFromText(text).some((d) => d === needle || d.endsWith(`.${root}`) || root.endsWith(d));
}

/** Match HIBP-style breach names appearing in a public title (metadata only). */
export function matchBreachNameInTitle(title: string, breachNames: string[]): string | null {
  const hay = normalizeTitleForDedupe(title);
  if (!hay) return null;
  let best: { name: string; score: number } | null = null;
  for (const name of breachNames) {
    const norm = normalizeTitleForDedupe(name);
    if (norm.length < 4) continue;
    if (hay.includes(norm)) {
      const score = norm.length;
      if (!best || score > best.score) best = { name, score };
      continue;
    }
    const tokens = norm.split(" ").filter((t) => t.length > 3);
    if (tokens.length >= 2 && tokens.every((t) => hay.includes(t))) {
      const score = tokens.join(" ").length;
      if (!best || score > best.score) best = { name, score };
    }
  }
  return best?.name ?? null;
}

export function kindRank(kind: ForumSignalKind): number {
  if (kind === "DATABASE") return 3;
  if (kind === "MIXED") return 2;
  if (kind === "CREDENTIALS") return 1;
  return 0;
}
