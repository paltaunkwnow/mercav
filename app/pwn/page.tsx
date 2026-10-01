"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Database,
  Eye,
  FileSearch,
  FileText,
  Fingerprint,
  Landmark,
  LogIn,
  Quote,
  Radar,
  ScanSearch,
  Target,
} from "lucide-react";
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
import { DisabledState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { ProtectionGuide } from "@/components/pwn/ProtectionGuide";
import { PwnSectionHeading } from "@/components/pwn/ui";
import { focusRing, formatRelative } from "@/components/pwn/format";
import { ButtonLink, buttonClass } from "@/components/site/primitives";
import { PWN_FEED_SOURCES } from "@/lib/integrations/pwn/feed-catalog";
import { FORUM_SYNC_INTERVAL_MS } from "@/lib/pwn/forum-sync-policy";

/* Real counts, straight from the feed catalog — never hand-typed. */
const OFFICIAL_SOURCES = ["Have I Been Pwned", "NVD", "CISA KEV"] as const;
const RSS_COUNT = PWN_FEED_SOURCES.filter((source) => source.sourceType === "RSS").length;
const FORUM_COUNT = PWN_FEED_SOURCES.filter((source) => source.sourceType === "FORUM_SCRAPE").length;
const FEED_LABELS = Array.from(new Set(PWN_FEED_SOURCES.map((source) => source.forumLabel)));
const FORUM_MINUTES = Math.round(FORUM_SYNC_INTERVAL_MS / 60_000);

const CAPABILITIES = [
  {
    href: "/pwn/exposure",
    icon: ScanSearch,
    name: "Exposición",
    does: "Consulta un correo o un dominio contra Have I Been Pwned.",
    solves: "Saber si una cuenta ya quedó expuesta, sin tener que demostrar que es tuya.",
    gets: "Una ficha por filtración: fecha, tipos de dato, confianza y fuente.",
  },
  {
    href: "/pwn/breaches",
    icon: Database,
    name: "Filtraciones",
    does: "Reúne las filtraciones registradas con su estado de verificación.",
    solves: "Separar lo confirmado de lo que solo se afirma en un foro.",
    gets: "Un listado filtrable por verificación, con registros declarados y fuente.",
  },
  {
    href: "/pwn/vulnerabilities",
    icon: FileSearch,
    name: "Vulnerabilidades",
    does: "Busca un CVE en NVD y marca si figura en el catálogo KEV de CISA.",
    solves: "Priorizar parches por evidencia de explotación, no por ruido.",
    gets: "CVSS, fecha de publicación, explotación conocida y referencias del fabricante.",
  },
  {
    href: "/pwn/signals",
    icon: Radar,
    name: "Ciberpatrullaje",
    does: `Revisa titulares de foros y RSS permitidos cada ${FORUM_MINUTES} minutos.`,
    solves: "Enterarte de un reclamo de filtración sin entrar a ningún foro.",
    gets: "Señales por tipo, autor y prioridad. Solo metadatos: título, autor y enlace.",
  },
  {
    href: "/pwn/alerts",
    icon: BellRing,
    name: "Alertas",
    does: "Avisa cuando un objetivo que seguís y verificaste aparece en una fuente.",
    solves: "Dejar de consultar a mano lo que ya sabés que te importa.",
    gets: "Alertas con severidad, objetivo y fuente, que podés marcar como leídas.",
  },
  {
    href: "/pwn/reports",
    icon: FileText,
    name: "Informes",
    does: "Resume tus objetivos, exposiciones y alertas en un momento dado.",
    solves: "Explicar el estado de exposición a un equipo o a un cliente.",
    gets: "Métricas, confianza promedio y riesgo máximo, registrados en tu cuenta.",
  },
] as const;

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

  const load = useCallback(async (signal?: AbortSignal, silent?: boolean) => {
    if (!silent) setState((current) => ({ ...current, loading: true }));
    const [breachesRes, alertsRes, unreadRes, monitoringRes, forumRes] = await Promise.all([
      pwnFetch("/api/pwn/breaches?page=1&limit=20", { signal }),
      pwnFetch("/api/pwn/alerts?page=1&limit=8", { signal }),
      pwnFetch("/api/pwn/alerts?page=1&limit=1&unread=true", { signal }),
      pwnFetch("/api/pwn/monitoring", { signal }),
      pwnFetch("/api/pwn/forum-signals?page=1&limit=5&kind=LEAKS", { signal }),
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

  usePwnFeedRefresh(
    useCallback(() => {
      void load(undefined, true);
    }, [load]),
  );

  function submitSearch() {
    const value = query.trim();
    if (!value) {
      setSearchError("Escribí un correo, un dominio o un CVE.");
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
    setSearchError("Usá un correo, un dominio o un identificador CVE-AAAA-NNNN.");
  }

  const breachValue = totalOf(state.breaches);
  const alertValue = totalOf(state.alerts);
  const unreadValue = state.unread?.ok ? state.unread.data : null;
  const targetValue = state.verifiedTargets?.ok ? state.verifiedTargets.data : null;

  const bothDisabled = state.breaches?.ok === false && state.breaches.reason === "disabled" && state.alerts?.ok === false && state.alerts.reason === "disabled";

  const signedOut = [state.breaches, state.alerts, state.unread, state.verifiedTargets].every(
    (result) => result !== null && !result.ok && result.reason === "unauthorized",
  );
  const hideForum = signedOut && state.forumSignals?.ok === false && state.forumSignals.reason === "unauthorized";

  return (
    <FadeIn className="space-y-20 md:space-y-28">
      {/* Hero: the search is the main action */}
      <section aria-labelledby="pwn-hero-title" className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end xl:gap-14">
        <div className="min-w-0">
          <p className="mv-kicker">Ciberinteligencia defensiva</p>
          <h1 id="pwn-hero-title" className="mv-h1 mt-5 max-w-[46rem]">
            Sabé dónde quedó expuesta tu empresa, <span className="mv-gold-text">con la fuente a la vista.</span>
          </h1>
          <p className="mv-lead mt-5">
            Consultá un correo, un dominio o un CVE. Pwn cruza Have I Been Pwned, NVD, el catálogo KEV de CISA y titulares de foros
            permitidos, y te avisa solo sobre lo que seguís.
          </p>

          <div className="liquid-glass liquid-glass-lens mt-8 rounded-[1.75rem] p-4 sm:p-5 md:p-6">
            <SearchForm
              id="pwn-dashboard-search"
              label="Buscar correo, dominio o CVE"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setSearchError(null);
              }}
              onSubmit={submitSearch}
              placeholder="ana@empresa.com o empresa.com"
              submitLabel="Buscar"
              error={searchError}
            />
            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]" aria-label="Qué podés buscar">
              <li className="mv-chip">Correo → Exposición</li>
              <li className="mv-chip">Dominio → Exposición</li>
              <li className="mv-chip">
                <span className="mv-data">CVE-AAAA-NNNN</span> → Vulnerabilidades
              </li>
            </ul>
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--text-tertiary)]">
            La consulta es abierta: no hace falta demostrar que el correo o el dominio es tuyo. Las alertas sí requieren seguirlo y
            verificarlo.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/pwn/exposure" tone="secondary" className="w-full sm:w-auto">
              Analizar exposición
            </ButtonLink>
            <ButtonLink href="/pwn/vulnerabilities" tone="ghost" className="w-full sm:w-auto">
              Buscar vulnerabilidades
            </ButtonLink>
          </div>
        </div>

        <aside aria-label="Cómo trabaja Pwn" className="mv-panel rounded-[1.75rem] p-5 md:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Cómo trabaja</p>
          <dl className="mt-4 divide-y divide-[var(--mv-hairline)]">
            <HeroFact label="Feeds de foros y RSS" value={formatInt(PWN_FEED_SOURCES.length)} />
            <HeroFact label="Foros revisados cada" value={`${FORUM_MINUTES} min`} />
            <HeroFact label="Análisis y correlación" value="Cada hora" />
            <HeroFact label="Del hash de tu contraseña salen" value="5 caracteres" />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-tertiary)]">
            Las señales de foros se guardan como metadatos. Nada de volcados.
          </p>
        </aside>
      </section>

      {/* Live data */}
      <section aria-labelledby="pwn-live-title" className="space-y-6">
        <PwnSectionHeading
          id="pwn-live-title"
          kicker="En vivo"
          title="Tu panel"
          lead="Filtraciones, alertas y objetivos de tu cuenta. Se actualiza solo cuando el patrullaje encuentra algo nuevo."
          action={
            signedOut ? null : (
              <Link href="/pwn/alerts" className={`mv-link inline-flex items-center gap-1 text-sm ${focusRing}`}>
                Ver todas las alertas <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )
          }
        />

        {state.loading ? <LoadingState label="Cargando el resumen…" /> : null}

        {!state.loading && bothDisabled ? (
          <DisabledState description="El resumen no puede consultar filtraciones ni alertas porque la integración no está configurada." />
        ) : null}

        {!state.loading && signedOut ? <SignedOutPanel /> : null}

        {!state.loading && !signedOut ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Filtraciones"
              value={breachValue}
              hint={hintFor(state.breaches, breachValue, "Ninguna registrada")}
              icon={<Database className="h-4 w-4" aria-hidden />}
              href="/pwn/breaches"
            />
            <StatCard
              label="Alertas"
              value={alertValue}
              hint={hintFor(state.alerts, alertValue, "Ninguna registrada")}
              icon={<BellRing className="h-4 w-4" aria-hidden />}
              href="/pwn/alerts"
            />
            <StatCard
              label="Sin leer"
              value={unreadValue}
              hint={hintFor(state.unread, unreadValue, "Todas leídas")}
              icon={<Eye className="h-4 w-4" aria-hidden />}
              href="/pwn/alerts"
            />
            <StatCard
              label="Objetivos autorizados"
              value={targetValue}
              hint={hintFor(state.verifiedTargets, targetValue, "Ninguno autorizado")}
              icon={<Target className="h-4 w-4" aria-hidden />}
              href="/pwn/exposure"
            />
          </div>
        ) : null}

        {!state.loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {!signedOut ? <FeedPanel alerts={state.alerts} onRetry={() => void load()} /> : null}
            {!hideForum ? (
              <div className={signedOut ? "lg:col-span-2" : undefined}>
                <ForumSignalsPanel result={state.forumSignals} loading={false} onRetry={() => void load()} />
              </div>
            ) : null}
          </div>
        ) : null}

        {!state.loading && state.breaches?.ok ? <VerifiedPanel items={state.breaches.data.items} /> : null}
      </section>

      {/* Capabilities */}
      <section aria-labelledby="pwn-capacidades" className="space-y-8">
        <PwnSectionHeading
          id="pwn-capacidades"
          kicker="Qué cubre Pwn"
          title="Seis módulos, una misma lectura del riesgo."
          lead="Cada módulo responde una pregunta concreta. Empezá por el que te preocupa hoy."
        />
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map(({ href, icon: Icon, name, does, solves, gets }) => (
            <li key={href}>
              <Link href={href} className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col rounded-[1.5rem] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <ArrowUpRight
                    className="h-5 w-5 text-[var(--text-tertiary)] transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                    aria-hidden
                  />
                </div>
                <h3 className="mv-h3 mt-5">{name}</h3>
                <p className="mv-body mt-2">{does}</p>
                <dl className="mt-5 space-y-3 border-t border-[var(--mv-hairline)] pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--text-tertiary)]">Qué resuelve</dt>
                    <dd className="mt-0.5 text-[var(--text-secondary)]">{solves}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-tertiary)]">Qué obtenés</dt>
                    <dd className="mt-0.5 text-[var(--text-primary)]">{gets}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProtectionGuide />

      {/* Trust */}
      <section aria-labelledby="pwn-confianza" className="space-y-8">
        <PwnSectionHeading
          id="pwn-confianza"
          kicker="Confianza"
          title="Cada hallazgo cita su fuente."
          lead="Fuentes públicas y nombradas, privacidad desde el navegador y un límite claro entre lo confirmado y lo que solo se afirma."
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="mv-panel rounded-[1.75rem] p-6 md:p-8">
            <h3 className="mv-h3">Fuentes que consulta</h3>
            <dl className="mt-6 grid grid-cols-3 gap-4">
              <SourceFact value={OFFICIAL_SOURCES.length} label="APIs oficiales" />
              <SourceFact value={RSS_COUNT} label="Feeds RSS" />
              <SourceFact value={FORUM_COUNT} label="Foros permitidos" />
            </dl>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="APIs oficiales">
              {OFFICIAL_SOURCES.map((name) => (
                <li key={name} className="mv-chip mv-chip-gold">
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-[var(--text-tertiary)]">Feeds de titulares en la lista permitida</p>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Feeds de titulares">
              {FEED_LABELS.map((label) => (
                <li key={label} className="mv-chip h-7 font-medium">
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <ul className="flex flex-col gap-3">
            <TrustPoint icon={<Quote className="h-[18px] w-[18px]" aria-hidden />} title="Qué muestra Pwn">
              Cada hallazgo cita el nombre de la fuente. Mercav no presenta como propio un dato que vino de un tercero, y una afirmación
              sin verificar no es un hecho confirmado.
            </TrustPoint>
            <TrustPoint icon={<Fingerprint className="h-[18px] w-[18px]" aria-hidden />} title="Privacidad de la búsqueda">
              La comprobación de contraseñas calcula el hash en el navegador y envía solo los primeros cinco caracteres hexadecimales. La
              contraseña no sale del dispositivo ni se escribe en el registro.
            </TrustPoint>
            <TrustPoint icon={<Radar className="h-[18px] w-[18px]" aria-hidden />} title="Foros: solo metadatos">
              De cada señal se guarda el título, el autor y el enlace. No se descargan volcados, y no se guardan contraseñas ni correos
              ajenos en claro.
            </TrustPoint>
            <TrustPoint icon={<Landmark className="h-[18px] w-[18px]" aria-hidden />} title="Organismos públicos primero">
              Las señales que mencionan a un organismo de gobierno llevan marca de prioridad para que se revisen antes.
            </TrustPoint>
          </ul>
        </div>
      </section>

      {/* Final CTA: one action */}
      <section aria-labelledby="pwn-cta" className="liquid-glass relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-10 md:py-16">
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
          <h2 id="pwn-cta" className="mv-h2">
            Empezá por tu propio correo.
          </h2>
          <p className="mv-body mx-auto text-base">
            Consultalo ahora. Si aparece en una filtración, seguilo para recibir la próxima alerta con la fuente citada.
          </p>
          <ButtonLink href="/pwn/exposure" size="lg" className="mt-3 w-full sm:w-auto">
            Analizar exposición
          </ButtonLink>
        </div>
      </section>
    </FadeIn>
  );
}

function formatInt(value: number) {
  return new Intl.NumberFormat("es").format(value);
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="shrink-0 font-display text-base font-semibold tabular-nums text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function SourceFact({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-1">
      <dt className="text-xs text-[var(--text-secondary)] sm:text-sm">{label}</dt>
      <dd className="font-display text-3xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)] md:text-4xl">{value}</dd>
    </div>
  );
}

function TrustPoint({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="mv-panel flex gap-4 rounded-[1.5rem] p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>
      </div>
    </li>
  );
}

const SIGNED_OUT_PREVIEW = ["Filtraciones", "Alertas", "Sin leer", "Objetivos autorizados"];

function SignedOutPanel() {
  return (
    <div className="mv-panel relative grid gap-8 overflow-hidden rounded-[1.75rem] bg-[radial-gradient(120%_80%_at_0%_0%,var(--mv-gold-wash),transparent_60%)] p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
      <div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
          <LogIn className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mv-h3 mt-5">Iniciá sesión para ver tu panel</h3>
        <p className="mv-body mt-2 max-w-md">
          Tus filtraciones, alertas, objetivos y la patrulla de foros viven en tu cuenta. La búsqueda de arriba funciona sin sesión.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/login?callbackUrl=%2Fpwn" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
            Iniciar sesión
          </Link>
          <Link href="/register" className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
            Crear cuenta
          </Link>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3" aria-label="Qué vas a ver con sesión">
        {SIGNED_OUT_PREVIEW.map((label) => (
          <li key={label} className="mv-panel rounded-[1.25rem] p-4">
            <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
            <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-tertiary)]" aria-hidden>
              —
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">Iniciá sesión para verlo</p>
          </li>
        ))}
        <li className="col-span-2 rounded-[1.25rem] border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          También: alertas recientes, patrulla de filtraciones e inteligencia verificada.
        </li>
      </ul>
    </div>
  );
}

function hintFor(result: PwnResult<unknown> | null, value: number | null, zero: string) {
  if (result && !result.ok && result.reason === "disabled") return "Integración no configurada";
  if (result && !result.ok && result.reason === "unauthorized") return "Iniciá sesión para verlo";
  if (result && !result.ok) return "No se pudo consultar";
  if (value === null) return "Dato no disponible";
  if (value === 0) return zero;
  return undefined;
}

function FeedPanel({ alerts, onRetry }: { alerts: PwnResult<Paged<AlertView>> | null; onRetry: () => void }) {
  if (!alerts) return null;
  if (!alerts.ok) {
    if (alerts.reason === "disabled") return <DisabledState title="Actividad no disponible" description="La actividad reciente no está configurada en este entorno." />;
    if (alerts.reason === "unauthorized") return <UnauthorizedState callbackPath="/pwn" description="Las alertas de tu cuenta requieren una sesión." />;
    return <ErrorState message={alerts.message} onRetry={onRetry} />;
  }

  const feed = alerts.data.items;
  return (
    <section aria-labelledby="pwn-feed-title" className="mv-panel flex h-full flex-col rounded-[1.75rem] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="pwn-feed-title" className="mv-h3 text-lg">
          Alertas recientes
        </h3>
        <Link href="/pwn/alerts" className={`mv-link inline-flex items-center gap-1 text-sm ${focusRing}`}>
          Ver alertas <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {feed.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-start justify-center rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-5">
          <p className="text-sm font-medium text-[var(--text-primary)]">Aún no hay alertas.</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Seguí un correo o un dominio para recibir la primera.</p>
          <Link href="/pwn/exposure" className={`mv-link mt-3 text-sm ${focusRing}`}>
            Ir a Exposición
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-[var(--mv-hairline)]">
          {feed.slice(0, 8).map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-4 first:pt-1 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">{item.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {item.severity ? <RiskBadge level={item.severity} /> : null}
                  <SourceBadge source={item.source} />
                  {item.targetDisplay ? <span className="mv-data text-xs text-[var(--text-tertiary)]">{item.targetDisplay}</span> : null}
                </div>
              </div>
              <time className="mv-data shrink-0 text-xs text-[var(--text-tertiary)]" dateTime={item.createdAt ?? undefined}>
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
    <section aria-labelledby="pwn-verified-title" className="mv-panel rounded-[1.75rem] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="pwn-verified-title" className="mv-h3 text-lg">
            Inteligencia verificada reciente
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Filtraciones confirmadas o corroboradas por la fuente.</p>
        </div>
        <Link href="/pwn/breaches" className={`mv-link inline-flex items-center gap-1 text-sm ${focusRing}`}>
          Ver filtraciones <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {verified.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No hay inteligencia verificada reciente.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {verified.slice(0, 3).map((item) => (
            <li key={item.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
              <SourceBadge source={item.source} href={item.sourceUrl} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
// creado por pato dev y askforvini
