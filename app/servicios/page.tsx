"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Code, PenTool, TrendingUp, Video, Camera, Cpu, Star, Clock, Package, Lock, CheckCheck, MonitorPlay, X } from "lucide-react";
import { Container, PageHero, ButtonLink, buttonClass } from "@/components/site/primitives";
import { CardSkeletonGrid, EmptyState, MediaFrame, SERVICE_CATEGORY_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";
import { cn } from "@/lib/utils";

const CATEGORIES_BASE = [
  { icon: Code, name: "Desarrollo Web", key: "DESARROLLO_WEB" },
  { icon: PenTool, name: "Diseño Gráfico", key: "DISENO" },
  { icon: TrendingUp, name: "Marketing Digital", key: "MARKETING" },
  { icon: Video, name: "Edición de Video", key: "VIDEO" },
  { icon: Camera, name: "Fotografía", key: "FOTOGRAFIA" },
  { icon: Cpu, name: "Inteligencia Artificial", key: "IA" },
];

const HOW = [
  { icon: Package, title: "Elegí un paquete", body: "Precio, plazo de entrega y revisiones definidos de antemano." },
  { icon: Lock, title: "Pagá con Stripe", body: "El pago queda en custodia mientras se hace el trabajo." },
  { icon: CheckCheck, title: "Aprobá cada hito", body: "Los fondos se liberan al profesional cuando entrega." },
];

export default function ServiciosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    // El skeleton depende de ambos pedidos: antes se apagaba con /count y, si /api/services
    // tardaba más, se mostraba "sin servicios" mientras todavía cargaba.
    const getJson = (url: string) => fetch(url).then(res => (res.ok ? res.json() : null));
    Promise.allSettled([getJson('/api/services'), getJson('/api/services/count')]).then(([servicesRes, countsRes]) => {
      if (cancelled) return;
      if (servicesRes.status === 'fulfilled' && servicesRes.value?.success) setServices(servicesRes.value.data);
      else if (servicesRes.status === 'rejected') console.error(servicesRes.reason);
      if (countsRes.status === 'fulfilled' && countsRes.value?.success) setCategoryCounts(countsRes.value.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const count = filteredServices.length;

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Services"
        title={
          <>
            Talento digital, <span className="mv-gold-text">pagado por hitos.</span>
          </>
        }
        lead="Desarrollo, diseño, marketing y video con paquetes de precio cerrado. Tu pago queda en custodia y se libera hito por hito, cuando el trabajo se entrega."
        actions={
          <>
            <ButtonLink href="/servicios/publicar" size="lg" className="w-full sm:w-auto">
              Ofrecer un servicio
            </ButtonLink>
            <ButtonLink href="/servicios/mis-servicios" tone="secondary" size="lg" className="w-full sm:w-auto">
              Mis servicios
            </ButtonLink>
          </>
        }
        aside={
          <ol className="mv-panel flex flex-col gap-5 p-6 md:p-7" aria-label="Cómo funciona el pago por hitos">
            {HOW.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    <span className="mv-data mr-2 text-[var(--text-tertiary)]">0{i + 1}</span>
                    {title}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        }
      />

      <section aria-labelledby="svc-results" className="pb-14 md:pb-24">
        <Container>
          <form
            role="search"
            aria-label="Buscar servicios"
            onSubmit={(e) => e.preventDefault()}
            className="mv-menu relative z-30 flex items-center gap-1 rounded-full p-2 md:sticky md:top-[5.5rem]"
          >
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full px-4 focus-within:bg-[var(--mv-panel-hover)]">
              <Search className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span className="sr-only">Qué servicio buscás</span>
              <input
                type="search"
                placeholder="Landing page, logo, campaña en redes…"
                className="h-full w-full min-w-0 bg-transparent text-[0.9375rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                enterKeyHint="search"
              />
            </label>
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery("")} className={buttonClass("ghost", "sm", "shrink-0")}>
                <X className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Borrar</span>
                <span className="sr-only sm:hidden">Borrar búsqueda</span>
              </button>
            ) : null}
          </form>

          <fieldset className="mt-6 min-w-0">
            <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Explorar por categoría</legend>
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {CATEGORIES_BASE.map((cat) => {
                const Icon = cat.icon;
                const term = cat.name.split(" ")[0];
                const on = searchQuery === term;
                const n = categoryCounts[cat.key] || 0;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSearchQuery(on ? "" : term)}
                    className={cn(
                      "mv-focus flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                      on
                        ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                        : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    <Icon className="h-4 w-4 text-gold" aria-hidden />
                    {labelFor(SERVICE_CATEGORY_LABEL, cat.key)}
                    <span className="mv-data text-xs text-[var(--text-tertiary)]">{n}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mv-divider mt-8" aria-hidden />

          <h2 id="svc-results" className="mt-6 text-sm text-[var(--text-secondary)]" aria-live="polite">
            {loading ? (
              "Buscando servicios…"
            ) : (
              <>
                <span className="mv-data font-semibold text-[var(--text-primary)]">{count}</span>{" "}
                {count === 1 ? "servicio disponible" : "servicios disponibles"}
              </>
            )}
          </h2>

          <div className="mt-6">
            {loading ? (
              <CardSkeletonGrid />
            ) : services.length === 0 ? (
              <EmptyState
                icon={MonitorPlay}
                title="Todavía no hay servicios publicados"
                body="Si desarrollás, diseñás o hacés marketing, publicá el primero. Armás tu paquete con precio y plazo, y cobrás por hitos con el pago en custodia."
                action={
                  <ButtonLink href="/servicios/publicar" className="w-full sm:w-auto">
                    Publicar el primer servicio
                  </ButtonLink>
                }
                secondary={
                  <ButtonLink href="/empleos" tone="ghost" className="w-full sm:w-auto">
                    Ver Jobs
                  </ButtonLink>
                }
              />
            ) : count === 0 ? (
              <EmptyState
                icon={Search}
                title="Ningún servicio coincide con tu búsqueda"
                body="Probá con otra palabra o elegí una categoría."
                action={
                  <button type="button" onClick={() => setSearchQuery("")} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
                    Ver todos los servicios
                  </button>
                }
              />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredServices.map((service) => {
                  const pkg = service.packages?.[0];
                  const price = formatMoney(pkg?.price);
                  const ratings: number[] = (service.reviews || []).map((r: any) => r.rating).filter((r: any) => typeof r === "number");
                  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
                  return (
                    <li key={service.id} className="mv-panel mv-panel-interactive group relative flex flex-col overflow-hidden">
                      <MediaFrame src={service.images?.[0]?.url} alt="" ratio="aspect-[16/10]" icon={MonitorPlay}>
                        <span className="mv-chip absolute left-3 top-3 border-white/15 bg-black/55 text-white backdrop-blur-md">
                          {labelFor(SERVICE_CATEGORY_LABEL, service.category)}
                        </span>
                      </MediaFrame>
                      <div className="flex flex-1 flex-col gap-4 p-5">
                        <div className="flex items-center gap-2.5">
                          {service.provider?.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={service.provider.avatar} alt="" loading="lazy" decoding="async" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-[var(--mv-panel-hover)] text-xs font-semibold text-[var(--text-secondary)]">
                              {(service.provider?.name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="truncate text-sm text-[var(--text-secondary)]">{service.provider?.name || "Profesional"}</span>
                        </div>
                        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)]">
                          <Link href={`/servicios/${service.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                            {service.title}
                          </Link>
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                          {avg !== null ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                              <span className="mv-data font-semibold text-[var(--text-primary)]">{avg.toFixed(1)}</span>
                              <span>({ratings.length})</span>
                            </span>
                          ) : (
                            <span>Sin reseñas todavía</span>
                          )}
                          {pkg?.deliveryDays ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden />
                              Entrega en <span className="mv-data">{pkg.deliveryDays}</span> {pkg.deliveryDays === 1 ? "día" : "días"}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-auto flex items-baseline justify-between gap-3 border-t border-[var(--mv-hairline)] pt-4">
                          <span className="text-xs text-[var(--text-tertiary)]">Desde</span>
                          <span className="mv-data text-lg font-semibold text-[var(--text-primary)]">{price ?? "A consultar"}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
// Sistema Mercav Servicios - creado por pato dev y askforvini
