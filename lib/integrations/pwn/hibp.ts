// Environment: HIBP_API_KEY (required), NVD_API_KEY (optional, unused here),
// PWN_ENABLED (must be exactly "true"; anything else disables the connector).

import {
  ConnectorResponse,
  PwnConnector,
  PwnProviderError,
  rateLimitedError,
} from "./types";
import { breachesForDomain } from "@/lib/pwn/hibp-domain";

const HIBP_API = "https://haveibeenpwned.com/api/v3";
const PASSWORDS_API = "https://api.pwnedpasswords.com/range";
const USER_AGENT = "Mercav-Pwn/1.0 (security exposure monitoring)";

export type HibpBreach = {
  name: string;
  title: string;
  domain: string | null;
  breachDate: string | null;
  addedDate: string | null;
  modifiedDate: string | null;
  pwnCount: number | null;
  description: string | null;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  sourceUrl: string;
};

export type HibpQuery =
  | { type: "email"; account: string }
  | { type: "domain"; account: string }
  | { type: "breach"; account: string };

type RawHibpBreach = {
  Name?: unknown;
  Title?: unknown;
  Domain?: unknown;
  BreachDate?: unknown;
  AddedDate?: unknown;
  ModifiedDate?: unknown;
  PwnCount?: unknown;
  Description?: unknown;
  DataClasses?: unknown;
  IsVerified?: unknown;
  IsFabricated?: unknown;
  IsSensitive?: unknown;
  IsRetired?: unknown;
};

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapBreach(value: RawHibpBreach): HibpBreach | null {
  const name = text(value.Name);
  if (!name) return null;
  return {
    name,
    title: text(value.Title) ?? name,
    domain: text(value.Domain),
    breachDate: text(value.BreachDate),
    addedDate: text(value.AddedDate),
    modifiedDate: text(value.ModifiedDate),
    pwnCount: typeof value.PwnCount === "number" ? value.PwnCount : null,
    description: text(value.Description),
    dataClasses: Array.isArray(value.DataClasses)
      ? value.DataClasses.filter((item): item is string => typeof item === "string")
      : [],
    isVerified: value.IsVerified === true,
    isFabricated: value.IsFabricated === true,
    isSensitive: value.IsSensitive === true,
    isRetired: value.IsRetired === true,
    sourceUrl: `https://haveibeenpwned.com/PwnedWebsites#${encodeURIComponent(name)}`,
  };
}

export function isPwnEnabled(): boolean {
  return process.env.PWN_ENABLED === "true";
}

async function hibpRequest(path: string): Promise<Response> {
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    throw new PwnProviderError("HIBP", "HIBP no está configurado");
  }

  try {
    return await fetch(`${HIBP_API}${path}`, {
      headers: {
        "hibp-api-key": apiKey,
        "user-agent": USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new PwnProviderError("HIBP");
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * breacheddomain returns `{ "<alias>": ["BreachName", ...] }`. Only the unique
 * breach names are kept; aliases (local parts of real mailboxes) are dropped.
 */
export function parseDomainPayload(payload: unknown): string[] {
  if (!isPlainObject(payload)) throw new PwnProviderError("HIBP");
  const names = new Set<string>();
  for (const breaches of Object.values(payload)) {
    if (!Array.isArray(breaches)) throw new PwnProviderError("HIBP");
    for (const name of breaches) {
      if (typeof name !== "string" || name.length === 0) throw new PwnProviderError("HIBP");
      names.add(name);
    }
  }
  return [...names];
}

function parseBreachList(payload: unknown): HibpBreach[] {
  if (!Array.isArray(payload)) throw new PwnProviderError("HIBP");
  return payload.map((item) => {
    const breach = isPlainObject(item) ? mapBreach(item as RawHibpBreach) : null;
    if (!breach) throw new PwnProviderError("HIBP");
    return breach;
  });
}

// El catálogo pesa cerca de 1 MB: se guarda una hora por instancia en vez de bajarlo en cada consulta.
const CATALOG_TTL_MS = 60 * 60 * 1000;
let catalogCache: { at: number; data: HibpBreach[] } | null = null;

/** Public catalog of disclosed breaches. Does not require HIBP_API_KEY. */
export async function fetchHibpBreachCatalog(options: { fresh?: boolean } = {}): Promise<ConnectorResponse<HibpBreach[]>> {
  if (!isPwnEnabled()) return { configured: false };
  if (!options.fresh && catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return { configured: true, data: catalogCache.data };
  }
  let response: Response;
  try {
    response = await fetch(`${HIBP_API}/breaches`, {
      headers: { "user-agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    if (catalogCache) return { configured: true, data: catalogCache.data };
    return { configured: false };
  }
  if (response.status === 429) throw rateLimitedError("HIBP", response);
  if (!response.ok) {
    if (catalogCache) return { configured: true, data: catalogCache.data };
    throw new PwnProviderError("HIBP");
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PwnProviderError("HIBP");
  }
  const data = parseBreachList(payload);
  catalogCache = { at: Date.now(), data };
  return { configured: true, data };
}

/**
 * Dos preguntas distintas sobre un dominio:
 * - catalog: ¿el servicio de ese dominio sufrió una filtración? (catálogo público, sin API key)
 * - accounts: ¿hay cuentas @dominio en filtraciones? (breacheddomain: necesita API key y que HIBP
 *   tenga el dominio verificado para esa key). Solo se intenta para dominios propios verificados.
 */
export type DomainBreachMode = "catalog" | "accounts";

function domainStubs(names: string[]): HibpBreach[] {
  return names.map((name) => ({
    name,
    title: name,
    domain: null,
    breachDate: null,
    addedDate: null,
    modifiedDate: null,
    pwnCount: null,
    description: null,
    dataClasses: [],
    isVerified: false,
    isFabricated: false,
    isSensitive: false,
    isRetired: false,
    sourceUrl: `https://haveibeenpwned.com/PwnedWebsites#${encodeURIComponent(name)}`,
  }));
}

async function catalogForDomain(domain: string): Promise<ConnectorResponse<{ mode: DomainBreachMode; data: HibpBreach[] }>> {
  const catalog = await fetchHibpBreachCatalog();
  if (!catalog.configured) return { configured: false };
  return { configured: true, data: { mode: "catalog", data: breachesForDomain(catalog.data, domain) } };
}

export async function searchDomainBreaches(
  domain: string,
  options: { owned: boolean },
): Promise<ConnectorResponse<{ mode: DomainBreachMode; data: HibpBreach[] }>> {
  if (!isPwnEnabled()) return { configured: false };
  if (!options.owned || !process.env.HIBP_API_KEY) return catalogForDomain(domain);

  let response: Response;
  try {
    response = await hibpRequest(`/breacheddomain/${encodeURIComponent(domain)}`);
  } catch {
    return catalogForDomain(domain);
  }
  if (response.status === 429) throw rateLimitedError("HIBP", response);
  if (response.status === 404) return { configured: true, data: { mode: "accounts", data: [] } };
  // 401/403: HIBP no tiene ese dominio verificado para nuestra key. Caemos al catálogo público.
  if (!response.ok) return catalogForDomain(domain);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return catalogForDomain(domain);
  }
  return { configured: true, data: { mode: "accounts", data: domainStubs(parseDomainPayload(payload)) } };
}

export const hibpConnector: PwnConnector<HibpQuery, HibpBreach[]> = {
  id: "HIBP",

  isConfigured() {
    return isPwnEnabled() && Boolean(process.env.HIBP_API_KEY);
  },

  async search(query) {
    if (!isPwnEnabled()) return { configured: false };

    // Por defecto un dominio se mira en el catálogo público; los propios usan searchDomainBreaches.
    if (query.type === "domain") {
      const result = await catalogForDomain(query.account);
      return result.configured ? { configured: true, data: result.data.data } : result;
    }
    if (!this.isConfigured()) return { configured: false };

    const path =
      query.type === "email"
        ? `/breachedaccount/${encodeURIComponent(query.account)}?truncateResponse=false`
        : `/breach/${encodeURIComponent(query.account)}`;
    const response = await hibpRequest(path);

    if (response.status === 404) return { configured: true, data: [] };
    // HIBP aplica límite por API key: lo distinguimos para devolver 429 con Retry-After.
    if (response.status === 429) throw rateLimitedError("HIBP", response);
    if (!response.ok) throw new PwnProviderError("HIBP");

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new PwnProviderError("HIBP");
    }

    if (query.type === "breach") {
      return { configured: true, data: parseBreachList([payload]) };
    }
    return { configured: true, data: parseBreachList(payload) };
  },
};

export type PasswordRangeEntry = { suffix: string; count: number };

export function isValidPasswordPrefix(prefix: string): boolean {
  return /^[A-F0-9]{5}$/i.test(prefix);
}

export async function fetchPasswordRange(
  prefix: string,
): Promise<ConnectorResponse<PasswordRangeEntry[]>> {
  if (!isPwnEnabled()) return { configured: false };
  if (!isValidPasswordPrefix(prefix)) {
    throw new TypeError("El prefijo debe contener exactamente 5 caracteres hexadecimales");
  }

  let response: Response;
  try {
    response = await fetch(`${PASSWORDS_API}/${prefix.toUpperCase()}`, {
      headers: {
        "Add-Padding": "true",
        "user-agent": USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { configured: false };
  }
  try {
    if (response.status === 429) throw rateLimitedError("HIBP Passwords", response);
    if (!response.ok) throw new PwnProviderError("HIBP Passwords");
    const body = await response.text();
    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const data = lines.map((line) => {
      const match = line.match(/^([A-F0-9]{35}):(\d+)$/i);
      if (!match) throw new PwnProviderError("HIBP Passwords");
      return { suffix: match[1].toUpperCase(), count: Number(match[2]) };
    });

    return { configured: true, data };
  } catch (error) {
    if (error instanceof PwnProviderError) throw error;
    throw new PwnProviderError("HIBP Passwords");
  }
}

// Useful for clients/tests that need to document the local-only hashing contract.
export function passwordPrefixFromSha1(sha1: string): string {
  if (!/^[A-F0-9]{40}$/i.test(sha1)) throw new TypeError("SHA-1 inválido");
  return sha1.slice(0, 5).toUpperCase();
}
// creado por pato dev y askforvini
