"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { focusRing, formatScore, formatWhen, pwnPanelClass } from "@/components/pwn/format";

type QueryType = "email" | "domain";

type ExposureState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "error"; message: string }
  | { kind: "domainLocked"; signedIn: boolean; message: string }
  | { kind: "boolean"; exposed: boolean }
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

  async function runSearch(nextType: QueryType, raw: string) {
    const value = nextType === "email" ? raw.trim().toLowerCase() : normalizeDomain(raw);
    if (nextType === "email" && !validEmail(value)) {
      setFormError("Escribe un correo válido.");
      return;
    }
    if (nextType === "domain" && !validDomain(value)) {
      setFormError("Escribe un dominio válido, por ejemplo empresa.com.");
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
      else if (nextType === "domain" && (response.reason === "unauthorized" || response.reason === "forbidden")) {
        rememberLookup(nextType, value);
        setExposure({ kind: "domainLocked", signedIn: response.reason === "forbidden", message: response.message });
      } else if (response.reason === "unauthorized") {
        setExposure({ kind: "error", message: "Inicia sesión para hacer esta consulta." });
      } else setExposure({ kind: "error", message: response.message });
      return;
    }
    const result = readExposure(response.data);
    if (!result) {
      setExposure({ kind: "error", message: "La respuesta de exposición no tiene el formato esperado." });
      return;
    }
    rememberLookup(nextType, value);
    if (result.scope === "boolean") {
      setExposure({ kind: "boolean", exposed: result.exposed });
      return;
    }
    setExposure(
      result.findings.length
        ? { kind: "ready", exposed: result.exposed, persisted: result.persisted, findings: result.findings }
        : { kind: "empty" },
    );
  }

  useEffect(() => {
    if (started.current) return;
    let nextType = params.get("type");
    let nextQuery = params.get("query");
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
      setPasswordState({ kind: "error", message: "Escribe una contraseña para comprobarla." });
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

  return (
    <FadeIn className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Exposición</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Consulta un correo o un dominio. Los resultados son metadatos atribuidos a la fuente: no incluyen contraseñas ni volcados.
        </p>
      </header>

      <section className={pwnPanelClass}>
        <fieldset className="mb-5">
          <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Tipo de consulta</legend>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["email", "Correo"],
                ["domain", "Dominio"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${type === value ? "border-gold/40 text-gold" : "border-white/10 text-gray-300"}`}>
                <input
                  type="radio"
                  name="exposure-type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className={`accent-[var(--color-gold)] ${focusRing}`}
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

      <ExposureResults state={exposure} queryType={type} onRetry={() => void runSearch(type, query)} />

      <RecentLookups />

      <section className={pwnPanelClass} aria-labelledby="password-check-title">
        <h2 id="password-check-title" className="font-display text-2xl text-white">
          Comprobación de contraseña
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
          El hash se calcula en este navegador. Solo se envían los primeros cinco caracteres hexadecimales y el sufijo se compara aquí. El campo se vacía al enviar.
        </p>
        <div className="mt-5">
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

function ExposureResults({ state, queryType, onRetry }: { state: ExposureState; queryType: QueryType; onRetry: () => void }) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <LoadingState label="Consultando exposición…" />;
  if (state.kind === "disabled") return <DisabledState title="Búsqueda no configurada" />;
  if (state.kind === "error") return <ErrorState message={state.message} onRetry={onRetry} />;
  if (state.kind === "domainLocked") {
    return (
      <div role="alert" className="rounded-3xl border border-gold/20 bg-bg-secondary/80 p-6">
        <h2 className="font-display text-xl text-white">El dominio necesita verificación</h2>
        {state.signedIn && state.message ? <p className="mt-2 text-sm text-gray-300">{state.message}</p> : null}
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
          {state.signedIn
            ? "Solo se consultan dominios que hayas añadido en Monitoreo y verificado con un registro DNS TXT."
            : "Inicia sesión, añade el dominio en Monitoreo y verifícalo con un registro DNS TXT para poder consultarlo."}
        </p>
        <Link href={state.signedIn ? "/pwn/monitor" : "/login?callbackUrl=%2Fpwn%2Fmonitor"} className={`mt-4 inline-flex text-sm text-gold underline-offset-4 hover:underline ${focusRing}`}>
          {state.signedIn ? "Ir a monitoreo" : "Iniciar sesión"}
        </Link>
      </div>
    );
  }
  if (state.kind === "boolean") {
    return (
      <div role="status" className="rounded-3xl border border-white/10 bg-bg-secondary/70 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-white">{state.exposed ? "Aparece en filtraciones públicas" : "No aparece en filtraciones públicas"}</h2>
          <RiskBadge level={state.exposed ? "high" : "informational"} />
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
          Para objetivos que no son tuyos solo se indica si hay exposición. El detalle de las filtraciones está disponible para el correo de tu propia cuenta o para objetivos verificados en Monitoreo.
        </p>
        {state.exposed ? (
          <div className="mt-5">
            <NextSteps kind={queryType} />
          </div>
        ) : null}
      </div>
    );
  }
  if (state.kind === "empty") {
    return <EmptyState title="Sin exposiciones en esta consulta" description="Las fuentes consultadas no devolvieron exposiciones para este correo o dominio." />;
  }
  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-gray-300">
        {state.exposed ? "Hay exposición confirmada por la fuente." : "La fuente solo devolvió registros en disputa."}
        {state.persisted ? " Los resultados se guardaron en tu monitoreo." : ""}
      </p>
      <ul className="space-y-4">
        {state.findings.map((finding) => {
          const verification = verificationMeta(finding.verificationStatus);
          const status = (finding.verificationStatus ?? "").toUpperCase();
          const dashed = status === "UNVERIFIED" || status === "DISPUTED";
          return (
            <li key={finding.key} className={`rounded-3xl border bg-bg-secondary/70 p-5 ${dashed ? "border-dashed border-white/25" : "border-white/5"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl text-white">{finding.title}</h2>
                <VerificationBadge status={finding.verificationStatus} />
                {finding.isSensitive ? <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-300">Sensible</span> : null}
                {finding.isRetired ? <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Retirada</span> : null}
              </div>
              {verification?.note ? <p className="mt-3 text-sm text-gray-300">{verification.note}</p> : null}
              {finding.subjectHint ? <p className="mt-4 font-mono text-sm text-gray-300">{finding.subjectHint}</p> : null}
              {finding.dataTypes.length ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {finding.dataTypes.map((item) => (
                    <li key={item} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-gray-500">Fecha de la filtración</dt>
                  <dd className="text-white">{formatWhen(finding.firstSeenAt) ?? "No indicada"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Confianza</dt>
                  <dd className="text-white">{formatScore(finding.confidenceScore) ?? "No indicada"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Riesgo</dt>
                  <dd className="text-white">{formatScore(finding.riskScore) ?? (status === "DISPUTED" ? "No calculado" : "No indicado")}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <SourceBadge source={finding.source} href={finding.sourceUrl} />
              </div>
            </li>
          );
        })}
      </ul>
      {state.exposed ? <NextSteps kind={queryType} /> : null}
    </div>
  );
}

function PasswordResult({ state }: { state: PasswordState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "loading") return <LoadingState label="Comparando el sufijo en el navegador…" />;
  if (state.kind === "disabled") return <DisabledState title="Comprobación no configurada" />;
  if (state.kind === "error") return <ErrorState message={state.message} />;
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={state.count > 0 ? "high" : "informational"} />
        <SourceBadge source="HIBP Pwned Passwords" />
      </div>
      <p className="mt-3 text-sm text-white">
        {state.count > 0
          ? `La fuente reporta ${state.count} ${state.count === 1 ? "aparición" : "apariciones"} para este hash.`
          : "No hay coincidencias en el rango devuelto por la fuente."}
      </p>
      <p className="mt-2 text-xs text-gray-500">La comparación se hizo en este navegador. La contraseña no se envió.</p>
      {state.count > 0 ? (
        <div className="mt-4">
          <NextSteps kind="password" />
        </div>
      ) : null}
    </div>
  );
}
