export type PwnFeedSourceDefinition = {
  name: string;
  label: string;
  sourceType: "FORUM_SCRAPE" | "RSS";
  reliability: number;
  method: string;
  /** Display name stored on signals (`forum` field) — excluded from gov/kind heuristics. */
  forumLabel: string;
  rssUrl?: string;
  allowedLinkHosts?: string[];
};

function hosts(...names: string[]): string[] {
  return names.flatMap((name) => [name, `www.${name}`]);
}

export const PWN_FEED_SOURCES: PwnFeedSourceDefinition[] = [
  {
    name: "FORUM_DARKNETARMY",
    label: "Foro DarkNetArmy (metadatos)",
    sourceType: "FORUM_SCRAPE",
    reliability: 35,
    method: "Scrape defensivo de títulos públicos; sin contenido del hilo",
    forumLabel: "DarkNetArmy",
  },
  {
    name: "FORUM_HACKREAD",
    label: "Hackread (noticias)",
    sourceType: "FORUM_SCRAPE",
    reliability: 55,
    method: "API pública WordPress; solo titular y enlace",
    forumLabel: "Hackread",
  },
  {
    name: "RSS_BLEEPINGCOMPUTER",
    label: "BleepingComputer RSS",
    sourceType: "RSS",
    reliability: 65,
    method: "RSS oficial",
    forumLabel: "BleepingComputer",
    rssUrl: "https://www.bleepingcomputer.com/feed/",
    allowedLinkHosts: hosts("bleepingcomputer.com"),
  },
  {
    name: "RSS_THEHACKERNEWS",
    label: "The Hacker News RSS",
    sourceType: "RSS",
    reliability: 60,
    method: "RSS FeedBurner",
    forumLabel: "The Hacker News",
    rssUrl: "https://feeds.feedburner.com/TheHackersNews",
    allowedLinkHosts: hosts("thehackernews.com"),
  },
  {
    name: "RSS_SECURITYWEEK",
    label: "SecurityWeek RSS",
    sourceType: "RSS",
    reliability: 62,
    method: "RSS oficial",
    forumLabel: "SecurityWeek",
    rssUrl: "https://www.securityweek.com/feed/",
    allowedLinkHosts: hosts("securityweek.com"),
  },
  {
    name: "RSS_DARKREADING",
    label: "Dark Reading RSS",
    sourceType: "RSS",
    reliability: 63,
    method: "RSS oficial",
    forumLabel: "Dark Reading",
    rssUrl: "https://www.darkreading.com/rss.xml",
    allowedLinkHosts: hosts("darkreading.com"),
  },
  {
    name: "RSS_KREBS",
    label: "Krebs on Security RSS",
    sourceType: "RSS",
    reliability: 72,
    method: "RSS oficial",
    forumLabel: "Krebs on Security",
    rssUrl: "https://krebsonsecurity.com/feed/",
    allowedLinkHosts: hosts("krebsonsecurity.com"),
  },
  {
    name: "RSS_SECURITYAFFAIRS",
    label: "Security Affairs RSS",
    sourceType: "RSS",
    reliability: 58,
    method: "RSS oficial",
    forumLabel: "Security Affairs",
    rssUrl: "https://securityaffairs.com/feed",
    allowedLinkHosts: hosts("securityaffairs.com"),
  },
  {
    name: "RSS_THE_RECORD",
    label: "The Record RSS",
    sourceType: "RSS",
    reliability: 68,
    method: "RSS oficial",
    forumLabel: "The Record",
    rssUrl: "https://therecord.media/feed/",
    allowedLinkHosts: hosts("therecord.media"),
  },
  {
    name: "RSS_CYBERSECURITY_DIVE",
    label: "Cybersecurity Dive RSS",
    sourceType: "RSS",
    reliability: 64,
    method: "RSS oficial",
    forumLabel: "Cybersecurity Dive",
    rssUrl: "https://www.cybersecuritydive.com/feeds/news/",
    allowedLinkHosts: hosts("cybersecuritydive.com"),
  },
  {
    name: "RSS_HELPNETSECURITY",
    label: "Help Net Security RSS",
    sourceType: "RSS",
    reliability: 61,
    method: "RSS oficial",
    forumLabel: "Help Net Security",
    rssUrl: "https://www.helpnetsecurity.com/feed/",
    allowedLinkHosts: hosts("helpnetsecurity.com"),
  },
  {
    name: "RSS_INFOSECURITY_MAG",
    label: "Infosecurity Magazine RSS",
    sourceType: "RSS",
    reliability: 60,
    method: "RSS oficial",
    forumLabel: "Infosecurity Magazine",
    rssUrl: "https://www.infosecurity-magazine.com/rss/news/",
    allowedLinkHosts: hosts("infosecurity-magazine.com"),
  },
  {
    name: "RSS_CSO",
    label: "CSO Online RSS",
    sourceType: "RSS",
    reliability: 59,
    method: "RSS oficial",
    forumLabel: "CSO Online",
    rssUrl: "https://www.csoonline.com/feed/",
    allowedLinkHosts: hosts("csoonline.com"),
  },
  {
    name: "RSS_ZDNET_SECURITY",
    label: "ZDNet Security RSS",
    sourceType: "RSS",
    reliability: 58,
    method: "RSS topic security",
    forumLabel: "ZDNet Security",
    rssUrl: "https://www.zdnet.com/topic/security/rss.xml",
    allowedLinkHosts: hosts("zdnet.com"),
  },
  {
    name: "RSS_THE_REGISTER",
    label: "The Register Security RSS",
    sourceType: "RSS",
    reliability: 57,
    method: "Atom security headlines",
    forumLabel: "The Register",
    rssUrl: "https://www.theregister.com/security/headlines.atom",
    allowedLinkHosts: hosts("theregister.com"),
  },
  {
    name: "RSS_WELIVESECURITY",
    label: "WeLiveSecurity RSS",
    sourceType: "RSS",
    reliability: 66,
    method: "RSS ESET",
    forumLabel: "WeLiveSecurity",
    rssUrl: "https://www.welivesecurity.com/feed/",
    allowedLinkHosts: hosts("welivesecurity.com"),
  },
  {
    name: "RSS_TALOS",
    label: "Talos Intelligence RSS",
    sourceType: "RSS",
    reliability: 67,
    method: "RSS Cisco Talos",
    forumLabel: "Talos Intelligence",
    rssUrl: "https://blog.talosintelligence.com/rss/",
    allowedLinkHosts: hosts("blog.talosintelligence.com", "talosintelligence.com"),
  },
  {
    name: "RSS_MALWAREBYTES",
    label: "Malwarebytes Labs RSS",
    sourceType: "RSS",
    reliability: 56,
    method: "RSS blog",
    forumLabel: "Malwarebytes Labs",
    rssUrl: "https://www.malwarebytes.com/blog/feed/index.xml",
    allowedLinkHosts: hosts("malwarebytes.com"),
  },
  {
    name: "RSS_UNIT42",
    label: "Unit 42 RSS",
    sourceType: "RSS",
    reliability: 65,
    method: "RSS Palo Alto Unit 42",
    forumLabel: "Unit 42",
    rssUrl: "https://unit42.paloaltonetworks.com/feed/",
    allowedLinkHosts: hosts("unit42.paloaltonetworks.com", "paloaltonetworks.com"),
  },
  {
    name: "RSS_CYBERSCOOP",
    label: "CyberScoop RSS",
    sourceType: "RSS",
    reliability: 69,
    method: "RSS oficial",
    forumLabel: "CyberScoop",
    rssUrl: "https://www.cyberscoop.com/feed/",
    allowedLinkHosts: hosts("cyberscoop.com"),
  },
  {
    name: "RSS_INFORMATIONWEEK",
    label: "InformationWeek RSS",
    sourceType: "RSS",
    reliability: 55,
    method: "RSS oficial",
    forumLabel: "InformationWeek",
    rssUrl: "https://www.informationweek.com/rss.xml",
    allowedLinkHosts: hosts("informationweek.com"),
  },
  {
    name: "RSS_ITSECURITYGURU",
    label: "IT Security Guru RSS",
    sourceType: "RSS",
    reliability: 54,
    method: "RSS oficial",
    forumLabel: "IT Security Guru",
    rssUrl: "https://www.itsecurityguru.org/feed/",
    allowedLinkHosts: hosts("itsecurityguru.org"),
  },
  {
    name: "RSS_TECHRADAR_SECURITY",
    label: "TechRadar Security RSS",
    sourceType: "RSS",
    reliability: 52,
    method: "RSS topic security",
    forumLabel: "TechRadar Security",
    rssUrl: "https://www.techradar.com/rss/news/security",
    allowedLinkHosts: hosts("techradar.com"),
  },
  {
    name: "RSS_SENTINELONE",
    label: "SentinelOne Blog RSS",
    sourceType: "RSS",
    reliability: 53,
    method: "RSS blog",
    forumLabel: "SentinelOne",
    rssUrl: "https://www.sentinelone.com/blog/feed/",
    allowedLinkHosts: hosts("sentinelone.com"),
  },
  {
    name: "RSS_CROWDSTRIKE",
    label: "CrowdStrike Blog RSS",
    sourceType: "RSS",
    reliability: 54,
    method: "RSS blog",
    forumLabel: "CrowdStrike",
    rssUrl: "https://www.crowdstrike.com/blog/feed/",
    allowedLinkHosts: hosts("crowdstrike.com"),
  },
];

export const PWN_FEED_SOURCE_NAMES = PWN_FEED_SOURCES.map((s) => s.name);

export function pwnFeedSourceMeta(name: string): PwnFeedSourceDefinition | undefined {
  return PWN_FEED_SOURCES.find((s) => s.name === name);
}

export function pwnRssFeedDefinitions(): Array<{
  sourceName: string;
  url: string;
  allowedLinkHosts: string[];
  forumLabel: string;
}> {
  return PWN_FEED_SOURCES.flatMap((source) => {
    if (source.sourceType !== "RSS" || !source.rssUrl || !source.allowedLinkHosts?.length) return [];
    return [
      {
        sourceName: source.name,
        url: source.rssUrl,
        allowedLinkHosts: source.allowedLinkHosts,
        forumLabel: source.forumLabel,
      },
    ];
  });
}

/** Labels from feeds/forums that must not skew classification. */
export function isGenericForumLabel(forum?: string | null): boolean {
  const value = (forum ?? "").trim().toLowerCase();
  if (!value) return false;
  return PWN_FEED_SOURCES.some((s) => s.forumLabel.toLowerCase() === value);
}
