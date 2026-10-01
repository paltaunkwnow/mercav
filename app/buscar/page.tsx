"use client";

import { useState, useEffect, Suspense } from "react";
import { Search, Users, Briefcase, MonitorPlay, Megaphone, ArrowRight, MapPin, type LucideIcon } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container, ButtonLink } from "@/components/site/primitives";
import { BackLink, CardSkeletonGrid, EmptyState, MediaFrame, SPACE_TYPE_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";
import { cn } from "@/lib/utils";

function ResultGroup({ id, icon: Icon, title, href, linkLabel, children }: { id: string; icon: LucideIcon; title: string; href?: string; linkLabel?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="flex items-center gap-3 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] md:text-2xl">
          <Icon className="h-5 w-5 text-gold" aria-hidden />
          {title}
        </h2>
        {href && linkLabel ? (
          <Link href={href} className="mv-link shrink-0 text-sm">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Initial({ name, className }: { name?: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center bg-[var(--mv-panel-hover)] font-semibold text-[var(--text-secondary)]", className)}>
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
import { SeekField } from "@/components/motion/SeekField";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // La URL manda: si cambia ?q= (por ejemplo desde el buscador del header) se sincroniza el
  // campo, y una respuesta vieja no puede pisar los resultados de la búsqueda nueva.
  useEffect(() => {
    setQuery(initialQuery);
    if (!initialQuery) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(initialQuery)}&tipo=all`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setResults(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialQuery]);

  const tabs = [
    { id: "all", label: "Todo", icon: Search },
    { id: "users", label: "Personas", icon: Users },
    { id: "jobs", label: "Empleos", icon: Briefcase },
    { id: "services", label: "Servicios", icon: MonitorPlay },
    { id: "spaces", label: "Anuncios", icon: Megaphone },
  ];

  const renderEmpty = () => (
    <EmptyState
      icon={Search}
      title="No encontramos resultados"
      body="Probá con otras palabras o recorré los catálogos de cada módulo."
      action={
        <ButtonLink href="/explorar" tone="secondary" className="w-full sm:w-auto">
          Explorar categorías
        </ButtonLink>
      }
    />
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h1 className="mv-h1">
          {initialQuery ? (
            <>
              Resultados para <span className="text-gold">“{initialQuery}”</span>
            </>
          ) : (
            "Buscar en Mercav"
          )}
        </h1>
        <div className="flex justify-start">
          <SeekField
            defaultOpen
            value={query}
            onValueChange={setQuery}
            onSubmit={(next) => router.push(`/buscar?q=${encodeURIComponent(next)}`)}
            placeholder="¿Qué estás buscando en Mercav?"
            shut={64}
            openWidth={640}
            persistent
          />
        </div>

        {/* Filter by type */}
        <div role="group" aria-label="Filtrar por tipo" className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map((tab) => {
            const on = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "mv-focus flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                  on
                    ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                    : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                <tab.icon className="h-4 w-4 text-gold" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mv-divider" aria-hidden />

      {/* Results */}
      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <CardSkeletonGrid count={3} />
        ) : results ? (
          <div className="flex flex-col gap-14">
            {/* Users Section */}
            {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
              <ResultGroup id="r-users" icon={Users} title="Personas y profesionales">
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.users.map((u: any) => (
                    <li key={u.id} className="mv-panel mv-panel-interactive relative flex flex-col gap-4 p-5">
                      <div className="flex items-center gap-4">
                        {u.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                        ) : (
                          <Initial name={u.name} className="h-14 w-14 rounded-2xl text-lg" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-[var(--text-primary)]">
                            <Link href={`/perfil/${u.username || u.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                              {u.name}
                            </Link>
                          </h3>
                          <p className="truncate text-sm text-[var(--text-secondary)]">{u.profile?.headline || "Usuario de Mercav"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        {u.location || u.country ? (
                          <span className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                            <span className="truncate">{u.location || u.country}</span>
                          </span>
                        ) : (
                          <span />
                        )}
                        <ButtonLink href={`/mensajes?to=${u.id}`} tone="secondary" size="sm" className="relative z-10">
                          Escribir
                        </ButtonLink>
                      </div>
                    </li>
                  ))}
                </ul>
              </ResultGroup>
            )}

            {/* Jobs Section */}
            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs?.length > 0 && (
              <ResultGroup id="r-jobs" icon={Briefcase} title="Vacantes" href="/empleos" linkLabel="Ver todas las vacantes">
                <ul className="flex flex-col gap-3">
                  {results.jobs.map((j: any) => (
                    <li key={j.id} className="mv-panel mv-panel-interactive group relative flex items-center gap-4 p-5">
                      {j.company?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={j.company.avatar} alt="" loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
                      ) : (
                        <Initial name={j.company?.name} className="h-12 w-12 rounded-2xl" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-[var(--text-primary)] md:text-lg">
                          <Link href={`/empleos/${j.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                            {j.title}
                          </Link>
                        </h3>
                        <p className="flex flex-wrap items-center gap-x-3 text-sm text-[var(--text-secondary)]">
                          {j.company?.name ? <span>{j.company.name}</span> : null}
                          {j.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden /> {j.city}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </li>
                  ))}
                </ul>
              </ResultGroup>
            )}

            {/* Services Section */}
            {(activeTab === 'all' || activeTab === 'services') && results.services?.length > 0 && (
              <ResultGroup id="r-services" icon={MonitorPlay} title="Servicios" href="/servicios" linkLabel="Ver todos los servicios">
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.services.map((s: any) => {
                    const price = formatMoney(s.packages?.[0]?.price);
                    return (
                      <li key={s.id} className="mv-panel mv-panel-interactive relative flex flex-col gap-4 p-5">
                        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)]">
                          <Link href={`/servicios/${s.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                            {s.title}
                          </Link>
                        </h3>
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--mv-hairline)] pt-4">
                          <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-secondary)]">
                            {s.provider?.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.provider.avatar} alt="" loading="lazy" decoding="async" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <Initial name={s.provider?.name} className="h-6 w-6 rounded-full text-xs" />
                            )}
                            <span className="truncate">{s.provider?.name}</span>
                          </span>
                          <span className="mv-data shrink-0 text-sm font-semibold text-[var(--text-primary)]">{price ? `Desde ${price}` : "A consultar"}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ResultGroup>
            )}

            {/* Spaces Section */}
            {(activeTab === 'all' || activeTab === 'spaces') && results.spaces?.length > 0 && (
              <ResultGroup id="r-spaces" icon={Megaphone} title="Espacios publicitarios" href="/anuncios" linkLabel="Ver todos los espacios">
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.spaces.map((sp: any) => (
                    <li key={sp.id} className="mv-panel mv-panel-interactive group relative flex flex-col overflow-hidden">
                      <MediaFrame src={sp.images?.[0]?.url} alt="" icon={Megaphone} />
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <span className="mv-chip w-fit">{labelFor(SPACE_TYPE_LABEL, sp.type)}</span>
                        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)]">
                          <Link href={`/anuncios/${sp.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                            {sp.title}
                          </Link>
                        </h3>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden /> {sp.city}
                          </span>
                          <span className="mv-data font-semibold text-[var(--text-primary)]">
                            {formatMoney(sp.pricePerMonth, sp.currency) ?? "A consultar"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ResultGroup>
            )}

            {/* If no results in the active tab */}
            {activeTab !== 'all' && results[activeTab]?.length === 0 && renderEmpty()}
            {activeTab === 'all' && 
              Object.values(results).every((arr: any) => arr.length === 0) && 
              renderEmpty()
            }
          </div>
        ) : initialQuery ? (
          renderEmpty()
        ) : (
          <EmptyState
            icon={Search}
            title="Escribí algo para empezar"
            body="Buscamos a la vez en personas, vacantes, servicios y espacios publicitarios."
          />
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-28 md:pb-24 md:pt-36">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <div className="mb-8">
          <BackLink href="/dashboard">Volver al panel</BackLink>
        </div>
        <Suspense fallback={<CardSkeletonGrid count={3} />}>
          <SearchContent />
        </Suspense>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
