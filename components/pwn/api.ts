/**
 * Client for the Mercav Pwn routes under app/api/pwn.
 *
 * Envelope: { success: boolean; configured?: boolean; data?: T; error?: string }
 *   HTTP 404 with the generic "No encontrado" body, or configured:false => module off
 *   HTTP 401 => sign-in required
 *   HTTP 403 => permission / verification error (show `error`)
 */

export type PwnFailureReason = "disabled" | "unauthorized" | "forbidden" | "aborted" | "error";

export type PwnResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: PwnFailureReason; message: string; status?: number };

export type Pagination = { page: number; limit: number; total: number; pages: number };

export type Paged<T> = { items: T[]; pagination: Pagination | null };

export type BreachView = {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  sourceUrl: string | null;
  verificationStatus: string | null;
  confidenceScore: number | null;
  severity: string | null;
  dataTypes: string[];
  claimedRecordCount: number | null;
  discoveredAt: string | null;
  publishedAt: string | null;
  firstSeenAt: string | null;
};

export type AlertView = {
  id: string;
  targetId: string | null;
  title: string;
  body: string | null;
  severity: string | null;
  status: string | null;
  read: boolean;
  createdAt: string | null;
  source: string | null;
  targetType: string | null;
  targetDisplay: string | null;
};

export type ExposureFinding = {
  key: string;
  subjectHint: string | null;
  name: string;
  title: string;
  source: string | null;
  sourceUrl: string | null;
  dataTypes: string[];
  firstSeenAt: string | null;
  isSensitive: boolean;
  isRetired: boolean;
  verificationStatus: string | null;
  confidenceScore: number | null;
  riskScore: number | null;
};

export type ExposureResult =
  | { scope: "boolean"; exposed: boolean }
  | { scope: "full"; exposed: boolean; persisted: boolean; findings: ExposureFinding[] };

export type VulnerabilityView = {
  id: string;
  cve: string;
  description: string | null;
  cvss: number | null;
  severity: string | null;
  knownExploited: boolean | null;
  source: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  references: { label: string; href: string }[];
};

export type ForumSignalKind = "DATABASE" | "CREDENTIALS" | "MIXED" | "OTHER";

export type ForumSignalStats = {
  total: number;
  database: number;
  mixed: number;
  credentials: number;
  other: number;
  government: number;
  data: number;
};

export type ForumSignalView = {
  id: string;
  title: string;
  link: string;
  author: string | null;
  category: string | null;
  forum: string | null;
  signalKind: ForumSignalKind;
  priorityRank: number;
  isGovernment: boolean;
  breachName: string | null;
  publishedAt: string | null;
  lastSeenAt: string | null;
  verificationStatus: string | null;
  source: string | null;
};

export type MonitoringTarget = {
  id: string;
  organizationId: string | null;
  targetType: string;
  targetDisplay: string;
  targetLookup: string | null;
  active: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
  createdAt: string | null;
};

export type TargetVerification =
  | { method: "DNS_TXT"; recordName: string; recordValue: string }
  | { method: "ACCOUNT_EMAIL_ONLY"; message: string };

export type ReportView = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string | null;
  metrics: {
    monitoringTargets: number | null;
    exposures: number | null;
    alerts: number | null;
    unreadAlerts: number | null;
    averageConfidence: number | null;
    highestRisk: { score: number | null; level: string | null } | null;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item, 180)).filter((item): item is string => Boolean(item));
}

function sourceName(value: unknown): string | null {
  return asString(value, 80) ?? asString(asRecord(value)?.name, 80);
}

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

function dataOf(body: unknown): unknown {
  return asRecord(body)?.data;
}

function errorMessage(body: unknown, fallback: string): string {
  const raw = asRecord(body)?.error;
  if (typeof raw !== "string") return fallback;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || text.length > 240) return fallback;
  return text;
}

const GENERIC_NOT_FOUND = "No encontrado";

export async function pwnFetch(url: string, init?: RequestInit): Promise<PwnResult<unknown>> {
  try {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const response = await fetch(url, { ...init, headers, cache: "no-store" });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
    const status = response.status;

    if (status === 404) {
      const message = errorMessage(body, "");
      if (!message || message === GENERIC_NOT_FOUND) return { ok: false, reason: "disabled", message: "", status };
      return { ok: false, reason: "error", message, status };
    }
    if (status === 401) {
      return { ok: false, reason: "unauthorized", message: errorMessage(body, ""), status };
    }
    if (status === 403) {
      return { ok: false, reason: "forbidden", message: errorMessage(body, "No tienes permiso para esta acción."), status };
    }
    if (asRecord(body)?.configured === false) return { ok: false, reason: "disabled", message: "", status };

    if (!response.ok || asRecord(body)?.success === false) {
      const fallback =
        status === 429
          ? "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo."
          : status === 502
            ? "El proveedor externo no está disponible."
            : "No se pudo completar la solicitud.";
      return { ok: false, reason: "error", message: errorMessage(body, fallback), status };
    }

    return { ok: true, data: body ?? {} };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "aborted", message: "" };
    }
    return { ok: false, reason: "error", message: "No hay conexión con Mercav Pwn. Inténtalo de nuevo." };
  }
}

export function readPagination(body: unknown): Pagination | null {
  const record = asRecord(asRecord(body)?.pagination);
  const page = asNumber(record?.page);
  const limit = asNumber(record?.limit);
  const total = asNumber(record?.total);
  const pages = asNumber(record?.pages);
  if (page === null || limit === null || total === null || pages === null) return null;
  return { page, limit, total, pages };
}

function mapBreach(item: unknown, index: number): BreachView {
  const record = asRecord(item);
  return {
    id: asString(record?.id, 80) ?? `breach-${index}`,
    name: asString(record?.name, 160) ?? "Filtración sin nombre",
    description: asString(record?.description, 500),
    source: sourceName(record?.source),
    sourceUrl: safeHttpUrl(record?.sourceUrl),
    verificationStatus: asString(record?.verificationStatus, 40),
    confidenceScore: asNumber(record?.confidenceScore),
    severity: asString(record?.severity, 40),
    dataTypes: stringList(record?.dataTypes),
    claimedRecordCount: asNumber(record?.claimedRecordCount),
    discoveredAt: asString(record?.discoveredAt, 40),
    publishedAt: asString(record?.publishedAt, 40),
    firstSeenAt: asString(record?.firstSeenAt, 40),
  };
}

export function readBreaches(body: unknown): Paged<BreachView> {
  const data = dataOf(body);
  return { items: Array.isArray(data) ? data.map(mapBreach) : [], pagination: readPagination(body) };
}

function mapAlert(item: unknown, index: number): AlertView {
  const record = asRecord(item);
  const target = asRecord(record?.target);
  return {
    id: asString(record?.id, 80) ?? `alert-${index}`,
    targetId: asString(record?.targetId, 80),
    title: asString(record?.title, 180) ?? "Alerta sin título",
    body: asString(record?.body, 500),
    severity: asString(record?.severity, 40),
    status: asString(record?.status, 40),
    read: typeof record?.readAt === "string" && record.readAt.length > 0,
    createdAt: asString(record?.createdAt, 40),
    source: sourceName(record?.source),
    targetType: asString(target?.targetType, 40),
    targetDisplay: asString(target?.targetDisplay, 180),
  };
}

export function readAlerts(body: unknown): Paged<AlertView> {
  const data = dataOf(body);
  return { items: Array.isArray(data) ? data.map(mapAlert) : [], pagination: readPagination(body) };
}

export function readExposure(body: unknown): ExposureResult | null {
  const record = asRecord(body);
  if (typeof record?.exposed !== "boolean") return null;
  if (record.scope !== "full") return { scope: "boolean", exposed: record.exposed };
  const rows = Array.isArray(record.data) ? record.data : [];
  const findings = rows.map((item, index): ExposureFinding => {
    const row = asRecord(item);
    const breach = asRecord(row?.breach);
    const name = asString(breach?.name, 160) ?? "Filtración sin nombre";
    return {
      key: asString(row?.id, 80) ?? `${name}-${index}`,
      subjectHint: asString(row?.subjectHint, 180),
      name,
      title: asString(breach?.title, 160) ?? name,
      source: sourceName(breach?.source),
      sourceUrl: safeHttpUrl(breach?.sourceUrl),
      dataTypes: stringList(breach?.dataTypes),
      firstSeenAt: asString(breach?.firstSeenAt, 40),
      isSensitive: breach?.isSensitive === true,
      isRetired: breach?.isRetired === true,
      verificationStatus: asString(breach?.verificationStatus, 40),
      confidenceScore: asNumber(breach?.confidenceScore),
      riskScore: asNumber(breach?.riskScore),
    };
  });
  return { scope: "full", exposed: record.exposed, persisted: record.persisted === true, findings };
}

export type PasswordRangeEntry = { suffix: string; count: number };

function pushSuffix(rows: PasswordRangeEntry[], suffixRaw: unknown, count: unknown) {
  if (typeof suffixRaw !== "string") return;
  const suffix = suffixRaw.trim().toUpperCase();
  const n = typeof count === "string" ? Number(count) : count;
  if (!/^[0-9A-F]{35}$/.test(suffix) || typeof n !== "number" || !Number.isFinite(n) || n < 0) return;
  rows.push({ suffix, count: n });
}

/** Accepts the `{ suffix, count }[]` returned by fetchPasswordRange or raw "SUFFIX:COUNT" lines. */
export function readPasswordRange(body: unknown): PasswordRangeEntry[] | null {
  const data = dataOf(body);
  const rows: PasswordRangeEntry[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      const row = asRecord(item);
      pushSuffix(rows, row?.suffix, row?.count);
    }
    return rows;
  }
  if (typeof data === "string") {
    for (const line of data.split(/\r?\n/)) {
      const [suffix, count] = line.trim().split(":");
      pushSuffix(rows, suffix, count);
    }
    return rows;
  }
  return null;
}

export function countLocalSuffix(fullHash: string, range: PasswordRangeEntry[]): number {
  const suffix = fullHash.slice(5).toUpperCase();
  return range.find((row) => row.suffix === suffix)?.count ?? 0;
}

function referenceList(value: unknown, attribution: unknown): { label: string; href: string }[] {
  const refs = [...(Array.isArray(attribution) ? attribution : []), ...(Array.isArray(value) ? value : [])];
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const ref of refs) {
    const record = asRecord(ref);
    const href = safeHttpUrl(record?.url ?? record?.href ?? ref);
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push({ label: asString(record?.source, 80) ?? asString(record?.label, 80) ?? href, href });
  }
  return out.slice(0, 6);
}

export function readVulnerability(body: unknown): VulnerabilityView | null {
  const outer = asRecord(body);
  if (outer?.found !== true) return null;
  const record = asRecord(outer.data);
  const cve = asString(record?.cveId, 40);
  if (!record || !cve) return null;
  const known = record.knownExploitedVulnerability ?? record.kev;
  return {
    id: asString(record.id, 80) ?? cve,
    cve: cve.toUpperCase(),
    description: asString(record.description, 700),
    cvss: asNumber(record.cvssScore),
    severity: asString(record.severity, 40),
    knownExploited: typeof known === "boolean" ? known : null,
    source: sourceName(record.source),
    sourceUrl: safeHttpUrl(record.sourceUrl),
    publishedAt: asString(record.publishedAt, 40),
    references: referenceList(record.references, record.attribution),
  };
}

function mapTarget(item: unknown): MonitoringTarget | null {
  const record = asRecord(item);
  const id = asString(record?.id, 80);
  const targetDisplay = asString(record?.targetDisplay, 180);
  if (!record || !id || !targetDisplay) return null;
  return {
    id,
    organizationId: asString(record.organizationId, 80),
    targetType: asString(record.targetType, 20) ?? "EMAIL",
    targetDisplay,
    targetLookup: asString(record.targetLookup, 253),
    active: record.active === true,
    verificationStatus: asString(record.verificationStatus, 20) ?? "PENDING",
    verifiedAt: asString(record.verifiedAt, 40),
    createdAt: asString(record.createdAt, 40),
  };
}

export function readTargets(body: unknown): MonitoringTarget[] {
  const data = dataOf(body);
  if (!Array.isArray(data)) return [];
  return data.map(mapTarget).filter((item): item is MonitoringTarget => Boolean(item));
}

export function readCreatedTarget(body: unknown): { target: MonitoringTarget | null; verification: TargetVerification | null } {
  const data = asRecord(dataOf(body));
  const raw = asRecord(data?.verification);
  let verification: TargetVerification | null = null;
  if (raw?.method === "DNS_TXT") {
    const recordName = typeof raw.recordName === "string" ? raw.recordName : null;
    const recordValue = typeof raw.recordValue === "string" ? raw.recordValue : null;
    if (recordName && recordValue) verification = { method: "DNS_TXT", recordName, recordValue };
  } else if (raw?.method === "ACCOUNT_EMAIL_ONLY") {
    verification = { method: "ACCOUNT_EMAIL_ONLY", message: asString(raw.message, 300) ?? "" };
  }
  return { target: mapTarget(data), verification };
}

export function readVerifiedTarget(body: unknown): { id: string; verificationStatus: string; verifiedAt: string | null } | null {
  const data = asRecord(dataOf(body));
  const id = asString(data?.id, 80);
  if (!id) return null;
  return {
    id,
    verificationStatus: asString(data?.verificationStatus, 20) ?? "VERIFIED",
    verifiedAt: asString(data?.verifiedAt, 40),
  };
}

export function readReport(body: unknown): ReportView | null {
  const data = asRecord(dataOf(body));
  const id = asString(data?.id, 80);
  if (!data || !id) return null;
  const metrics = asRecord(data.metrics);
  const highest = asRecord(metrics?.highestRisk);
  return {
    id,
    title: asString(data.title, 180) ?? "Informe sin título",
    summary: asString(data.summary, 2000),
    createdAt: asString(data.createdAt, 40),
    metrics: {
      monitoringTargets: asNumber(metrics?.monitoringTargets),
      exposures: asNumber(metrics?.exposures),
      alerts: asNumber(metrics?.alerts),
      unreadAlerts: asNumber(metrics?.unreadAlerts),
      averageConfidence: asNumber(metrics?.averageConfidence),
      highestRisk: highest ? { score: asNumber(highest.score), level: asString(highest.level, 20) } : null,
    },
  };
}

export function readForumSignals(body: unknown): {
  items: ForumSignalView[];
  pagination: Pagination | null;
  stats: ForumSignalStats | null;
  sync: { lastFinishedAt: string | null; lastStatus: string | null } | null;
} | null {
  const envelope = asRecord(body);
  const data = asRecord(envelope?.data);
  if (!data) return null;
  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.flatMap((item, index): ForumSignalView[] => {
    const row = asRecord(item);
    const id = asString(row?.id, 80);
    const title = asString(row?.title, 500);
    const link = safeHttpUrl(row?.link);
    if (!id || !title || !link) return [];
    const kindRaw = asString(row?.signalKind, 20)?.toUpperCase();
    const signalKind: ForumSignalKind =
      kindRaw === "DATABASE" || kindRaw === "CREDENTIALS" || kindRaw === "MIXED" ? kindRaw : "OTHER";
    const priorityRank = Number(row?.priorityRank ?? 0) || 0;
    return [
      {
        id,
        title,
        link,
        author: asString(row?.author, 120),
        category: asString(row?.category, 120),
        forum: asString(row?.forum, 120),
        signalKind,
        priorityRank,
        isGovernment: row?.isGovernment === true,
        breachName: asString(row?.breachName, 120),
        publishedAt: asString(row?.publishedAt, 40),
        lastSeenAt: asString(row?.lastSeenAt, 40),
        verificationStatus: asString(row?.verificationStatus, 40),
        source: asString(row?.source, 80),
      },
    ];
  });
  const statsRaw = asRecord(data.stats);
  const syncRaw = asRecord(data.sync);
  return {
    items,
    pagination: readPagination({ pagination: data.pagination }),
    stats: statsRaw
      ? {
          total: Number(statsRaw.total ?? 0) || 0,
          database: Number(statsRaw.database ?? 0) || 0,
          mixed: Number(statsRaw.mixed ?? 0) || 0,
          credentials: Number(statsRaw.credentials ?? 0) || 0,
          other: Number(statsRaw.other ?? 0) || 0,
          government: Number(statsRaw.government ?? 0) || 0,
          data: Number(statsRaw.data ?? 0) || 0,
        }
      : null,
    sync: syncRaw
      ? {
          lastFinishedAt: asString(syncRaw.lastFinishedAt, 40),
          lastStatus: asString(syncRaw.lastStatus, 40),
        }
      : null,
  };
}

export function isCriticalLevel(value: string | null | undefined): boolean {
  if (!value) return false;
  return /crit/i.test(value);
}
