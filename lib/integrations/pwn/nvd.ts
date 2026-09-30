// Environment: HIBP_API_KEY (unused here), NVD_API_KEY (optional), PWN_ENABLED.

import { ConnectorResponse, PwnConnector, PwnProviderError } from "./types";

const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";

export type NvdQuery = { cveId?: string; keyword?: string };

export type NvdVulnerability = {
  cveId: string;
  description: string | null;
  publishedAt: string | null;
  lastModifiedAt: string | null;
  status: string | null;
  cvssVersion: string | null;
  cvssScore: number | null;
  cvssSeverity: string | null;
  vector: string | null;
  references: string[];
  affectedProducts: string[];
  sourceUrl: string;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" ? (value as JsonRecord) : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function firstCvss(metrics: unknown): {
  version: string | null;
  score: number | null;
  severity: string | null;
  vector: string | null;
} {
  const source = record(metrics);
  const candidates = ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"];
  for (const key of candidates) {
    const candidate = source?.[key];
    const first = Array.isArray(candidate) ? record(candidate[0]) : null;
    const data = record(first?.cvssData);
    if (!data) continue;
    return {
      version: stringValue(data.version),
      score: typeof data.baseScore === "number" ? data.baseScore : null,
      severity: stringValue(data.baseSeverity) ?? stringValue(first?.baseSeverity),
      vector: stringValue(data.vectorString),
    };
  }
  return { version: null, score: null, severity: null, vector: null };
}

function collectCpes(nodes: unknown): string[] {
  if (!Array.isArray(nodes)) return [];
  const values = new Set<string>();
  const visit = (value: unknown) => {
    const item = record(value);
    if (!item) return;
    if (Array.isArray(item.cpeMatch)) {
      for (const match of item.cpeMatch) {
        const criteria = stringValue(record(match)?.criteria);
        if (criteria) values.add(criteria);
      }
    }
    if (Array.isArray(item.nodes)) item.nodes.forEach(visit);
  };
  nodes.forEach(visit);
  return [...values];
}

function mapVulnerability(value: unknown): NvdVulnerability | null {
  const cve = record(record(value)?.cve);
  const cveId = stringValue(cve?.id);
  if (!cveId) return null;

  const descriptions = Array.isArray(cve?.descriptions) ? cve.descriptions : [];
  const preferred =
    descriptions.find((item) => record(item)?.lang === "es") ??
    descriptions.find((item) => record(item)?.lang === "en") ??
    descriptions[0];
  const cvss = firstCvss(cve?.metrics);
  const references = Array.isArray(cve?.references)
    ? cve.references
        .map((item) => stringValue(record(item)?.url))
        .filter((item): item is string => Boolean(item))
    : [];

  return {
    cveId,
    description: stringValue(record(preferred)?.value),
    publishedAt: stringValue(cve?.published),
    lastModifiedAt: stringValue(cve?.lastModified),
    status: stringValue(cve?.vulnStatus),
    cvssVersion: cvss.version,
    cvssScore: cvss.score,
    cvssSeverity: cvss.severity,
    vector: cvss.vector,
    references,
    affectedProducts: collectCpes(cve?.configurations),
    sourceUrl: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cveId)}`,
  };
}

export const nvdConnector: PwnConnector<NvdQuery, NvdVulnerability[]> = {
  id: "NVD",

  isConfigured() {
    return process.env.PWN_ENABLED === "true";
  },

  async search(query): Promise<ConnectorResponse<NvdVulnerability[]>> {
    if (!this.isConfigured()) return { configured: false };
    const params = new URLSearchParams();
    if (query.cveId) params.set("cveId", query.cveId.toUpperCase());
    if (query.keyword) params.set("keywordSearch", query.keyword);
    if (![...params].length) throw new TypeError("Se requiere cveId o keyword");

    const headers: Record<string, string> = { "user-agent": "Mercav-Pwn/1.0" };
    if (process.env.NVD_API_KEY) headers.apiKey = process.env.NVD_API_KEY;

    let response: Response;
    try {
      response = await fetch(`${NVD_API}?${params}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return { configured: false };
    }
    try {
      if (!response.ok) throw new PwnProviderError("NVD");
      const payload = record(await response.json());
      if (!Array.isArray(payload?.vulnerabilities)) throw new Error("Invalid payload");
      return {
        configured: true,
        data: payload.vulnerabilities
          .map(mapVulnerability)
          .filter((item): item is NvdVulnerability => Boolean(item)),
      };
    } catch (error) {
      if (error instanceof PwnProviderError) throw error;
      throw new PwnProviderError("NVD");
    }
  },
};
// creado por pato dev y askforvini
