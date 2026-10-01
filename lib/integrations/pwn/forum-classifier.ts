export type ForumSignalKind = "DATABASE" | "STEALER" | "CORPORATE" | "CREDENTIALS" | "MIXED" | "OTHER";

/** Scraper section labels — must not influence kind/gov (they contain words like "filtraciones"). */
const GENERIC_SECTION =
  /^(?:filtraciones de bases de datos|cuentas y credenciales|cuentas y filtraciones|amenaza underground|noticias|ciberseguridad|stealer logs|robo corporativo|ciberataque|ransomware leak site)$/i;

import { isGenericForumLabel } from "./feed-catalog";

const DATABASE_HINT =
  /(?:database|\bdb\b|\bsql\b|mongodb|postgres(?:ql)?|mysql|mariadb|elastic(?:search)?|redis|oracle|mssql|sqlite|\.sql\b|dump|dataset|records?\s+leak|million\s+records|\b\d+[\.,]?\d*\s*(?:m|k|million|mil)\s+records|table\s+leak|collection\s+leak|filtraci[oó]n\s+de\s+datos|base\s+de\s+datos)/i;

const STEALER_HINT =
  /(?:\binfostealer\b|\bstealer(?:logs?)?\b|stealer\s*logs?|redline|lumma(?:stealer)?|vidar|raccoon(?:stealer)?|stealc|aurora\s*stealer|acre(?:ed)?(?:stealer)?|risepro|cryptbot|meduza|rhadamanthys|white\s*snake|blank\s*grabber|meta\s*stealer|\bulp\b|url:log:pass|log:pass)/i;

const CORPORATE_HINT =
  /(?:employee\s+(?:data|database|records|dump)|employees?\s+(?:of|at|from)|customer(?:s)?(?:\s+\S+){0,4}\s+(?:dump|database|records|data|breach)|corporate\s+(?:data|breach|leak|theft)|company\s+(?:data|breach|leak)|internal\s+(?:data|documents|files)|payroll|n[oó]mina|empleados|datos\s+de\s+(?:clientes|empleados)|crm\s+(?:dump|leak)|erp\s+(?:dump|leak)|information\s+theft|data\s+theft|stolen\s+from|robo\s+de\s+(?:datos|informaci)|claimed\s+(?:by|leak)|ransomware\s+leak|ransomware\s+victim)/i;

const BREACH_NEWS_HINT =
  /(?:data\s+breach|security\s+breach|\bbreach\b|\bleak\b|leaked|exfiltrat|compromised|stolen\s+data|phishing\s+campaign|hacked|ransomware|cyber[\s-]?attack|ciberataque|incidente\s+de\s+seguridad|datos\s+(?:expuestos|robados)|source\s*code\s+(?:leak|dump)|new\s+victim)/i;

const CREDENTIAL_HINT =
  /(?:login|logins|account|accounts|\baccs\b|\bacc\b|cookie|cookies|smtp|webmail|combo\s?list|combolist|user:pass|url:pass|premium|fullz|full\s+info|\bcc\b|\bcards?\b|\bdrop\b|hits\b|hashes?|passwords?|credentials?|valid\s+mail|mail\s+access)/i;

const ACCOUNT_ONLY_NOISE =
  /^(?:x\d+\s+)?(?:steam|chatgpt|netflix|spotify|office365|smtp|curiosity|premium|minecraft|valorant|epicgames|psn|hotmail|plex|camwhores|fiven|rockstar|onlyfans|apple)\b/i;

const UNDERGROUND_CREDENTIAL_NOISE =
  /(?:\burl:log:pass\b|\blog:pass\b|\bsteamer\b|\bcombo\b|\baccs?\b|\bx\d+\+|\bpremium mix\b|\bvalid accounts\b|\bcookies\b|\btax return mastery\b|\bblueprint\b)/i;

/** Strong public-sector cues in headlines (not acronyms that appear inside random words). */
const GOVERNMENT_HINT =
  /(?:\bgovernment\b|\bgov\b|\bgovt\b|gobierno|gubernamental|ministerio|ministry|municipal(?:ity)?|municipio|prefecture|parliament|congress|senate|\.gov\b|\.gob\.bo\b|public\s+sector|sector\s+p[uú]blico|administraci[oó]n\s+p[uú]blica|tax\s+authority|internal\s+revenue|\birs\b|\brevenue\s+service|electoral\s+commission|voter\s+(?:data|records)|citizen\s+data|embassy|consulate|police\s+department|law\s+enforcement|defense\s+ministry|defence\s+ministry|health\s+ministry|education\s+ministry|(?:\b(?:us|u\.s\.|uk|state)\s+)?federal(?:\s+(?:agency|department|government))?|\bej[eé]rcito\b|(?:\b(?:us|u\.s\.|uk|state)\s+)?army\b|(?:\b(?:us|u\.s\.|uk|royal)\s+)?navy\b|air\s+force|\bnato\b|public\s+hospital|\bimss\b|\bissste\b|\bine\b|\bnhs\b|\bdoj\b|\bdhs\b|\bfbi\b|\bnsa\b|\bssa\b|\bcms\b|\bhhs\b|uk\s+gov|eu\s+commission)/i;

/** Local / regional cues so Bolivia is not drowned by US-centric HIBP and leak-site recents. */
const BOLIVIA_HINT =
  /(?:\bbolivia\b|\.gob\.bo\b|\.com\.bo\b|\.edu\.bo\b|\.net\.bo\b|\bseprec\b|\baisem\b|\bagetic\b|\bsegip\b|\bypfb\b|\bnuevatel\b|santa cruz de la sierra|la paz,\s*bolivia)/i;

const ALWAYS_WORTHY_FORUM =
  /^(?:have i been pwned|ransomware\.live)$/i;

function signalText(title: string, category?: string | null, forum?: string | null): string {
  const cat = category?.trim() ?? "";
  const useCategory = cat && !GENERIC_SECTION.test(cat) ? cat : "";
  const forumName = forum?.trim() ?? "";
  const useForum = forumName && !isGenericForumLabel(forumName) ? forumName : "";
  return `${title} ${useCategory} ${useForum}`.trim();
}

function classifyFromTitle(title: string): ForumSignalKind {
  const text = title.trim();
  const stealer = STEALER_HINT.test(text);
  const db = DATABASE_HINT.test(text);
  const corporate = CORPORATE_HINT.test(text);
  const cred = CREDENTIAL_HINT.test(text);
  const breachNews = BREACH_NEWS_HINT.test(text);
  if (stealer && (db || corporate)) return "MIXED";
  if (stealer) return "STEALER";
  if ((db || corporate) && cred) return "MIXED";
  if (corporate) return "CORPORATE";
  if (db) return "DATABASE";
  if (cred) return "CREDENTIALS";
  if (breachNews) return "CORPORATE";
  if (ACCOUNT_ONLY_NOISE.test(text) && !db) return "CREDENTIALS";
  return "OTHER";
}

/** Classifies from headline first; optional non-generic category/forum context only if title is ambiguous. */
export function classifyForumSignal(title: string, category?: string | null, forum?: string | null): ForumSignalKind {
  const fromTitle = classifyFromTitle(title);
  if (fromTitle !== "OTHER") return fromTitle;
  if (ALWAYS_WORTHY_FORUM.test((forum ?? "").trim())) return "CORPORATE";
  const text = signalText(title, category, forum);
  const stealer = STEALER_HINT.test(text);
  const db = DATABASE_HINT.test(text);
  const corporate = CORPORATE_HINT.test(text);
  const cred = CREDENTIAL_HINT.test(text);
  const breachNews = BREACH_NEWS_HINT.test(text);
  if (stealer && (db || corporate)) return "MIXED";
  if (stealer) return "STEALER";
  if ((db || corporate) && cred) return "MIXED";
  if (corporate) return "CORPORATE";
  if (db) return "DATABASE";
  if (cred) return "CREDENTIALS";
  if (breachNews) return "CORPORATE";
  return "OTHER";
}

export function isStealerSignal(title: string, category?: string | null, forum?: string | null): boolean {
  const kind = classifyForumSignal(title, category, forum);
  return kind === "STEALER" || (kind === "MIXED" && STEALER_HINT.test(`${title} ${category ?? ""}`));
}

export function isCorporateTheftSignal(title: string, category?: string | null, forum?: string | null): boolean {
  const kind = classifyForumSignal(title, category, forum);
  if (kind === "CORPORATE") return true;
  if (isGovernmentRelatedSignal(title, category, forum) && kind !== "CREDENTIALS") return true;
  return CORPORATE_HINT.test(signalText(title, category, forum));
}

export function isBoliviaRelatedSignal(title: string, category?: string | null, forum?: string | null): boolean {
  const text = signalText(title, category, forum);
  if (!text) return false;
  if (BOLIVIA_HINT.test(text)) return true;
  if (/(?:^|[·,/\s])BO(?:$|[·,/\s])/i.test(category ?? "")) return true;
  return false;
}

export function isGovernmentRelatedSignal(title: string, category?: string | null, forum?: string | null): boolean {
  const headline = title.trim();
  if (!headline) return false;
  if (UNDERGROUND_CREDENTIAL_NOISE.test(headline) && !STEALER_HINT.test(headline) && !GOVERNMENT_HINT.test(headline)) {
    return false;
  }
  const kind = classifyFromTitle(headline);
  if (kind === "CREDENTIALS" && !GOVERNMENT_HINT.test(headline)) return false;
  const text = signalText(title, category, forum);
  if (!GOVERNMENT_HINT.test(text)) return false;
  if (kind === "CREDENTIALS" && !/(?:government|gobierno|ministerio|municipal|federal|\.gov|\.gob\.bo|voter|citizen\s+data|imss|issste|irs|nhs)/i.test(text)) {
    return false;
  }
  return true;
}

/** Higher rank surfaces first: gobierno, robo corporativo, stealers, dumps. */
export function forumSignalPriorityRank(
  title: string,
  kind: ForumSignalKind,
  category?: string | null,
  forum?: string | null,
): number {
  let rank = 0;
  if (kind === "CORPORATE") rank += 90;
  else if (kind === "DATABASE") rank += 80;
  else if (kind === "STEALER") rank += 75;
  else if (kind === "MIXED") rank += 70;
  else if (kind === "CREDENTIALS") rank += 20;
  else rank += 10;
  if (isGovernmentRelatedSignal(title, category, forum)) rank += 200;
  if (isBoliviaRelatedSignal(title, category, forum)) rank += 120;
  return rank;
}

const WORTHY_HINT =
  /(?:breach|leak|filtrac|exposed|ransom|stealer|exfil|hacked|compromis|stolen|dump|pwned|victim|infosteal|combo\s?list|source\s*code|security\s+incident|incidente\s+de\s+seguridad|datos\s+(?:personales|robados|expuestos)|robo\s+de\s+datos|ciberataque|cyber[\s-]?attack)/i;

/** Keeps defensive monitoring titles: dumps, stealers, corporate/gov theft. */
export function isForumSignalWorthy(title: string, category?: string | null, forum?: string | null): boolean {
  if (ALWAYS_WORTHY_FORUM.test((forum ?? "").trim())) return true;
  const kind = classifyForumSignal(title, category, forum);
  if (kind !== "OTHER") return true;
  const text = signalText(title, category, forum);
  if (WORTHY_HINT.test(text)) return true;
  if (isGovernmentRelatedSignal(title, category, forum)) return true;
  return false;
}
