"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  countLocalSuffix,
  pwnFetch,
  readCreatedTarget,
  readExposure,
  readPasswordRange,
  type ExposureResult,
} from "@/components/pwn/api";
import { sha1Hex } from "@/components/pwn/password";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge, VerificationBadge, verificationMeta } from "@/components/pwn/RiskBadge";
import { DisabledState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { NextSteps } from "@/components/pwn/NextSteps";
import { RecentLookups, rememberLookup } from "@/components/pwn/RecentLookups";
import { WatchTargets, followMessage, type FollowOutcome } from "@/components/pwn/WatchTargets";
import { usePwnSession } from "@/components/pwn/session";
import {
  formatDay,
  formatScore,
  pwnCardClass,
  pwnIconTileClass,
  pwnInsetClass,
  pwnPanelClass,
  pwnTagClass,
  pwnUnverifiedCardClass,
} from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnPageHeader, VerdictTile } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";
import { KeyRound } from "@/components/icons";

type QueryType = "email" | "domain";

type ExposureState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "error"; message: string }
  | { kind: "ready"; type: QueryType; subject: string; result: ExposureResult };

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

function breachCount(count: number) {
  return count === 1 ? "1 filtración" : `${count} filtraciones`;
}

/** Frase corta para el lector de pantalla cuando llega un resultado. */
function announcement(state: ExposureState): string {
  if (state.kind === "loading") return "Consultando exposición…";
  if (state.kind === "error") return `Error: ${state.message}`;
  if (state.kind === "disabled") return "La búsqueda no está configurada.";
  if (state.kind !== "ready") return "";
  const { result } = state;
  return result.exposed ? `Aparece en ${breachCount(result.count)}.` : "No aparece en filtraciones conocidas.";
}

export default function ExposurePage() {
  const params = useSearchParams();
  const session = usePwnSession();
  const started = useRef(false);
  const searchController = useRef<AbortController | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const [type, setType] = useState<QueryType>("email");
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [exposure, setExposure] = useState<ExposureState>({ kind: "idle" });
  const [password, setPassword] = useState("");
  const [passwordState, setPasswordState] = useState<PasswordState>({ kind: "idle" });
  const [watchTick, setWatchTick] = useState(0);
  const [watchSeed, setWatchSeed] = useState<{ type: QueryType; query: string } | null>(null);
  const [lastFollow, setLastFollow] = useState<FollowOutcome | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followNotice, setFollowNotice] = useState<{ text: string; tone: "ok" | "error" | "neutral" } | null>(null);

  const runSearch = useCallback(async (nextType: QueryType, raw: string) => {
    const value = nextType === "email" ? raw.trim().toLowerCase() : normalizeDomain(raw);
    if (nextType === "email" && !validEmail(value)) {
      setFormError("Escribí un correo válido.");
      return;
    }
    if (nextType === "domain" && !validDomain(value)) {
      setFormError("Escribí un dominio válido, por ejemplo empresa.com.");
      return;
    }
    // Una consulta nueva cancela la anterior: nunca se pisa un resultado con uno viejo.
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setFormError(null);
    setFollowNotice(null);
    setExposure({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/exposure", {
      method: "POST",
      body: JSON.stringify({ type: nextType, query: value }),
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    if (!response.ok) {
      if (response.reason === "aborted") return;
      if (response.reason === "disabled") setExposure({ kind: "disabled" });
      else setExposure({ kind: "error", message: response.message || "No se pudo consultar." });
      return;
    }
    const result = readExposure(response.data);
    if (!result) {
      setExposure({ kind: "error", message: "La respuesta de exposición no tiene el formato esperado." });
      return;
    }
    rememberLookup(nextType, value);
    setWatchSeed({ type: nextType, query: value });
    setExposure({ kind: "ready", type: nextType, subject: value, result });
  }, []);

  // Al llegar un resultado, el foco va al encabezado de resultados.
  useEffect(() => {
    if (exposure.kind === "ready" || exposure.kind === "error") resultsHeading.current?.focus();
  }, [exposure]);

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
  }, [params, runSearch]);

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
    if (exposure.kind !== "ready") return;
    setFollowNotice(null);
    setFollowBusy(true);
    const response = await pwnFetch("/api/pwn/monitoring", {
      method: "POST",
      body: JSON.stringify({ type: exposure.type, query: exposure.subject }),
    });
    setFollowBusy(false);
    if (!response.ok) {
      setFollowNotice({
        text: response.reason === "unauthorized" ? "Iniciá sesión para seguir este objetivo." : response.message,
        tone: "error",
      });
      return;
    }
    const outcome = readCreatedTarget(response.data);
    setLastFollow(outcome);
    setFollowNotice({ text: followMessage(outcome), tone: "ok" });
    setWatchTick((current) => current + 1);
    // Si quedó verificado en el acto (correo de la cuenta confirmada), mostramos el detalle completo.
    if (outcome.target?.verificationStatus === "VERIFIED") void runSearch(exposure.type, exposure.subject);
  }

  const signedIn = session.status === "authenticated";

  return (
    <FadeIn className="space-y-10 md:space-y-12">
      <PwnPageHeader
        title="¿Dónde aparece este correo o dominio?"
        lead="Cualquiera puede consultar: sin verificar ves si aparece y en cuántas filtraciones. El detalle de cada filtración, el patrullaje y las alertas son para correos y dominios que demostraste que son tuyos."
      />

      <section aria-label="Consultar exposición" className={pwnPanelClass}>
        <fieldset className="mb-5">
          <legend className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Tipo de consulta</legend>
          <div className="inline-flex w-full rounded-[0.875rem] border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] p-1 sm:w-auto">
            {(
              [
                ["email", "Correo"],
                ["domain", "Dominio"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`relative inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-[0.625rem] px-5 text-sm font-medium transition-[background-color,color] duration-200 has-[:focus-visible]:shadow-[0_0_0_2px_var(--color-gold)] sm:flex-none ${
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
          hint={
            type === "email"
              ? "Un correo que no verificaste muestra solo si aparece y en cuántas filtraciones, sin las que HIBP marca como sensibles."
              : "Un dominio que no verificaste se busca en el catálogo público de HIBP: filtraciones que sufrió el servicio de ese dominio."
          }
        />
      </section>

      {/* Siempre montada: el lector de pantalla anuncia cada resultado nuevo. */}
      <p aria-live="polite" role="status" className="sr-only">
        {announcement(exposure)}
      </p>

      {exposure.kind !== "idle" ? (
        <section aria-labelledby="exposure-results-title" className="space-y-4">
          <h2 id="exposure-results-title" ref={resultsHeading} tabIndex={-1} className="mv-h3 outline-none">
            Resultado
          </h2>
          <ExposureResults
            state={exposure}
            signedIn={signedIn}
            onRetry={() => void runSearch(type, query)}
            onFollow={() => void followCurrent()}
            followBusy={followBusy}
            followNotice={followNotice}
          />
        </section>
      ) : null}

      <RecentLookups />

      <WatchTargets
        refresh={watchTick}
        seed={watchSeed}
        lastFollow={lastFollow}
        onVerified={() => {
          if (exposure.kind === "ready") void runSearch(exposure.type, exposure.subject);
        }}
      />

      <section className={pwnPanelClass} aria-labelledby="password-check-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className={pwnIconTileClass}>
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
  signedIn,
  onRetry,
  onFollow,
  followBusy,
  followNotice,
}: {
  state: ExposureState;
  signedIn: boolean;
  onRetry: () => void;
  onFollow: () => void;
  followBusy: boolean;
  followNotice: { text: string; tone: "ok" | "error" | "neutral" } | null;
}) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <LoadingState label="Consultando exposición…" />;
  if (state.kind === "disabled") return <DisabledState title="Búsqueda no configurada" />;
  if (state.kind === "error") return <ErrorState title="No se pudo hacer la consulta" message={state.message} onRetry={onRetry} />;

  const { result, type, subject } = state;
  const owner = result.scope === "full" && result.access === "owner";
  const subjectLabel = type === "email" ? "Este correo" : "Este dominio";
  const verdictTitle = result.exposed
    ? `${subjectLabel} aparece en ${breachCount(result.count)}`
    : `${subjectLabel} no aparece en filtraciones conocidas`;
  const dataTypes = result.scope === "full" ? [...new Set(result.findings.flatMap((finding) => finding.rawDataTypes))] : [];

  return (
    <div className="space-y-4">
      <VerdictTile
        tone={result.exposed ? "exposed" : "clean"}
        title={verdictTitle}
        detail={<span className="mv-data">{subject}</span>}
      />

      <ScopeNote result={result} type={type} subject={subject} />

      {result.scope === "full" && result.findings.length ? (
        <ul className="space-y-4" aria-label="Filtraciones encontradas">
          {result.findings.map((finding) => {
            const verification = verificationMeta(finding.verificationStatus);
            const status = (finding.verificationStatus ?? "").toUpperCase();
            const dashed = status === "UNVERIFIED" || status === "DISPUTED";
            return (
              <li key={finding.key} className={`${pwnCardClass} ${dashed ? pwnUnverifiedCardClass : ""}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="mv-h3">{finding.title}</h3>
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
                {finding.subjectHint && owner ? <p className="mv-data mt-4 text-sm text-[var(--text-primary)]">{finding.subjectHint}</p> : null}
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
                  <Meta label="Fecha de la filtración">{formatDay(finding.firstSeenAt) ?? "No indicada"}</Meta>
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
      ) : null}

      {result.scope === "full" && result.findings.length === 0 && result.exposed ? (
        <p className="text-sm text-[var(--text-secondary)]">La fuente indica exposición, pero no devolvió fichas detalladas en esta consulta.</p>
      ) : null}

      {!owner ? (
        <div className={`${pwnInsetClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-sm text-[var(--text-secondary)]">
            {signedIn
              ? type === "email"
                ? "Para ver el detalle, verificá que el correo es tuyo: seguilo y confirmalo."
                : "Para ver las cuentas @dominio y recibir alertas, seguí el dominio y verificalo por DNS."
              : "Iniciá sesión para seguir este objetivo y verificar que es tuyo."}
          </p>
          {signedIn ? (
            <button type="button" disabled={followBusy} onClick={onFollow} className={buttonClass("secondary", "md", "w-full shrink-0 sm:w-auto")}>
              {followBusy ? "Siguiendo…" : type === "email" ? "Seguir y verificar" : "Seguir y verificar por DNS"}
            </button>
          ) : (
            <a href="/login?callbackUrl=%2Fpwn%2Fexposure" className={buttonClass("secondary", "md", "w-full shrink-0 sm:w-auto")}>
              Iniciar sesión
            </a>
          )}
        </div>
      ) : null}
      {followNotice ? <PwnNotice tone={followNotice.tone}>{followNotice.text}</PwnNotice> : null}

      {result.exposed ? <NextSteps kind={type} dataTypes={dataTypes} /> : null}
    </div>
  );
}

/** Explica qué significa el resultado según quién pregunta y cómo se buscó. */
function ScopeNote({ result, type, subject }: { result: ExposureResult; type: QueryType; subject: string }) {
  if (result.scope === "summary") {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Resultado resumido: no se muestran los nombres de las filtraciones ni las que HIBP marca como sensibles, porque todavía no verificaste que el correo es tuyo.
      </p>
    );
  }
  if (result.access === "owner") {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Es un objetivo tuyo verificado: ves el detalle completo.
        {result.persisted ? " Los resultados quedaron guardados para tus alertas." : ""}
      </p>
    );
  }
  return (
    <div className="space-y-1 text-sm text-[var(--text-secondary)]">
      {type === "domain" && result.domainMode !== "accounts" ? (
        <p>
          Catálogo público de HIBP: filtraciones que sufrió el servicio de <span className="mv-data">{subject}</span>. No dice si hay cuentas @
          {subject} en filtraciones de otros sitios; eso requiere verificar el dominio.
        </p>
      ) : null}
      {result.hiddenSensitive > 0 ? (
        <p>
          HIBP marca {result.hiddenSensitive === 1 ? "1 filtración de este servicio" : `${result.hiddenSensitive} filtraciones de este servicio`} como sensible;
          no se muestra sin verificar el dominio.
        </p>
      ) : null}
    </div>
  );
}

function PasswordResult({ state }: { state: PasswordState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <LoadingState label="Comparando el sufijo en el navegador…" />;
  if (state.kind === "disabled") return <DisabledState title="Comprobación no configurada" />;
  if (state.kind === "error") return <ErrorState title="No se pudo comprobar" message={state.message} />;
  return (
    <div className="space-y-4">
      <VerdictTile
        tone={state.count > 0 ? "exposed" : "clean"}
        title={
          state.count > 0
            ? `Esta contraseña apareció ${state.count} ${state.count === 1 ? "vez" : "veces"} en filtraciones`
            : "Esta contraseña no aparece en el rango consultado"
        }
        detail="La comparación se hizo en este navegador. La contraseña no se envió."
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <RiskBadge level={state.count > 0 ? "high" : "informational"} />
        <SourceBadge source="HIBP Pwned Passwords" />
      </div>
      {state.count > 0 ? <NextSteps kind="password" /> : null}
    </div>
  );
}
// creado por pato dev y askforvini
