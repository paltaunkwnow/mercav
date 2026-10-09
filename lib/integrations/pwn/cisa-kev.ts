// Environment: HIBP_API_KEY (unused here), NVD_API_KEY (optional, unused here), PWN_ENABLED.

import { ConnectorResponse, PwnConnector, PwnProviderError } from "./types";

const CISA_KEV_FEED =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

export type CisaKevEntry = {
  cveId: string;
  vendorProject: string | null;
  product: string | null;
  vulnerabilityName: string | null;
  dateAdded: string | null;
  shortDescription: string | null;
  requiredAction: string | null;
  dueDate: string | null;
  knownRansomwareCampaignUse: string | null;
  notes: string | null;
  sourceUrl: string;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" ? (value as JsonRecord) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapEntry(value: unknown): CisaKevEntry | null {
  const item = record(value);
  const cveId = text(item?.cveID);
  if (!cveId) return null;
  return {
    cveId,
    vendorProject: text(item?.vendorProject),
    product: text(item?.product),
    vulnerabilityName: text(item?.vulnerabilityName),
    dateAdded: text(item?.dateAdded),
    shortDescription: text(item?.shortDescription),
    requiredAction: text(item?.requiredAction),
    dueDate: text(item?.dueDate),
    knownRansomwareCampaignUse: text(item?.knownRansomwareCampaignUse),
    notes: text(item?.notes),
    sourceUrl: CISA_KEV_FEED,
  };
}

// El catálogo KEV pesa más de 1 MB: una copia por instancia durante una hora.
const KEV_TTL_MS = 60 * 60 * 1000;
let kevCache: { at: number; data: CisaKevEntry[] } | null = null;

export async function fetchKevCatalog(options: { fresh?: boolean } = {}): Promise<ConnectorResponse<CisaKevEntry[]>> {
  if (process.env.PWN_ENABLED !== "true") return { configured: false };
  if (!options.fresh && kevCache && Date.now() - kevCache.at < KEV_TTL_MS) {
    return { configured: true, data: kevCache.data };
  }
  let response: Response;
  try {
    response = await fetch(CISA_KEV_FEED, {
      headers: { "user-agent": "Mercav-Pwn/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { configured: false };
  }
  if (!response.ok) throw new PwnProviderError("CISA KEV");
  // JSON inválido → error de proveedor (antes escapaba un SyntaxError y tumbaba el ciclo).
  let payload: JsonRecord | null;
  try {
    payload = record(await response.json());
  } catch {
    throw new PwnProviderError("CISA KEV");
  }
  if (!Array.isArray(payload?.vulnerabilities)) throw new PwnProviderError("CISA KEV");
  const data = payload.vulnerabilities.map(mapEntry).filter((item): item is CisaKevEntry => Boolean(item));
  kevCache = { at: Date.now(), data };
  return { configured: true, data };
}

/** Entrada KEV de un CVE, null si no figura, o "unknown" si el catálogo no se pudo leer. */
export async function kevEntryFor(cveId: string): Promise<CisaKevEntry | null | "unknown"> {
  try {
    const catalog = await fetchKevCatalog();
    if (!catalog.configured) return "unknown";
    const target = cveId.toUpperCase();
    return catalog.data.find((item) => item.cveId.toUpperCase() === target) ?? null;
  } catch {
    return "unknown";
  }
}

export const cisaKevConnector: PwnConnector<{ cveId: string }, CisaKevEntry[]> = {
  id: "CISA_KEV",

  isConfigured() {
    return process.env.PWN_ENABLED === "true";
  },

  async search(query): Promise<ConnectorResponse<CisaKevEntry[]>> {
    if (!this.isConfigured()) return { configured: false };
    const target = query.cveId.toUpperCase();
    const catalog = await fetchKevCatalog();
    if (!catalog.configured) return catalog;
    return { configured: true, data: catalog.data.filter((item) => item.cveId.toUpperCase() === target) };
  },
};
// creado por pato dev y askforvini
