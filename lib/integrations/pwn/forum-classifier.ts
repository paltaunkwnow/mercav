export type ForumSignalKind = "DATABASE" | "CREDENTIALS" | "MIXED" | "OTHER";

/** Scraper section labels — must not influence kind/gov (they contain words like "filtraciones"). */
const GENERIC_SECTION =
  /^(?:filtraciones de bases de datos|cuentas y credenciales|cuentas y filtraciones|amenaza underground|noticias|ciberseguridad)$/i;

import { isGenericForumLabel } from "./feed-catalog";

const DATABASE_HINT =
  /(?:database|\bdb\b|\bsql\b|mongodb|postgres(?:ql)?|mysql|mariadb|elastic(?:search)?|redis|oracle|mssql|sqlite|\.sql\b|dump|dataset|records?\s+leak|million\s+records|\b\d+[\.,]?\d*\s*(?:m|k|million|mil)\s+records|customer\s+data|employee\s+data|pii|breach\s+archive|ransomware\s+leak|exfil|table\s+leak|collection\s+leak|filtraci[oó]n\s+de\s+datos|base\s+de\s+datos)/i;

const BREACH_NEWS_HINT =
  /(?:data\s+breach|security\s+breach|\bbreach\b|\bleak\b|leaked|exfiltrat|compromised|stolen\s+data|ransomware|phishing\s+campaign)/i;

const CREDENTIAL_HINT =
  /(?:login|logins|account|accounts|\baccs\b|\bacc\b|cookie|cookies|smtp|webmail|combo\s?list|combolist|user:pass|url:pass|url:log:pass|log:pass|\blog:pass\b|\bulp\b|stealer|redline|lumma|vidar|premium|fullz|full\s+info|\bcc\b|\bcards?\b|\bdrop\b|hits\b|hashes?|passwords?|credentials?|valid\s+mail|mail\s+access)/i;

const ACCOUNT_ONLY_NOISE =
  /^(?:x\d+\s+)?(?:steam|chatgpt|netflix|spotify|office365|smtp|curiosity|premium|minecraft|valorant|epicgames|psn|hotmail|plex|camwhores|fiven|rockstar|onlyfans|apple)\b/i;

const UNDERGROUND_CREDENTIAL_NOISE =
  /(?:\burl:log:pass\b|\blog:pass\b|\bsteamer\b|\bcombo\b|\baccs?\b|\bx\d+\+|\bpremium mix\b|\bvalid accounts\b|\bcookies\b|\btax return mastery\b|\bblueprint\b)/i;

/** Strong public-sector cues in headlines (not acronyms that appear inside random words). */
const GOVERNMENT_HINT =
  /(?:\bgovernment\b|\bgov\b|\bgovt\b|gobierno|gubernamental|ministerio|ministry|municipal(?:ity)?|municipio|prefecture|parliament|congress|senate|\.gov\b|public\s+sector|sector\s+p[uú]blico|administraci[oó]n\s+p[uú]blica|tax\s+authority|internal\s+revenue|\birs\b|\brevenue\s+service|electoral\s+commission|voter\s+(?:data|records)|citizen\s+data|embassy|consulate|police\s+department|law\s+enforcement|defense\s+ministry|defence\s+ministry|health\s+ministry|education\s+ministry|(?:\b(?:us|u\.s\.|uk|state)\s+)?federal(?:\s+(?:agency|department|government))?|\bej[eé]rcito\b|(?:\b(?:us|u\.s\.|uk|state)\s+)?army\b|(?:\b(?:us|u\.s\.|uk|royal)\s+)?navy\b|air\s+force|\bnato\b|public\s+hospital|\bimss\b|\bissste\b|\bine\b|\bnhs\b|\bdoj\b|\bdhs\b|\bfbi\b|\bnsa\b|\bssa\b|\bcms\b|\bhhs\b|uk\s+gov|eu\s+commission)/i;

function signalText(title: string, category?: string | null, forum?: string | null): string {
  const cat = category?.trim() ?? "";
  const useCategory = cat && !GENERIC_SECTION.test(cat) ? cat : "";
  const forumName = forum?.trim() ?? "";
  const useForum = forumName && !isGenericForumLabel(forumName) ? forumName : "";
  return `${title} ${useCategory} ${useForum}`.trim();
}

function classifyFromTitle(title: string): ForumSignalKind {
  const text = title.trim();
  const db = DATABASE_HINT.test(text);
  const cred = CREDENTIAL_HINT.test(text);
  const breachNews = BREACH_NEWS_HINT.test(text);
  if (db && cred) return "MIXED";
  if (db) return "DATABASE";
  if (cred) return "CREDENTIALS";
  if (breachNews) return "DATABASE";
  if (ACCOUNT_ONLY_NOISE.test(text) && !db) return "CREDENTIALS";
  return "OTHER";
}

/** Classifies from headline first; optional non-generic category/forum context only if title is ambiguous. */
export function classifyForumSignal(title: string, category?: string | null, forum?: string | null): ForumSignalKind {
  const fromTitle = classifyFromTitle(title);
  if (fromTitle !== "OTHER") return fromTitle;
  const text = signalText(title, category, forum);
  const db = DATABASE_HINT.test(text);
  const cred = CREDENTIAL_HINT.test(text);
  const breachNews = BREACH_NEWS_HINT.test(text);
  if (db && cred) return "MIXED";
  if (db) return "DATABASE";
  if (cred) return "CREDENTIALS";
  if (breachNews) return "DATABASE";
  return "OTHER";
}

export function isGovernmentRelatedSignal(title: string, category?: string | null, forum?: string | null): boolean {
  const headline = title.trim();
  if (!headline) return false;
  if (UNDERGROUND_CREDENTIAL_NOISE.test(headline)) return false;
  const kind = classifyFromTitle(headline);
  if (kind === "CREDENTIALS" && !GOVERNMENT_HINT.test(headline)) return false;
  const text = signalText(title, category, forum);
  if (!GOVERNMENT_HINT.test(text)) return false;
  if (kind === "CREDENTIALS" && !/(?:government|gobierno|ministerio|municipal|federal|\.gov|voter|citizen\s+data|imss|issste|irs|nhs)/i.test(text)) {
    return false;
  }
  return true;
}

/** Higher rank surfaces first in lists (government + database on top). */
export function forumSignalPriorityRank(
  title: string,
  kind: ForumSignalKind,
  category?: string | null,
  forum?: string | null,
): number {
  let rank = 0;
  if (kind === "DATABASE") rank += 80;
  else if (kind === "MIXED") rank += 60;
  else if (kind === "CREDENTIALS") rank += 20;
  else rank += 10;
  if (isGovernmentRelatedSignal(title, category, forum)) rank += 200;
  return rank;
}

/** Keeps defensive monitoring titles; database leaks pass even without credential keywords. */
export function isForumSignalWorthy(title: string, category?: string | null, forum?: string | null): boolean {
  const kind = classifyForumSignal(title, category, forum);
  if (kind !== "OTHER") return true;
  const text = signalText(title, category, forum).toLowerCase();
  if (/(?:breach|leak|filtrac|exposed|ransom)/i.test(text)) return true;
  if (isGovernmentRelatedSignal(title, category, forum)) return true;
  return false;
}
