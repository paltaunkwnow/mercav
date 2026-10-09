import { explainHibpBreach, translateDataClasses } from "@/lib/pwn/breach-copy";

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
  descriptionDetail: string | null;
  descriptionImplication: string | null;
  descriptionLinks: { href: string; label: string }[];
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
  /** Clases de HIBP tal cual (en inglés), para elegir los próximos pasos. */
  rawDataTypes: string[];
  subjectHint: string | null;
  name: string;
  title: string;
  description: string | null;
  descriptionDetail: string | null;
  descriptionImplication: string | null;
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

/**
 * - summary: correo ajeno o sin verificar. Solo sí/no y cuántas (sin contar las sensibles).
 * - full + owner: objetivo propio verificado, con todo el detalle.
 * - full + catalog: dominio contra el catálogo público de HIBP (filtraciones del servicio del dominio).
 */
export type ExposureResult =
  | { scope: "summary"; exposed: boolean; count: number }
  | {
      scope: "full";
      access: "owner" | "catalog";
      domainMode: "catalog" | "accounts" | null;
      exposed: boolean;
      count: number;
      hiddenSensitive: number;
      persisted: boolean;
      findings: ExposureFinding[];
    };

export type VulnerabilityView = {
  id: string;
  /** NVD no respondió y se muestra el último dato guardado. */
  stale: boolean;
  checkedAt: string | null;
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

export type ForumSignalKind = "DATABASE" | "STEALER" | "CORPORATE" | "CREDENTIALS" | "MIXED" | "OTHER";

export type ForumSignalStats = {
  total: number;
  database: number;
  mixed: number;
  credentials: number;
  other: number;
  stealer: number;
  corporate: number;
  government: number;
  bolivia: number;
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
  isBolivia: boolean;
  breachName: string | null;
  publishedAt: string | null;
  lastSeenAt: string | null;
  verificationStatus: string | null;
  source: string | null;
};

export type ConfirmationMethod = "ACCOUNT" | "EMAIL_LINK" | "ADMIN_AUTHORIZATION" | "DNS_TXT";

export type MonitoringTarget = {
  id: string;
  organizationId: string | null;
  targetType: string;
  targetDisplay: string;
  targetLookup: string | null;
  active: boolean;
  verificationStatus: string;
  /** Cómo se prueba que es tuyo, si todavía no está probado. */
  confirmationMethod: ConfirmationMethod | null;
  /** Hay un enlace o un registro DNS emitido esperando confirmación. */
  awaitingConfirmation: boolean;
  isAccountEmail: boolean;
  authorizationRequestedAt: string | null;
  authorizationMessage: string | null;
  verifiedAt: string | null;
  createdAt: string | null;
};

export type TargetVerification =
  | { method: "DNS_TXT"; host: string; record: string; message: string }
  | { method: "EMAIL_LINK"; sent: boolean; message: string }
  | { method: "ADMIN_AUTHORIZATION"; message: string };

export type TargetsMeta = { mailerReady: boolean; accountEmailConfirmed: boolean; accountEmailFollowed: boolean };

export type MonitorAuthRequest = MonitoringTarget & {
  owner: { id: string | null; name: string | null; email: string | null; username: string | null; emailConfirmed: boolean };
  /** El correo pedido es el de la cuenta del solicitante (el admin no ve el correo, solo esto). */
  isOwnerAccountEmail: boolean;
};

export type OrganizationView = { id: string; name: string; domain: string | null; targetCount: number; createdAt: string | null };

export type ReportHistoryItem = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string | null;
  organization: { id: string; name: string } | null;
};

export type SummaryView = {
  verdict: { tone: "clean" | "exposed" | "idle"; unreadAlerts: number; provenTargets: number };
  counts: {
    targets: number;
    provenTargets: number;
    activeProvenTargets: number;
    pendingTargets: number;
    exposures: number;
    alerts: number;
    unreadAlerts: number;
  };
  recentAlerts: AlertView[];
  signals: ForumSignalView[];
  verifiedIntel: { id: string; name: string; sourceUrl: string | null; publishedAt: string | null; source: string | null }[];
};

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

/** Como asString, pero conserva los saltos de línea (cuerpo de una alerta). */
function asMultiline(value: unknown, max = 4_000): string | null {
  if (typeof value !== "string") return null;
  const clean = value
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
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
      return { ok: false, reason: "forbidden", message: errorMessage(body, "No tenés permiso para esta acción."), status };
    }
    if (asRecord(body)?.configured === false) return { ok: false, reason: "disabled", message: "", status };

    if (!response.ok || asRecord(body)?.success === false) {
      const fallback =
        status === 429
          ? "Demasiadas solicitudes. Esperá un momento y probá de nuevo."
          : status === 502
            ? "El proveedor externo no respondió. Probá de nuevo en unos minutos."
            : "No se pudo completar la solicitud.";
      return { ok: false, reason: "error", message: errorMessage(body, fallback), status };
    }

    return { ok: true, data: body ?? {} };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "aborted", message: "" };
    }
    return { ok: false, reason: "error", message: "No hay conexión con Mercav Pwn. Probá de nuevo." };
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
  const name = asString(record?.name, 160) ?? "Filtración sin nombre";
  const dataTypesRaw = stringList(record?.dataTypes);
  const claimedRecordCount = asNumber(record?.claimedRecordCount);
  const publishedAt = asString(record?.publishedAt, 40);
  const rawDescription = typeof record?.description === "string" ? record.description.slice(0, 8_000) : null;
  const copy = explainHibpBreach(rawDescription, {
    name,
    recordCount: claimedRecordCount,
    dataTypes: dataTypesRaw,
    publishedAt: publishedAt ?? asString(record?.discoveredAt, 40),
  });
  return {
    id: asString(record?.id, 80) ?? `breach-${index}`,
    name,
    description: copy.summary,
    descriptionDetail: copy.detail,
    descriptionImplication: copy.implication,
    descriptionLinks: copy.links,
    source: sourceName(record?.source),
    sourceUrl: safeHttpUrl(record?.sourceUrl),
    verificationStatus: asString(record?.verificationStatus, 40),
    confidenceScore: asNumber(record?.confidenceScore),
    severity: asString(record?.severity, 40),
    dataTypes: translateDataClasses(dataTypesRaw),
    claimedRecordCount,
    discoveredAt: asString(record?.discoveredAt, 40),
    publishedAt,
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
    body: asMultiline(record?.body),
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

export function readAlertList(value: unknown): AlertView[] {
  return Array.isArray(value) ? value.map(mapAlert) : [];
}

export function readExposure(body: unknown): ExposureResult | null {
  const record = asRecord(body);
  if (typeof record?.exposed !== "boolean") return null;
  const count = asNumber(record.count) ?? 0;
  if (record.scope !== "full") return { scope: "summary", exposed: record.exposed, count };
  const rows = Array.isArray(record.data) ? record.data : [];
  const findings = rows.map((item, index): ExposureFinding => {
    const row = asRecord(item);
    const breach = asRecord(row?.breach);
    const name = asString(breach?.name, 160) ?? "Filtración sin nombre";
    const rawDataTypes = stringList(breach?.dataTypes);
    const dataTypes = translateDataClasses(rawDataTypes);
    const firstSeenAt = asString(breach?.firstSeenAt, 40);
    const rawDescription = typeof breach?.description === "string" ? breach.description.slice(0, 8_000) : null;
    const copy = explainHibpBreach(rawDescription, {
      name,
      recordCount: asNumber(breach?.claimedRecordCount),
      dataTypes: rawDataTypes,
      publishedAt: firstSeenAt,
    });
    return {
      key: asString(row?.id, 80) ?? `${name}-${index}`,
      rawDataTypes,
      subjectHint: asString(row?.subjectHint, 180),
      name,
      title: asString(breach?.title, 160) ?? name,
      description: copy.summary,
      descriptionDetail: copy.detail,
      descriptionImplication: copy.implication,
      source: sourceName(breach?.source),
      sourceUrl: safeHttpUrl(breach?.sourceUrl),
      dataTypes,
      firstSeenAt,
      isSensitive: breach?.isSensitive === true,
      isRetired: breach?.isRetired === true,
      verificationStatus: asString(breach?.verificationStatus, 40),
      confidenceScore: asNumber(breach?.confidenceScore),
      riskScore: asNumber(breach?.riskScore),
    };
  });
  const domainMode = record.domainMode === "catalog" || record.domainMode === "accounts" ? record.domainMode : null;
  return {
    scope: "full",
    access: record.access === "owner" ? "owner" : "catalog",
    domainMode,
    exposed: record.exposed,
    count,
    hiddenSensitive: asNumber(record.hiddenSensitive) ?? 0,
    persisted: record.persisted === true,
    findings,
  };
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
    stale: outer.stale === true,
    checkedAt: asString(record.updatedAt, 40),
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

function readMethod(value: unknown): ConfirmationMethod | null {
  return value === "ACCOUNT" || value === "EMAIL_LINK" || value === "ADMIN_AUTHORIZATION" || value === "DNS_TXT" ? value : null;
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
    confirmationMethod: readMethod(record.confirmationMethod),
    awaitingConfirmation: record.awaitingConfirmation === true,
    isAccountEmail: record.isAccountEmail === true,
    authorizationRequestedAt: asString(record.authorizationRequestedAt, 40),
    authorizationMessage: asString(record.authorizationMessage, 280),
    verifiedAt: asString(record.verifiedAt, 40),
    createdAt: asString(record.createdAt, 40),
  };
}

export function readTargets(body: unknown): MonitoringTarget[] {
  const data = dataOf(body);
  if (!Array.isArray(data)) return [];
  return data.map(mapTarget).filter((item): item is MonitoringTarget => Boolean(item));
}

export function readTargetsMeta(body: unknown): TargetsMeta {
  const meta = asRecord(asRecord(body)?.meta);
  return {
    mailerReady: meta?.mailerReady === true,
    accountEmailConfirmed: meta?.accountEmailConfirmed === true,
    accountEmailFollowed: meta?.accountEmailFollowed === true,
  };
}

/** Objetivo devuelto al crear, reactivar o verificar, con la instrucción de verificación si la hay. */
export function readCreatedTarget(body: unknown): { target: MonitoringTarget | null; verification: TargetVerification | null } {
  const data = asRecord(dataOf(body));
  const raw = asRecord(data?.verification);
  let verification: TargetVerification | null = null;
  const message = asString(raw?.message, 400) ?? "";
  if (raw?.method === "DNS_TXT") {
    const record = typeof raw.record === "string" && /^mercav-pwn=[A-Za-z0-9_-]{20,}$/.test(raw.record) ? raw.record : null;
    const host = asString(raw.host, 253);
    if (record && host) verification = { method: "DNS_TXT", host, record, message };
  } else if (raw?.method === "EMAIL_LINK") {
    verification = { method: "EMAIL_LINK", sent: raw.sent === true, message };
  } else if (raw?.method === "ADMIN_AUTHORIZATION") {
    verification = {
      method: "ADMIN_AUTHORIZATION",
      message: message || "Queda pendiente hasta que un administrador lo autorice.",
    };
  }
  return { target: mapTarget(data), verification };
}

export function readAuthQueue(body: unknown): MonitorAuthRequest[] {
  const data = dataOf(body);
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const target = mapTarget(item);
    if (!target) return [];
    const record = asRecord(item);
    const owner = asRecord(record?.owner);
    return [
      {
        ...target,
        owner: {
          id: asString(owner?.id, 80),
          name: asString(owner?.name, 120),
          email: asString(owner?.email, 254),
          username: asString(owner?.username, 80),
          emailConfirmed: owner?.emailConfirmed === true,
        },
        isOwnerAccountEmail: record?.isOwnerAccountEmail === true,
      },
    ];
  });
}

export function readAuthQueueMeta(body: unknown): { mailerReady: boolean } {
  return { mailerReady: asRecord(asRecord(body)?.meta)?.mailerReady === true };
}

export function readOrganizations(body: unknown): OrganizationView[] {
  const data = dataOf(body);
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const row = asRecord(item);
    const id = asString(row?.id, 80);
    const name = asString(row?.name, 120);
    if (!row || !id || !name) return [];
    return [
      {
        id,
        name,
        domain: asString(row.domain, 253),
        targetCount: asNumber(row.targetCount) ?? 0,
        createdAt: asString(row.createdAt, 40),
      },
    ];
  });
}

export function readReportHistory(body: unknown): Paged<ReportHistoryItem> {
  const data = dataOf(body);
  const items = Array.isArray(data)
    ? data.flatMap((item): ReportHistoryItem[] => {
        const row = asRecord(item);
        const id = asString(row?.id, 80);
        if (!row || !id) return [];
        const organization = asRecord(row.organization);
        const orgId = asString(organization?.id, 80);
        const orgName = asString(organization?.name, 120);
        return [
          {
            id,
            title: asString(row.title, 180) ?? "Informe sin título",
            summary: asString(row.summary, 2000),
            createdAt: asString(row.createdAt, 40),
            organization: orgId && orgName ? { id: orgId, name: orgName } : null,
          },
        ];
      })
    : [];
  return { items, pagination: readPagination(body) };
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
  const items = readSignalList(data.items);
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
          stealer: Number(statsRaw.stealer ?? 0) || 0,
          corporate: Number(statsRaw.corporate ?? 0) || 0,
          government: Number(statsRaw.government ?? 0) || 0,
          bolivia: Number(statsRaw.bolivia ?? 0) || 0,
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

function readSignalList(value: unknown): ForumSignalView[] {
  const itemsRaw = Array.isArray(value) ? value : [];
  return itemsRaw.flatMap((item): ForumSignalView[] => {
    const row = asRecord(item);
    const id = asString(row?.id, 80);
    const title = asString(row?.title, 500);
    const link = safeHttpUrl(row?.link);
    if (!id || !title || !link) return [];
    const kindRaw = asString(row?.signalKind, 20)?.toUpperCase();
    const signalKind: ForumSignalKind =
      kindRaw === "DATABASE" ||
      kindRaw === "STEALER" ||
      kindRaw === "CORPORATE" ||
      kindRaw === "CREDENTIALS" ||
      kindRaw === "MIXED"
        ? kindRaw
        : "OTHER";
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
        isBolivia: row?.isBolivia === true,
        breachName: asString(row?.breachName, 120),
        publishedAt: asString(row?.publishedAt, 40),
        lastSeenAt: asString(row?.lastSeenAt, 40),
        verificationStatus: asString(row?.verificationStatus, 40),
        source: asString(row?.source, 80),
      },
    ];
  });
}

export function readForumSync(body: unknown): {
  skipped: boolean;
  forced: boolean;
  lastFinishedAt: string | null;
  skipReason: "fresh" | "in_flight" | null;
  created: number;
  freshCount: number;
  freshSamples: { title: string; isBolivia: boolean }[];
  notified: boolean;
} | null {
  const data = asRecord(asRecord(body)?.data) ?? asRecord(body);
  if (!data) return null;
  const samplesRaw = Array.isArray(data.freshSamples)
    ? data.freshSamples
    : Array.isArray(data.newItems)
      ? data.newItems
      : [];
  const skipReason = data.skipReason === "fresh" || data.skipReason === "in_flight" ? data.skipReason : null;
  return {
    skipped: data.skipped === true,
    forced: data.forced === true,
    lastFinishedAt: asString(data.lastFinishedAt, 40),
    skipReason,
    created: Number(data.created ?? 0) || 0,
    freshCount: Number(data.freshCount ?? data.created ?? 0) || 0,
    notified: data.notified === true,
    freshSamples: samplesRaw.flatMap((item) => {
      const row = asRecord(item);
      const title = asString(row?.title, 500);
      if (!title) return [];
      return [{ title, isBolivia: row?.isBolivia === true }];
    }),
  };
}

/** Respuesta de /api/pwn/summary: todo el resumen del panel en una llamada. */
export function readSummary(body: unknown): SummaryView | null {
  const data = asRecord(dataOf(body));
  const verdict = asRecord(data?.verdict);
  const counts = asRecord(data?.counts);
  if (!data || !verdict || !counts) return null;
  const tone = verdict.tone === "exposed" || verdict.tone === "clean" ? verdict.tone : "idle";
  const count = (value: unknown) => asNumber(value) ?? 0;
  return {
    verdict: { tone, unreadAlerts: count(verdict.unreadAlerts), provenTargets: count(verdict.provenTargets) },
    counts: {
      targets: count(counts.targets),
      provenTargets: count(counts.provenTargets),
      activeProvenTargets: count(counts.activeProvenTargets),
      pendingTargets: count(counts.pendingTargets),
      exposures: count(counts.exposures),
      alerts: count(counts.alerts),
      unreadAlerts: count(counts.unreadAlerts),
    },
    recentAlerts: readAlertList(data.recentAlerts),
    signals: readSignalList(data.signals),
    verifiedIntel: Array.isArray(data.verifiedIntel)
      ? data.verifiedIntel.flatMap((item) => {
          const row = asRecord(item);
          const id = asString(row?.id, 80);
          const name = asString(row?.name, 160);
          if (!row || !id || !name) return [];
          return [
            {
              id,
              name,
              sourceUrl: safeHttpUrl(row.sourceUrl),
              publishedAt: asString(row.publishedAt, 40),
              source: asString(row.source, 80),
            },
          ];
        })
      : [],
  };
}

export function isCriticalLevel(value: string | null | undefined): boolean {
  if (!value) return false;
  return /crit/i.test(value);
}
// creado por pato dev y askforvini
