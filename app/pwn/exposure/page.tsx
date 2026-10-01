"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  countLocalSuffix,
  pwnFetch,
  readExposure,
  readPasswordRange,
  type ExposureFinding,
} from "@/components/pwn/api";
import { sha1Hex } from "@/components/pwn/password";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge, VerificationBadge, verificationMeta } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { NextSteps } from "@/components/pwn/NextSteps";
import { RecentLookups, rememberLookup } from "@/components/pwn/RecentLookups";
import { WatchTargets } from "@/components/pwn/WatchTargets";
import { formatScore, formatWhen, pwnCardClass, pwnPanelClass, pwnTagClass, pwnUnverifiedCardClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { KeyRound } from "lucide-react";

type QueryType = "email" | "domain";

type ExposureState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ready"; exposed: boolean; persisted: boolean; findings: ExposureFinding[] };

type PasswordState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "error"; message: string }
  | { kind: "ready"; count: number };

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validDomain(value: string) {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value);
}

export default function ExposurePage() {
  const params = useSearchParams();
  const started = useRef(false);
  const [type, setType] = useState<QueryType>("email");
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [exposure, setExposure] = useState<ExposureState>({ kind: "idle" });
  const [password, setPassword] = useState("");
  const [passwordState, setPasswordState] = useState<PasswordState>({ kind: "idle" });
  const [watchTick, setWatchTick] = useState(0);
  const [watchSeed, setWatchSeed] = useState<{ type: QueryType; query: string } | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followMessage, setFollowMessage] = useState<string | null>(null);

  async function runSearch(nextType: QueryType, raw: string) {
    const value = nextType === "email" ? raw.trim().toLowerCase() : normalizeDomain(raw);
    if (nextType === "email" && !validEmail(value)) {
      setFormError("Escribí un correo válido.");
      return;
    }
    if (nextType === "domain" && !validDomain(value)) {
      setFormError("Escribí un dominio válido, por ejemplo empresa.com.");
      return;
    }
    setFormError(null);
    setExposure({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/exposure", {
      method: "POST",
      body: JSON.stringify({ type: nextType, query: value }),
    });
    if (!response.ok) {
      if (response.reason === "aborted") return;
      if (response.reason === "disabled") setExposure({ kind: "disabled" });
      else if (response.reason === "unauthorized") {
        setExposure({ kind: "error", message: "Iniciá sesión para hacer esta consulta." });
      } else setExposure({ kind: "error", message: response.message });
      return;
    }
    const result = readExposure(response.data);
    if (!result) {
      setExposure({ kind: "error", message: "La respuesta de exposición no tiene el formato esperado." });
      return;
    }
    rememberLookup(nextType, value);
    setWatchSeed({ type: nextType, query: value });
    if (result.scope !== "full") {
      setExposure(result.exposed ? { kind: "ready", exposed: true, persisted: false, findings: [] } : { kind: "empty" });
      return;
    }
    setExposure(
      result.findings.length || result.exposed
        ? { kind: "ready", exposed: result.exposed, persisted: result.persisted, findings: result.findings }
        : { kind: "empty" },
    );
  }

  useEffect(() => {
    if (started.current) return;
    let nextType = params?.get("type") ?? null;
    let nextQuery = params?.get("query") ?? null;
    if (!nextQuery) {
      try {
        const stored = sessionStorage.getItem("mercav-pwn-exposure");
        if (stored) {
          sessionStorage.removeItem("mercav-pwn-exposure");
          const parsed = JSON.parse(stored) as { type?: string; query?: string };
          if (parsed.query && (parsed.type === "email" || parsed.type === "domain")) {
            nextType = parsed.type;
            nextQuery = parsed.query;
          }
        }
      } catch {
        nextQuery = null;
      }
    }
    if ((nextType === "email" || nextType === "domain") && nextQuery) {
      started.current = true;
      setType(nextType);
      setQuery(nextQuery);
      void runSearch(nextType, nextQuery);
    }
  }, [params]);

  async function checkPassword() {
    const secret = password;
    setPassword("");
    setPasswordState({ kind: "idle" });
    if (!secret) {
      setPasswordState({ kind: "error", message: "Escribí una contraseña para comprobarla." });
      return;
    }
    if (secret.length > 1024) {
      setPasswordState({ kind: "error", message: "La contraseña supera el límite de comprobación." });
      return;
    }
    setPasswordState({ kind: "loading" });
    try {
      const hash = await sha1Hex(secret);
      const response = await pwnFetch("/api/pwn/passwords/range", {
        method: "POST",
        body: JSON.stringify({ prefix: hash.slice(0, 5) }),
      });
      if (!response.ok) {
        setPasswordState(response.reason === "disabled" ? { kind: "disabled" } : { kind: "error", message: response.message || "No se pudo consultar el rango." });
        return;
      }
      const range = readPasswordRange(response.data);
      if (!range) {
        setPasswordState({ kind: "error", message: "La respuesta no incluye sufijos para comparar en el navegador." });
        return;
      }
      setPasswordState({ kind: "ready", count: countLocalSuffix(hash, range) });
    } catch (error) {
      const secure = error instanceof Error && error.message === "SECURE_CONTEXT";
      setPasswordState({
        kind: "error",
        message: secure
          ? "La comprobación necesita un contexto seguro (HTTPS) para calcular el hash en el navegador."
          : "No se pudo comprobar la contraseña en este navegador.",
      });
    }
  }

  async function followCurrent() {
    const value = type === "email" ? query.trim().toLowerCase() : normalizeDomain(query);
    setFollowMessage(null);
    setFollowBusy(true);
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "POST",
      body: JSON.stringify({ type, query: value }),
    });
    setFollowBusy(false);
    if (!response.ok) {
      setFollowMessage(response.reason === "unauthorized" ? "Iniciá sesión para seguir este objetivo." : response.message);
      return;
    }
    setFollowMessage("Añadido a seguimiento.");
    setWatchTick((current) => current + 1);
  }

  return (
    <FadeIn className="space-y-10 md:space-y-12">
      <PwnPageHeader
        kicker="Exposición"
        title="¿Dónde aparece este correo o dominio?"
        lead="Consultá un correo o un dominio y, si querés alertas, seguilo en esta misma página. No hace falta demostrar que te pertenece para ver los casos. Solo un correo distinto al de tu cuenta pide autorización para el patrullaje."
      />

      <section aria-label="Consultar exposición" className="liquid-glass rounded-[1.75rem] p-4 sm:p-5 md:p-7">
        <fieldset className="mb-5">
          <legend className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Tipo de consulta</legend>
          <div className="inline-flex w-full rounded-full border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] p-1 sm:w-auto">
            {(
              [
                ["email", "Correo"],
                ["domain", "Dominio"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`relative inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full px-5 text-sm font-medium transition-[background-color,color] duration-200 has-[:focus-visible]:shadow-[0_0_0_2px_var(--color-gold)] sm:flex-none ${
                  type === value
                    ? "bg-[var(--mv-gold-wash)] text-gold shadow-[inset_0_0_0_1px_var(--color-border-gold)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <input
                  type="radio"
                  name="exposure-type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <SearchForm
          id="exposure-query"
          label={type === "email" ? "Correo" : "Dominio"}
          type={type === "email" ? "email" : "text"}
          value={query}
          onChange={setQuery}
          onSubmit={() => void runSearch(type, query)}
          placeholder={type === "email" ? "ana@empresa.com" : "empresa.com"}
          submitLabel={exposure.kind === "loading" ? "Consultando…" : "Analizar"}
          disabled={exposure.kind === "loading"}
          error={formError}
          autoComplete="off"
        />
      </section>

      <ExposureResults
        state={exposure}
        queryType={type}
        onRetry={() => void runSearch(type, query)}
        onFollow={() => void followCurrent()}
        followBusy={followBusy}
        followMessage={followMessage}
      />

      <RecentLookups />

      <WatchTargets refresh={watchTick} seed={watchSeed} />

      <section className={pwnPanelClass} aria-labelledby="password-check-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="password-check-title" className="mv-h3">
              Comprobación de contraseña
            </h2>
            <p className="mv-body mt-1 max-w-2xl">
              El hash se calcula en este navegador. Solo se envían los primeros cinco caracteres hexadecimales y el sufijo se compara acá. El campo se vacía al enviar.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <SearchForm
            id="password-check"
            name="pwn-password-check"
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            onSubmit={() => void checkPassword()}
            submitLabel={passwordState.kind === "loading" ? "Comprobando…" : "Comprobar"}
            disabled={passwordState.kind === "loading"}
            autoComplete="new-password"
            hint="No se guarda ni se muestra después de enviarla."
          />
        </div>
        <div className="mt-5" aria-live="polite">
          <PasswordResult state={passwordState} />
        </div>
      </section>
    </FadeIn>
  );
}

function ExposureResults({
  state,
  queryType,
  onRetry,
  onFollow,
  followBusy,
  followMessage,
}: {
  state: ExposureState;
  queryType: QueryType;
  onRetry: () => void;
  onFollow: () => void;
  followBusy: boolean;
  followMessage: string | null;
}) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <LoadingState label="Consultando exposición…" />;
  if (state.kind === "disabled") return <DisabledState title="Búsqueda no configurada" />;
  if (state.kind === "error") return <ErrorState message={state.message} onRetry={onRetry} />;
  if (state.kind === "empty") {
    return (
      <div className="space-y-4">
        <EmptyState title="Sin exposiciones en esta consulta" description="Las fuentes consultadas no devolvieron exposiciones para este correo o dominio." />
        <FollowButton busy={followBusy} message={followMessage} onFollow={onFollow} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-[var(--text-secondary)]">
        {state.exposed ? "Hay exposición confirmada por la fuente." : "La fuente solo devolvió registros en disputa."}
        {state.persisted ? " Los resultados se guardaron en tu seguimiento." : ""}
      </p>
      <ul className="space-y-4">
        {state.findings.map((finding) => {
          const verification = verificationMeta(finding.verificationStatus);
          const status = (finding.verificationStatus ?? "").toUpperCase();
          const dashed = status === "UNVERIFIED" || status === "DISPUTED";
          return (
            <li key={finding.key} className={`${pwnCardClass} ${dashed ? pwnUnverifiedCardClass : ""}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="mv-h3">{finding.title}</h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  <VerificationBadge status={finding.verificationStatus} />
                  {finding.isSensitive ? <span className={pwnTagClass}>Sensible</span> : null}
                  {finding.isRetired ? <span className={pwnTagClass}>Retirada</span> : null}
                </div>
              </div>
              {verification?.note ? <p className="mt-3 text-sm text-[var(--text-primary)]">{verification.note}</p> : null}
              {finding.description ? <p className="mv-body mt-3">{finding.description}</p> : null}
              {finding.descriptionDetail ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{finding.descriptionDetail}</p> : null}
              {finding.descriptionImplication ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{finding.descriptionImplication}</p> : null}
              {finding.subjectHint ? <p className="mv-data mt-4 text-sm text-[var(--text-primary)]">{finding.subjectHint}</p> : null}
              {finding.dataTypes.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tipos de dato expuestos">
                  {finding.dataTypes.map((item) => (
                    <li key={item} className={pwnTagClass}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <MetaGrid>
                <Meta label="Fecha de la filtración">{formatWhen(finding.firstSeenAt) ?? "No indicada"}</Meta>
                <Meta label="Confianza">{formatScore(finding.confidenceScore) ?? "No indicada"}</Meta>
                <Meta label="Riesgo">{formatScore(finding.riskScore) ?? (status === "DISPUTED" ? "No calculado" : "No indicado")}</Meta>
                <Meta label="Fuente">
                  <SourceBadge source={finding.source} href={finding.sourceUrl} />
                </Meta>
              </MetaGrid>
            </li>
          );
        })}
      </ul>
      {state.findings.length === 0 && state.exposed ? (
        <p className="text-sm text-[var(--text-secondary)]">La fuente indica exposición, pero no devolvió fichas detalladas en esta consulta.</p>
      ) : null}
      <FollowButton busy={followBusy} message={followMessage} onFollow={onFollow} />
      {state.exposed ? <NextSteps kind={queryType} /> : null}
    </div>
  );
}

function FollowButton({
  busy,
  message,
  onFollow,
}: {
  busy: boolean;
  message: string | null;
  onFollow: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button type="button" disabled={busy} onClick={onFollow} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
        {busy ? "Añadiendo…" : "Seguir este objetivo"}
      </button>
      {message ? <PwnNotice>{message}</PwnNotice> : null}
    </div>
  );
}

function PasswordResult({ state }: { state: PasswordState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <LoadingState label="Comparando el sufijo en el navegador…" />;
  if (state.kind === "disabled") return <DisabledState title="Comprobación no configurada" />;
  if (state.kind === "error") return <ErrorState message={state.message} />;
  return (
    <div className="rounded-[1.25rem] border border-[var(--mv-hairline-strong)] p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <RiskBadge level={state.count > 0 ? "high" : "informational"} />
        <SourceBadge source="HIBP Pwned Passwords" />
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
        {state.count > 0
          ? `La fuente reporta ${state.count} ${state.count === 1 ? "aparición" : "apariciones"} para este hash.`
          : "No hay coincidencias en el rango devuelto por la fuente."}
      </p>
      <p className="mt-2 text-xs text-[var(--text-tertiary)]">La comparación se hizo en este navegador. La contraseña no se envió.</p>
      {state.count > 0 ? (
        <div className="mt-4">
          <NextSteps kind="password" />
        </div>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
