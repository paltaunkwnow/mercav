"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  pwnFetch,
  readCreatedTarget,
  readOrganizations,
  readTargets,
  readTargetsMeta,
  type MonitoringTarget,
  type OrganizationView,
  type TargetVerification,
  type TargetsMeta,
} from "@/components/pwn/api";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls, pageWindow } from "@/components/pwn/ListControls";
import {
  formatWhen,
  pwnCardClass,
  pwnFieldClass,
  pwnFieldLabelClass,
  pwnInsetClass,
  pwnPanelClass,
  pwnWarnToneClass,
  pwnAlertToneClass,
} from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnSectionHeading, pwnErrorTextClass } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { PwnSelect } from "@/components/pwn/PwnSelect";
import { usePwnSession } from "@/components/pwn/session";
import { Check, Copy, Mail } from "@/components/icons";
import {
  MONITOR_AUTH_MESSAGE_MAX,
  canRequestMonitorAuthorization,
  monitorAuthBadge,
  monitorAuthHint,
} from "@/lib/pwn/monitor-authorization";

type TargetType = "email" | "domain";

const TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: "email", label: "Correo" },
  { value: "domain", label: "Dominio" },
];

const TYPE_LABEL: Record<string, string> = { EMAIL: "Correo", DOMAIN: "Dominio", IP: "IP", CVE: "CVE" };

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

// Radix Select no acepta "" como valor: "none" es "sin organización".
const NO_ORG = "none";

const BADGE_CLASS: Record<string, string> = {
  ok: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold",
  waiting: `border-dashed ${pwnWarnToneClass}`,
  denied: pwnAlertToneClass,
  pending: "border-dashed border-[var(--text-tertiary)] bg-transparent text-[var(--text-secondary)]",
};

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: MonitoringTarget[]; meta: TargetsMeta };

type Flash = { text: string; tone: "error" | "ok" | "neutral" };

export type FollowOutcome = { target: MonitoringTarget | null; verification: TargetVerification | null };

function normalize(value: string, type: TargetType) {
  const trimmed = value.trim().toLowerCase();
  return type === "domain" ? trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "") : trimmed;
}

function validate(value: string, type: TargetType) {
  if (!value) return "Escribí un objetivo.";
  if (type === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254)) return "El correo no es válido.";
  if (type === "domain" && !DOMAIN_RE.test(value)) return "El dominio no es válido.";
  return null;
}

/** "ana@empresa.com" → "a***@e***", como lo guarda el servidor (sin importar node:crypto en el cliente). */
function maskEmail(email: string): string {
  const value = email.trim();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return "***";
  return `${value[0]}***@${value[at + 1]}***`;
}

function statusRank(status: string) {
  if (status === "REQUESTED") return 0;
  if (status === "PENDING" || status === "DENIED") return 1;
  return 2;
}

/** Texto para avisar qué pasó después de seguir un objetivo. */
export function followMessage(outcome: FollowOutcome): string {
  if (outcome.target?.verificationStatus === "VERIFIED") {
    return "Quedó verificado: ya ves el detalle y el patrullaje puede generar alertas.";
  }
  const verification = outcome.verification;
  if (!verification) return "Quedó en seguimiento.";
  if (verification.method === "DNS_TXT") return "Quedó en seguimiento. En la lista de objetivos tenés el registro DNS para verificarlo.";
  return verification.message;
}

/**
 * Objetivos que sigue la cuenta. Cada uno muestra cómo se prueba que es tuyo:
 * el correo de la cuenta confirmada se verifica solo; otro correo, con el enlace que llega al buzón
 * (o un administrador si este entorno no envía correos); un dominio, con un registro DNS TXT.
 */
export function WatchTargets({
  refresh = 0,
  seed = null,
  lastFollow = null,
  onVerified,
}: {
  refresh?: number;
  seed?: { type: TargetType; query: string } | null;
  lastFollow?: FollowOutcome | null;
  onVerified?: () => void;
}) {
  const session = usePwnSession();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [organizations, setOrganizations] = useState<OrganizationView[]>([]);
  const [target, setTarget] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("email");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Flash | null>(null);
  const [saving, setSaving] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [authNote, setAuthNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<Record<string, Flash>>({});
  const [dnsRecords, setDnsRecords] = useState<Record<string, { host: string; record: string }>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const loadController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    const [response, orgs] = await Promise.all([
      pwnFetch("/api/pwn/monitoring", { signal: controller.signal }),
      pwnFetch("/api/pwn/organizations", { signal: controller.signal }),
    ]);
    if (controller.signal.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      setStatus(
        response.reason === "disabled"
          ? { kind: "disabled" }
          : response.reason === "unauthorized"
            ? { kind: "unauthorized" }
            : { kind: "error", message: response.message },
      );
      return;
    }
    setOrganizations(orgs.ok ? readOrganizations(orgs.data) : []);
    setStatus({ kind: "ready", items: readTargets(response.data), meta: readTargetsMeta(response.data) });
  }, []);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    void load();
    return () => loadController.current?.abort();
  }, [load, refresh, session.status]);

  useEffect(() => {
    if (!seed?.query) return;
    setTargetType(seed.type);
    setTarget(seed.query);
  }, [seed]);

  // El registro DNS solo se ve una vez: lo guardamos mientras la página esté abierta.
  const rememberVerification = useCallback((outcome: FollowOutcome) => {
    const verification = outcome.verification;
    const id = outcome.target?.id;
    if (!id || verification?.method !== "DNS_TXT") return;
    setDnsRecords((current) => ({ ...current, [id]: { host: verification.host, record: verification.record } }));
  }, []);

  useEffect(() => {
    if (lastFollow) rememberVerification(lastFollow);
  }, [lastFollow, rememberVerification]);

  function setItemFlash(id: string, next: Flash | null) {
    setFlash((current) => {
      const copy = { ...current };
      if (next) copy[id] = next;
      else delete copy[id];
      return copy;
    });
  }

  async function follow(type: TargetType, value: string): Promise<FollowOutcome | null> {
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "POST",
      body: JSON.stringify({ type, query: value }),
    });
    if (!response.ok) {
      if (response.reason === "unauthorized") setStatus({ kind: "unauthorized" });
      else if (response.reason === "disabled") setStatus({ kind: "disabled" });
      else setNotice({ text: response.message, tone: "error" });
      return null;
    }
    const outcome = readCreatedTarget(response.data);
    rememberVerification(outcome);
    const failedMail = outcome.verification?.method === "EMAIL_LINK" && !outcome.verification.sent;
    setNotice({ text: followMessage(outcome), tone: failedMail ? "neutral" : "ok" });
    if (outcome.target?.verificationStatus === "VERIFIED") onVerified?.();
    await load();
    return outcome;
  }

  async function createTarget() {
    const value = normalize(target, targetType);
    const error = validate(value, targetType);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setNotice(null);
    setSaving(true);
    const outcome = await follow(targetType, value);
    setSaving(false);
    if (outcome) setTarget("");
  }

  async function followAccountEmail() {
    if (!session.email) return;
    setOnboarding(true);
    setNotice(null);
    await follow("email", session.email.trim().toLowerCase());
    setOnboarding(false);
  }

  async function requestAuthorization(item: MonitoringTarget) {
    setBusy(`auth:${item.id}`);
    setItemFlash(item.id, null);
    const response = await pwnFetch("/api/pwn/monitoring/authorize", {
      method: "POST",
      body: JSON.stringify({ id: item.id, message: authNote[item.id]?.trim() || undefined }),
    });
    setBusy(null);
    if (!response.ok) {
      if (response.reason === "unauthorized") {
        setStatus({ kind: "unauthorized" });
        return;
      }
      setItemFlash(item.id, { text: response.message, tone: "error" });
      return;
    }
    setItemFlash(item.id, { text: "Solicitud enviada. Un administrador la va a revisar.", tone: "ok" });
    await load();
  }

  async function dnsAction(item: MonitoringTarget, action: "issue" | "check") {
    setBusy(`dns:${item.id}`);
    setItemFlash(item.id, null);
    const response = await pwnFetch("/api/pwn/monitoring/verify", {
      method: "POST",
      body: JSON.stringify({ id: item.id, action }),
    });
    setBusy(null);
    if (!response.ok) {
      setItemFlash(item.id, { text: response.message, tone: action === "check" ? "neutral" : "error" });
      return;
    }
    const outcome = readCreatedTarget(response.data);
    rememberVerification(outcome);
    if (outcome.target?.verificationStatus === "VERIFIED") {
      setItemFlash(item.id, { text: "Dominio verificado. Desde ahora el patrullaje lo revisa cada hora.", tone: "ok" });
      setDnsRecords((current) => {
        const copy = { ...current };
        delete copy[item.id];
        return copy;
      });
      onVerified?.();
      await load();
      return;
    }
    if (outcome.verification?.method === "DNS_TXT") setItemFlash(item.id, { text: outcome.verification.message, tone: "neutral" });
  }

  async function copyRecord(id: string, record: string) {
    try {
      await navigator.clipboard.writeText(record);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 2_000);
    } catch {
      setItemFlash(id, { text: "No se pudo copiar. Seleccioná el texto y copialo a mano.", tone: "neutral" });
    }
  }

  async function patchTarget(item: MonitoringTarget, body: { active?: boolean; organizationId?: string | null }) {
    setBusy(`patch:${item.id}`);
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "PATCH",
      body: JSON.stringify({ id: item.id, ...body }),
    });
    setBusy(null);
    if (!response.ok) {
      setItemFlash(item.id, { text: response.message, tone: "error" });
      return;
    }
    await load();
  }

  async function removeTarget(item: MonitoringTarget) {
    setBusy(`delete:${item.id}`);
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "DELETE",
      body: JSON.stringify({ id: item.id }),
    });
    setBusy(null);
    setConfirmDelete(null);
    if (!response.ok) {
      setItemFlash(item.id, { text: response.message, tone: "error" });
      return;
    }
    setNotice({ text: `Dejaste de seguir ${item.targetLookup ?? item.targetDisplay}.`, tone: "neutral" });
    await load();
  }

  const visible = useMemo(() => {
    if (status.kind !== "ready") return [];
    const q = query.trim().toLowerCase();
    const filtered = status.items.filter((item) => {
      if (!q) return true;
      return `${item.targetDisplay} ${item.targetLookup ?? ""} ${TYPE_LABEL[item.targetType] ?? item.targetType}`.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.targetDisplay.localeCompare(b.targetDisplay, "es");
      if (sort === "pending") return statusRank(a.verificationStatus) - statusRank(b.verificationStatus);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [status, query, sort]);

  const windowed = pageWindow(visible, page);
  const orgOptions = [{ value: NO_ORG, label: "Sin organización" }, ...organizations.map((org) => ({ value: org.id, label: org.name }))];
  const showOnboarding =
    status.kind === "ready" && !status.meta.accountEmailFollowed && Boolean(session.email);

  return (
    <section className="space-y-6" aria-labelledby="watch-title">
      <PwnSectionHeading
        id="watch-title"
        title="Objetivos que seguís"
        lead="Para ver el detalle y recibir alertas, cada objetivo tiene que ser tuyo: el correo de tu cuenta confirmada se verifica solo, otro correo con un enlace que llega a ese buzón y un dominio con un registro DNS TXT."
      />

      {session.status === "loading" ? <LoadingState label="Cargando objetivos…" /> : null}
      {session.status === "unauthenticated" || status.kind === "unauthorized" ? (
        <UnauthorizedState callbackPath="/pwn/exposure" description="Iniciá sesión para seguir correos y dominios y recibir alertas." />
      ) : null}

      {session.status === "authenticated" ? (
        <>
          {status.kind === "loading" ? <LoadingState label="Cargando objetivos…" /> : null}
          {status.kind === "disabled" ? <DisabledState title="Seguimiento no configurado" /> : null}
          {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load()} /> : null}

          {status.kind === "ready" ? (
            <>
              {showOnboarding ? (
                <div className={`${pwnPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.875rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                      <Mail className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">Empezá por tu correo</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        <span className="mv-data">{maskEmail(session.email ?? "")}</span>
                        {status.meta.accountEmailConfirmed
                          ? " ya está confirmado en tu cuenta: queda verificado al seguirlo."
                          : status.meta.mailerReady
                            ? " todavía no está confirmado: te mandamos un enlace para confirmarlo."
                            : " todavía no está confirmado y este entorno no envía correos: vas a poder pedir autorización a un administrador."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={onboarding}
                    onClick={() => void followAccountEmail()}
                    className={buttonClass("primary", "md", "w-full shrink-0 sm:w-auto")}
                  >
                    {onboarding ? "Siguiendo…" : "Seguir mi correo"}
                  </button>
                </div>
              ) : null}

              <form
                className={`space-y-5 ${pwnPanelClass}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  void createTarget();
                }}
              >
                <h3 className="mv-h3 text-lg">Seguir otro objetivo</h3>
                <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <label htmlFor="monitor-type" className={pwnFieldLabelClass}>
                      Tipo
                    </label>
                    <PwnSelect
                      id="monitor-type"
                      value={targetType}
                      onValueChange={(value) => {
                        setTargetType(value as TargetType);
                        queueMicrotask(() => document.getElementById("monitor-target")?.focus());
                      }}
                      options={TYPE_OPTIONS}
                      aria-label="Tipo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="monitor-target" className={pwnFieldLabelClass}>
                      {targetType === "domain" ? "Dominio" : "Dirección de correo"}
                    </label>
                    <input
                      id="monitor-target"
                      className={pwnFieldClass}
                      value={target}
                      onChange={(event) => setTarget(event.target.value)}
                      placeholder={targetType === "domain" ? "empresa.com" : "ana@empresa.com"}
                      type={targetType === "email" ? "email" : "text"}
                      autoComplete="off"
                      aria-invalid={formError ? true : undefined}
                      aria-describedby="monitor-target-hint"
                    />
                  </div>
                </div>
                <p id="monitor-target-hint" className="text-xs leading-relaxed text-[var(--text-tertiary)]">
                  {targetType === "email"
                    ? status.meta.mailerReady
                      ? "Te mandamos un enlace a ese correo: abrilo con esta cuenta para confirmar que es tuyo. Los correos se revisan cada vez que los consultás; el monitoreo automático es para dominios."
                      : "Este entorno no envía correos de confirmación: un administrador autoriza el seguimiento. Los correos se revisan cada vez que los consultás; el monitoreo automático es para dominios."
                    : "Te damos un registro TXT para el DNS del dominio. Cuando lo verifiquemos, el patrullaje lo revisa cada hora y te avisa."}
                </p>
                {formError ? (
                  <p role="alert" className={pwnErrorTextClass}>
                    {formError}
                  </p>
                ) : null}
                <button type="submit" disabled={saving} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
                  {saving ? "Guardando…" : "Seguir objetivo"}
                </button>
              </form>

              {notice ? <PwnNotice tone={notice.tone}>{notice.text}</PwnNotice> : null}

              {status.items.length === 0 ? (
                <EmptyState
                  title="Todavía no seguís ningún objetivo"
                  description="Después de consultar, podés seguir el correo o el dominio acá para ver el detalle y recibir alertas."
                />
              ) : (
                <>
                  <ListControls
                    query={query}
                    onQuery={(value) => {
                      setQuery(value);
                      setPage(1);
                    }}
                    queryLabel="Buscar objetivo"
                    sort={sort}
                    onSort={(value) => {
                      setSort(value);
                      setPage(1);
                    }}
                    sortOptions={[
                      { value: "recent", label: "Más recientes" },
                      { value: "pending", label: "Pendientes primero" },
                      { value: "name", label: "Nombre" },
                    ]}
                    page={windowed.page}
                    pages={windowed.pages}
                    total={windowed.total}
                    onPage={setPage}
                  />
                  {windowed.total === 0 ? <EmptyState title="Ningún objetivo coincide" /> : null}
                  <ul className="space-y-3">
                    {windowed.slice.map((item) => (
                      <TargetCard
                        key={item.id}
                        item={item}
                        orgOptions={orgOptions}
                        busy={busy}
                        flash={flash[item.id] ?? null}
                        dns={dnsRecords[item.id] ?? null}
                        copied={copied === item.id}
                        confirmingDelete={confirmDelete === item.id}
                        note={authNote[item.id] ?? ""}
                        onNote={(value) => setAuthNote((current) => ({ ...current, [item.id]: value }))}
                        onRequestAuthorization={() => void requestAuthorization(item)}
                        onDns={(action) => void dnsAction(item, action)}
                        onCopy={(record) => void copyRecord(item.id, record)}
                        onToggleActive={() => void patchTarget(item, { active: !item.active })}
                        onOrganization={(value) => void patchTarget(item, { organizationId: value === NO_ORG ? null : value })}
                        onAskDelete={() => setConfirmDelete(item.id)}
                        onCancelDelete={() => setConfirmDelete(null)}
                        onDelete={() => void removeTarget(item)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function TargetCard({
  item,
  orgOptions,
  busy,
  flash,
  dns,
  copied,
  confirmingDelete,
  note,
  onNote,
  onRequestAuthorization,
  onDns,
  onCopy,
  onToggleActive,
  onOrganization,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  item: MonitoringTarget;
  orgOptions: { value: string; label: string }[];
  busy: string | null;
  flash: Flash | null;
  dns: { host: string; record: string } | null;
  copied: boolean;
  confirmingDelete: boolean;
  note: string;
  onNote: (value: string) => void;
  onRequestAuthorization: () => void;
  onDns: (action: "issue" | "check") => void;
  onCopy: (record: string) => void;
  onToggleActive: () => void;
  onOrganization: (value: string) => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const display = item.targetLookup ?? item.targetDisplay;
  const verified = item.verificationStatus === "VERIFIED";
  const badge = monitorAuthBadge(item.verificationStatus, item.targetType);
  const hint = monitorAuthHint(item.verificationStatus, item.targetType, item.confirmationMethod, item.isAccountEmail);
  const canRequest =
    item.targetType === "EMAIL" &&
    !verified &&
    item.confirmationMethod === "ADMIN_AUTHORIZATION" &&
    canRequestMonitorAuthorization(item.verificationStatus);
  const isDomainPending = item.targetType === "DOMAIN" && !verified;
  const isMailPending = item.targetType === "EMAIL" && !verified && item.confirmationMethod === "EMAIL_LINK";
  const orgSelectId = `target-org-${item.id}`;

  return (
    <li className={`${pwnCardClass} ${verified ? "" : "border-dashed !border-[var(--mv-hairline-strong)]"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-tertiary)]">
            {TYPE_LABEL[item.targetType] ?? item.targetType}
            {item.isAccountEmail ? " · el de tu cuenta" : ""}
          </p>
          <h3 className="mv-data mt-1 break-all text-base text-[var(--text-primary)] md:text-lg">{display}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${BADGE_CLASS[badge.tone]}`}>
            {badge.label}
          </span>
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--mv-hairline-strong)] px-2.5 text-[11px] font-semibold text-[var(--text-secondary)]">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-gold" : "bg-[var(--text-tertiary)]"}`} />
            {item.active ? "Activo" : "Pausado"}
          </span>
        </div>
      </div>
      {hint ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{hint}</p> : null}

      {isDomainPending ? (
        <div className="mt-4 space-y-3">
          {dns ? (
            <div className={`${pwnInsetClass} space-y-2`}>
              <p className="text-xs text-[var(--text-tertiary)]">
                Registro TXT en <span className="mv-data text-[var(--text-secondary)]">{dns.host}</span> (nombre del registro: @ o el dominio raíz)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="mv-data min-w-0 flex-1 select-all break-all text-sm text-[var(--text-primary)]">{dns.record}</code>
                <button
                  type="button"
                  onClick={() => onCopy(dns.record)}
                  aria-label={`Copiar el registro TXT de ${display}`}
                  className={buttonClass("ghost", "sm", "min-h-11 w-full sm:w-auto")}
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {item.awaitingConfirmation ? (
              <button
                type="button"
                disabled={busy === `dns:${item.id}`}
                onClick={() => onDns("check")}
                aria-label={`Comprobar el DNS de ${display}`}
                className={buttonClass("primary", "sm", "min-h-11 flex-1 sm:flex-none")}
              >
                {busy === `dns:${item.id}` ? "Comprobando…" : "Comprobar"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy === `dns:${item.id}`}
              onClick={() => onDns("issue")}
              aria-label={`${dns || item.awaitingConfirmation ? "Generar un registro nuevo" : "Ver el registro DNS"} para ${display}`}
              className={buttonClass("secondary", "sm", "min-h-11 flex-1 sm:flex-none")}
            >
              {dns || item.awaitingConfirmation ? "Generar un registro nuevo" : "Ver el registro DNS"}
            </button>
          </div>
        </div>
      ) : null}

      {isMailPending ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
          ¿No te llegó? Revisá el spam. Para recibir otro enlace, volvé a seguir el correo escribiéndolo arriba: de ese correo guardamos solo un hash, no la dirección.
        </p>
      ) : null}

      <MetaGrid className="lg:grid-cols-3">
        <Meta label="Creado">{formatWhen(item.createdAt) ?? "No indicado"}</Meta>
        <Meta label={verified ? "Verificado" : item.confirmationMethod === "ADMIN_AUTHORIZATION" ? "Autorización" : "Verificación"}>
          {verified
            ? (formatWhen(item.verifiedAt) ?? "Sí")
            : item.confirmationMethod === "ADMIN_AUTHORIZATION"
              ? (formatWhen(item.authorizationRequestedAt) ?? "Sin solicitar")
              : "Pendiente"}
        </Meta>
        <div className="min-w-0 space-y-1">
          <label htmlFor={orgSelectId} className="block text-xs text-[var(--text-tertiary)]">
            Organización
          </label>
          <PwnSelect
            id={orgSelectId}
            value={item.organizationId ?? NO_ORG}
            onValueChange={onOrganization}
            options={orgOptions}
            disabled={busy === `patch:${item.id}`}
            aria-label={`Organización de ${display}`}
          />
        </div>
      </MetaGrid>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy === `patch:${item.id}`}
          className={buttonClass("secondary", "sm", "min-h-11 flex-1 sm:flex-none")}
          onClick={onToggleActive}
          aria-label={`${item.active ? "Pausar" : "Reanudar"} ${display}`}
        >
          {item.active ? "Pausar" : "Reanudar"}
        </button>
        {confirmingDelete ? null : (
          <button
            type="button"
            className={buttonClass("ghost", "sm", "min-h-11 flex-1 text-[var(--p-alert)] sm:flex-none")}
            onClick={onAskDelete}
            aria-label={`Eliminar ${display}`}
          >
            Eliminar
          </button>
        )}
      </div>

      {confirmingDelete ? (
        <div role="alertdialog" aria-labelledby={`delete-${item.id}`} className={`mt-3 ${pwnInsetClass} space-y-3`}>
          <p id={`delete-${item.id}`} className="text-sm text-[var(--text-primary)]">
            ¿Dejar de seguir <span className="mv-data">{display}</span>? Se pierde su verificación; las alertas que ya recibiste siguen en Alertas.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === `delete:${item.id}`}
              onClick={onDelete}
              className={buttonClass("secondary", "sm", "min-h-11 flex-1 text-[var(--p-alert)] sm:flex-none")}
            >
              {busy === `delete:${item.id}` ? "Eliminando…" : "Sí, eliminar"}
            </button>
            <button type="button" onClick={onCancelDelete} className={buttonClass("ghost", "sm", "min-h-11 flex-1 sm:flex-none")}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {canRequest ? (
        <form
          className="mt-5 space-y-3 border-t border-[var(--mv-hairline)] pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            onRequestAuthorization();
          }}
        >
          <div className="space-y-2">
            <label htmlFor={`auth-note-${item.id}`} className={pwnFieldLabelClass}>
              Nota para el administrador (opcional)
            </label>
            <textarea
              id={`auth-note-${item.id}`}
              className={`${pwnFieldClass} h-auto min-h-[5.5rem] py-3 leading-relaxed`}
              value={note}
              maxLength={MONITOR_AUTH_MESSAGE_MAX}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Por qué necesitás seguir este correo y de quién es"
            />
          </div>
          <button
            type="submit"
            disabled={busy === `auth:${item.id}`}
            aria-label={`Pedir autorización para ${display}`}
            className={buttonClass("primary", "sm", "min-h-11 w-full sm:w-auto")}
          >
            {busy === `auth:${item.id}` ? "Enviando…" : "Pedir autorización"}
          </button>
        </form>
      ) : null}

      {flash ? (
        <div className="mt-3">
          <PwnNotice tone={flash.tone}>{flash.text}</PwnNotice>
        </div>
      ) : null}
    </li>
  );
}
// creado por pato dev y askforvini
