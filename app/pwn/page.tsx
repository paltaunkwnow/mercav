"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  pwnFetch,
  readAlerts,
  readBreaches,
  readPagination,
  readForumSignals,
  readTargets,
  type AlertView,
  type BreachView,
  type ForumSignalView,
  type Paged,
  type PwnResult,
} from "@/components/pwn/api";
import { ForumSignalsPanel } from "@/components/pwn/ForumSignalsPanel";
import { StatCard } from "@/components/pwn/StatCard";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { ProtectionGuide } from "@/components/pwn/ProtectionGuide";
import { focusRing, formatRelative, pwnPanelClass } from "@/components/pwn/format";

type LoadState = {
  loading: boolean;
  breaches: PwnResult<Paged<BreachView>> | null;
  alerts: PwnResult<Paged<AlertView>> | null;
  unread: PwnResult<number | null> | null;
  verifiedTargets: PwnResult<number> | null;
  forumSignals: PwnResult<{ items: ForumSignalView[] }> | null;
};

function totalOf(result: PwnResult<Paged<unknown>> | null): number | null {
  return result?.ok ? (result.data.pagination?.total ?? null) : null;
}

export default function PwnDashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({
    loading: true,
    breaches: null,
    alerts: null,
    unread: null,
    verifiedTargets: null,
    forumSignals: null,
  });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState((current) => ({ ...current, loading: true }));
    const [breachesRes, alertsRes, unreadRes, monitoringRes, forumRes] = await Promise.all([
      pwnFetch("/api/pwn/breaches?page=1&limit=20", { signal }),
      pwnFetch("/api/pwn/alerts?page=1&limit=8", { signal }),
      pwnFetch("/api/pwn/alerts?page=1&limit=1&unread=true", { signal }),
      pwnFetch("/api/pwn/monitoring", { signal }),
      pwnFetch("/api/pwn/forum-signals?page=1&limit=5&kind=DATA", { signal }),
    ]);
    if (signal?.aborted) return;
    const forumParsed = forumRes.ok ? readForumSignals(forumRes.data) : null;
    setState({
      loading: false,
      breaches: breachesRes.ok ? { ok: true, data: readBreaches(breachesRes.data) } : breachesRes,
      alerts: alertsRes.ok ? { ok: true, data: readAlerts(alertsRes.data) } : alertsRes,
      unread: unreadRes.ok ? { ok: true, data: readPagination(unreadRes.data)?.total ?? null } : unreadRes,
      verifiedTargets: monitoringRes.ok
        ? { ok: true, data: readTargets(monitoringRes.data).filter((target) => target.verificationStatus === "VERIFIED").length }
        : monitoringRes,
      forumSignals: forumRes.ok
        ? forumParsed
          ? { ok: true, data: { items: forumParsed.items } }
          : { ok: false, reason: "error", message: "Señales con formato inesperado." }
        : forumRes,
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function submitSearch() {
    const value = query.trim();
    if (!value) {
      setSearchError("Escribe un correo, un dominio o un CVE.");
      return;
    }
    if (/^CVE-\d{4}-\d{4,}$/i.test(value)) {
      router.push(`/pwn/vulnerabilities?cve=${encodeURIComponent(value.toUpperCase())}`);
      return;
    }
    if (value.includes("@")) {
      try {
        sessionStorage.setItem("mercav-pwn-exposure", JSON.stringify({ type: "email", query: value }));
        router.push("/pwn/exposure");
      } catch {
        router.push(`/pwn/exposure?type=email&query=${encodeURIComponent(value)}`);
      }
      return;
    }
    const domain = value.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/\.$/, "");
    if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain)) {
      try {
        sessionStorage.setItem("mercav-pwn-exposure", JSON.stringify({ type: "domain", query: domain.toLowerCase() }));
        router.push("/pwn/exposure");
      } catch {
        router.push(`/pwn/exposure?type=domain&query=${encodeURIComponent(domain.toLowerCase())}`);
      }
      return;
    }
    setSearchError("Usa un correo, un dominio o un identificador CVE-AAAA-NNNN.");
  }

  const breachValue = totalOf(state.breaches);
  const alertValue = totalOf(state.alerts);
  const unreadValue = state.unread?.ok ? state.unread.data : null;
  const targetValue = state.verifiedTargets?.ok ? state.verifiedTargets.data : null;

  const bothDisabled = state.breaches?.ok === false && state.breaches.reason === "disabled" && state.alerts?.ok === false && state.alerts.reason === "disabled";

  return (
    <FadeIn className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-5xl font-black tracking-tighter text-white md:text-7xl">
          Mercav <span className="bg-gradient-to-b from-gold via-yellow-200 to-gold/40 bg-clip-text text-transparent">Pwn</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-400">Descubre exposición digital. Entiende el riesgo. Responde con criterio.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className={`rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
            <Link href="/pwn/exposure">Analizar exposición</Link>
          </Button>
          <Button asChild variant="outline" className={`rounded-xl border-white/10 bg-transparent text-white hover:border-gold/40 hover:bg-gold/5 ${focusRing}`}>
            <Link href="/pwn/vulnerabilities">Buscar vulnerabilidades</Link>
          </Button>
        </div>
      </header>

      <section aria-label="Buscar exposición" className={pwnPanelClass}>
        <SearchForm
          id="pwn-dashboard-search"
          label="Buscar correo, dominio o CVE"
          value={query}
          onChange={(value) => {
            setQuery(value);
            setSearchError(null);
          }}
          onSubmit={submitSearch}
          placeholder="ana@empresa.com, empresa.com o CVE-2024-12345"
          submitLabel="Buscar"
          error={searchError}
        />
      </section>

      {state.loading ? <LoadingState label="Cargando el resumen…" /> : null}

      {!state.loading && bothDisabled ? (
        <DisabledState description="El resumen no puede consultar filtraciones ni alertas porque la integración no está configurada." />
      ) : null}

      {!state.loading ? (
        <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Filtraciones" value={breachValue} hint={hintFor(state.breaches, breachValue, "Ninguna registrada")} />
          <StatCard label="Alertas" value={alertValue} hint={hintFor(state.alerts, alertValue, "Ninguna registrada")} />
          <StatCard label="Sin leer" value={unreadValue} hint={hintFor(state.unread, unreadValue, "Todas leídas")} />
          <StatCard label="Objetivos verificados" value={targetValue} hint={hintFor(state.verifiedTargets, targetValue, "Ninguno verificado")} />
        </section>
      ) : null}

      {!state.loading ? <FeedPanel alerts={state.alerts} onRetry={() => void load()} /> : null}

      {!state.loading ? (
        <ForumSignalsPanel result={state.forumSignals} loading={false} onRetry={() => void load()} />
      ) : null}

      {!state.loading && state.breaches?.ok ? <VerifiedPanel items={state.breaches.data.items} /> : null}

      <ProtectionGuide />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-white/5 bg-bg-secondary/60 p-6">
          <h2 className="font-display text-xl text-white">Qué muestra Pwn</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Cada hallazgo cita el nombre de la fuente. Mercav no presenta como propio un dato que vino de un tercero, y una afirmación sin verificar no es un hecho confirmado.
          </p>
        </article>
        <article className="rounded-3xl border border-white/5 bg-bg-secondary/60 p-6">
          <h2 className="font-display text-xl text-white">Privacidad de la búsqueda</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            La comprobación de contraseñas calcula el hash en el navegador y envía solo los primeros cinco caracteres hexadecimales. La contraseña no sale del dispositivo ni se escribe en el registro.
          </p>
        </article>
      </section>
    </FadeIn>
  );
}

function hintFor(result: PwnResult<unknown> | null, value: number | null, zero: string) {
  if (result && !result.ok && result.reason === "disabled") return "Integración no configurada";
  if (result && !result.ok && result.reason === "unauthorized") return "Inicia sesión para verlo";
  if (result && !result.ok) return "No se pudo consultar";
  if (value === null) return "Dato no disponible";
  if (value === 0) return zero;
  return undefined;
}

function FeedPanel({ alerts, onRetry }: { alerts: PwnResult<Paged<AlertView>> | null; onRetry: () => void }) {
  if (!alerts) return null;
  if (!alerts.ok) {
    if (alerts.reason === "disabled") return <DisabledState title="Actividad no disponible" description="La actividad reciente no está configurada en este entorno." />;
    if (alerts.reason === "unauthorized") return <EmptyState title="Inicia sesión para ver la actividad" description="Las alertas de tu cuenta requieren una sesión." action={<Link className="text-sm text-gold underline-offset-4 hover:underline" href="/login?callbackUrl=%2Fpwn">Ir a iniciar sesión</Link>} />;
    return <ErrorState message={alerts.message} onRetry={onRetry} />;
  }

  const feed = alerts.data.items;
  return (
    <section aria-label="Alertas recientes" className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-6">
      <h2 className="font-display text-2xl text-white">Alertas recientes</h2>
      {feed.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">Aún no hay alertas.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/5">
          {feed.slice(0, 8).map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{item.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SourceBadge source={item.source} />
                  {item.severity ? <RiskBadge level={item.severity} /> : null}
                  {item.targetDisplay ? <span className="font-mono text-xs text-gray-500">{item.targetDisplay}</span> : null}
                </div>
              </div>
              <time className="shrink-0 font-mono text-xs text-gray-500" dateTime={item.createdAt ?? undefined}>
                {formatRelative(item.createdAt) ?? "Fecha no indicada"}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VerifiedPanel({ items }: { items: BreachView[] }) {
  const verified = items.filter((item) => {
    const status = (item.verificationStatus ?? "").toUpperCase();
    return status === "CONFIRMED" || status === "CORROBORATED";
  });
  return (
    <section aria-label="Inteligencia verificada" className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-6">
      <h2 className="font-display text-2xl text-white">Inteligencia verificada reciente</h2>
      {verified.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No hay inteligencia verificada reciente.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {verified.slice(0, 3).map((item) => (
            <li key={item.id} className="flex flex-col gap-2 rounded-2xl border border-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white">{item.name}</p>
              <SourceBadge source={item.source} href={item.sourceUrl} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
// creado por pato dev y askforvini
