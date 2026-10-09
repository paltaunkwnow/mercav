"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
} from "@/components/icons";
import { pwnFetch, readSummary, type AlertView, type PwnResult, type SummaryView } from "@/components/pwn/api";
import { ForumSignalsPanel } from "@/components/pwn/ForumSignalsPanel";
import { StatCard } from "@/components/pwn/StatCard";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, ErrorState, LoadingState } from "@/components/pwn/EmptyState";
import { FadeIn, usePwnFeedRefresh } from "@/components/pwn/PwnShell";
import { ProtectionGuide } from "@/components/pwn/ProtectionGuide";
import { PwnSectionHeading, VerdictTile } from "@/components/pwn/ui";
import { usePwnSession } from "@/components/pwn/session";
import { AlertBody } from "@/components/pwn/AlertBody";
import { focusRing, formatRelative, pwnIconTileClass, pwnInsetClass } from "@/components/pwn/format";
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
    solves: "Saber si una cuenta aparece en filtraciones. El detalle es para quien demuestra que es suya.",
    gets: "Sí o no y cuántas; con el objetivo verificado, una ficha por filtración con fecha, datos y fuente.",
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
    does: "Avisa cuando un objetivo que seguís y verificaste aparece en una fuente. Los dominios se revisan solos cada hora; los correos, cuando los consultás.",
    solves: "Enterarte de lo nuevo en tus dominios verificados sin consultarlos a mano.",
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

type SummaryState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: SummaryView }
  | { kind: "failed"; result: Extract<PwnResult<unknown>, { ok: false }> };

export default function PwnDashboardPage() {
  const router = useRouter();
  const session = usePwnSession();
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryState>({ kind: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  // Una sola llamada para todo el panel; una carga nueva cancela la anterior.
  const load = useCallback(async (silent?: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setSummary({ kind: "loading" });
    const response = await pwnFetch("/api/pwn/summary", { signal: controller.signal });
    if (controller.signal.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      setSummary({ kind: "failed", result: response });
      return;
    }
    const data = readSummary(response.data);
    setSummary(
      data ? { kind: "ready", data } : { kind: "failed", result: { ok: false, reason: "error", message: "El resumen tiene un formato inesperado." } },
    );
  }, []);

  // Sin sesión no se pide nada privado: el panel muestra cómo entrar.
  useEffect(() => {
    if (session.status !== "authenticated") return;
    void load();
    return () => controllerRef.current?.abort();
  }, [load, session.status]);

  usePwnFeedRefresh(
    useCallback(() => {
      if (session.status === "authenticated") void load(true);
    }, [load, session.status]),
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

  const signedOut = session.status === "unauthenticated" || (summary.kind === "failed" && summary.result.reason === "unauthorized");
  const data = summary.kind === "ready" ? summary.data : null;

  return (
    <FadeIn className="space-y-20 md:space-y-28">
      {/* Hero: the search is the main action */}
      <section aria-labelledby="pwn-hero-title" className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end xl:gap-14">
        <div className="min-w-0">
          <h1 id="pwn-hero-title" className="mv-h1 max-w-[46rem]">
            Sabé dónde quedó expuesta tu empresa, <span className="mv-gold-text">con la fuente a la vista.</span>
          </h1>
          <p className="mv-lead mt-5">
            Consultá un correo, un dominio o un CVE. Pwn cruza Have I Been Pwned, NVD, el catálogo KEV de CISA y titulares de foros
            permitidos, y te avisa solo sobre lo que seguís.
          </p>

          <div className="mv-panel mt-8 p-4 sm:p-5 md:p-6">
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
            Cualquiera puede consultar: sin verificar ves si aparece y en cuántas filtraciones. El detalle, el patrullaje y las alertas son
            para correos y dominios que demostraste que son tuyos.
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

        <aside aria-label="Cómo trabaja Pwn" className="mv-panel p-5 md:p-6">
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
          title="Tu panel"
          lead="Tus objetivos, lo que se encontró de ellos y tus alertas. Se actualiza cuando el patrullaje encuentra algo nuevo."
          action={
            data ? (
              <Link href="/pwn/alerts" className={`mv-link inline-flex min-h-11 items-center gap-1 text-sm ${focusRing}`}>
                Ver todas las alertas <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : null
          }
        />

        {session.status === "loading" || summary.kind === "loading" ? <LoadingState label="Cargando el resumen…" /> : null}

        {signedOut ? <SignedOutPanel /> : null}

        {summary.kind === "failed" && summary.result.reason === "disabled" ? (
          <DisabledState description="El resumen no está disponible porque Pwn no está activado en este entorno." />
        ) : null}
        {summary.kind === "failed" && summary.result.reason !== "disabled" && summary.result.reason !== "unauthorized" ? (
          <ErrorState message={summary.result.message} onRetry={() => void load()} />
        ) : null}

        {data ? (
          <>
            <PanelVerdict data={data} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Objetivos verificados"
                value={data.counts.provenTargets}
                hint={
                  data.counts.pendingTargets
                    ? `${data.counts.pendingTargets} sin verificar`
                    : data.counts.provenTargets === 0
                      ? "Ninguno todavía"
                      : undefined
                }
                icon={<Target className="h-4 w-4" aria-hidden />}
                href="/pwn/exposure"
              />
              <StatCard
                label="Exposiciones en tus objetivos"
                value={data.counts.exposures}
                hint={data.counts.exposures === 0 ? "Ninguna guardada" : "Filtraciones donde aparecen"}
                icon={<Database className="h-4 w-4" aria-hidden />}
                href="/pwn/exposure"
              />
              <StatCard
                label="Alertas sin leer"
                value={data.counts.unreadAlerts}
                hint={data.counts.unreadAlerts === 0 ? "Todas leídas" : undefined}
                icon={<Eye className="h-4 w-4" aria-hidden />}
                href="/pwn/alerts"
              />
              <StatCard
                label="Alertas"
                value={data.counts.alerts}
                hint={data.counts.alerts === 0 ? "Ninguna todavía" : undefined}
                icon={<BellRing className="h-4 w-4" aria-hidden />}
                href="/pwn/alerts"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FeedPanel alerts={data.recentAlerts} />
              <ForumSignalsPanel result={{ ok: true, data: { items: data.signals } }} loading={false} onRetry={() => void load()} />
            </div>

            <VerifiedPanel items={data.verifiedIntel} />
          </>
        ) : null}
      </section>

      {/* Capabilities */}
      <section aria-labelledby="pwn-capacidades" className="space-y-8">
        <PwnSectionHeading
          id="pwn-capacidades"
          title="Seis módulos, una misma lectura del riesgo."
          lead="Cada módulo responde una pregunta concreta. Empezá por el que te preocupa hoy."
        />
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map(({ href, icon: Icon, name, does, solves, gets }) => (
            <li key={href}>
              <Link href={href} className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className={pwnIconTileClass}>
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
          title="Cada hallazgo cita su fuente."
          lead="Fuentes públicas y nombradas, privacidad desde el navegador y un límite claro entre lo confirmado y lo que solo se afirma."
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="mv-panel p-6 md:p-8">
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
      <section aria-labelledby="pwn-cta" className="mv-panel px-6 py-12 text-center sm:px-10 md:py-16">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <h2 id="pwn-cta" className="mv-h2">
            Empezá por tu propio correo.
          </h2>
          <p className="mv-body mx-auto text-base">
            Consultalo ahora. Si aparece en una filtración, seguilo y confirmá que es tuyo para ver el detalle y recibir las alertas cuando lo vuelvas a consultar.
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
    <li className="mv-panel flex gap-4 p-5">
      <span className={pwnIconTileClass}>
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>
      </div>
    </li>
  );
}

const SIGNED_OUT_PREVIEW = ["Objetivos verificados", "Exposiciones", "Alertas sin leer", "Alertas"];

function SignedOutPanel() {
  return (
    <div className="mv-panel grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
      <div>
        <span className="grid h-11 w-11 place-items-center rounded-[0.875rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
          <LogIn className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mv-h3 mt-5">Iniciá sesión para ver tu panel</h3>
        <p className="mv-body mt-2 max-w-md">
          Tus objetivos, alertas y la patrulla de foros viven en tu cuenta. La búsqueda de arriba funciona sin sesión (solo dice si aparece y en
          cuántas filtraciones).
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
          <li key={label} className="mv-panel p-4">
            <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
            <p className="mt-3 font-display text-3xl font-semibold text-[var(--text-tertiary)]" aria-hidden>
              —
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">Iniciá sesión para verlo</p>
          </li>
        ))}
        <li className="col-span-2 rounded-[0.875rem] border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          También: alertas recientes, patrulla de filtraciones e inteligencia verificada.
        </li>
      </ul>
    </div>
  );
}

/** El veredicto de la cuenta en una línea, como la pantalla de Pwn del celular de la portada. */
function PanelVerdict({ data }: { data: SummaryView }) {
  const { verdict } = data;
  if (verdict.tone === "exposed") {
    return (
      <VerdictTile
        tone="exposed"
        title={verdict.unreadAlerts === 1 ? "1 alerta sin leer en tus objetivos" : `${verdict.unreadAlerts} alertas sin leer en tus objetivos`}
        detail="Revisalas y seguí los pasos que trae cada una."
        action={
          <Link href="/pwn/alerts" className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
            Ver alertas
          </Link>
        }
      />
    );
  }
  if (verdict.tone === "clean") {
    return (
      <VerdictTile
        tone="clean"
        title="Sin filtraciones nuevas"
        detail={
          verdict.provenTargets === 1 ? "En tu objetivo verificado, desde la última alerta que leíste." : `En tus ${verdict.provenTargets} objetivos verificados, desde la última alerta que leíste.`
        }
      />
    );
  }
  return (
    <VerdictTile
      tone="idle"
      title="Todavía no seguís un objetivo verificado"
      detail="Empezá por tu correo: si tu cuenta ya lo confirmó, queda verificado en un toque."
      action={
        <Link href="/pwn/exposure#watch-title" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
          Seguir mi correo
        </Link>
      }
    />
  );
}

function FeedPanel({ alerts }: { alerts: AlertView[] }) {
  return (
    <section aria-labelledby="pwn-feed-title" className="mv-panel flex h-full flex-col p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="pwn-feed-title" className="mv-h3 text-lg">
          Alertas recientes
        </h3>
        <Link href="/pwn/alerts" className={`mv-link inline-flex min-h-11 items-center gap-1 text-sm ${focusRing}`}>
          Ver alertas <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {alerts.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-start justify-center rounded-[0.875rem] border border-dashed border-[var(--mv-hairline-strong)] p-5">
          <p className="text-sm font-medium text-[var(--text-primary)]">Aún no hay alertas.</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Seguí y verificá un correo o un dominio para recibir la primera.</p>
          <Link href="/pwn/exposure" className={`mv-link mt-1 inline-flex min-h-11 items-center text-sm ${focusRing}`}>
            Ir a Exposición
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-[var(--mv-hairline)]">
          {alerts.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-4 first:pt-1 last:pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <p className="flex items-start gap-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
                  {!item.read ? <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--p-alert)]" /> : null}
                  <span>
                    {!item.read ? <span className="sr-only">Sin leer: </span> : null}
                    {item.title}
                  </span>
                </p>
                <time className="mv-data shrink-0 text-xs text-[var(--text-tertiary)]" dateTime={item.createdAt ?? undefined}>
                  {formatRelative(item.createdAt) ?? "Fecha no indicada"}
                </time>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {item.severity ? <RiskBadge level={item.severity} /> : null}
                <SourceBadge source={item.source} />
                {item.targetDisplay ? <span className="mv-data text-xs text-[var(--text-tertiary)]">{item.targetDisplay}</span> : null}
              </div>
              {!item.read ? <AlertBody body={item.body} compact /> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VerifiedPanel({ items }: { items: SummaryView["verifiedIntel"] }) {
  return (
    <section aria-labelledby="pwn-verified-title" className="mv-panel p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="pwn-verified-title" className="mv-h3 text-lg">
            Inteligencia verificada reciente
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Filtraciones del catálogo confirmadas o corroboradas por la fuente. No son exposiciones tuyas.</p>
        </div>
        <Link href="/pwn/breaches" className={`mv-link inline-flex min-h-11 items-center gap-1 text-sm ${focusRing}`}>
          Ver filtraciones <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className={`mt-4 ${pwnInsetClass} border-dashed border-[var(--mv-hairline-strong)] text-sm text-[var(--text-secondary)]`}>
          No hay inteligencia verificada reciente.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className={`flex flex-col justify-between gap-3 ${pwnInsetClass} p-4`}>
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
