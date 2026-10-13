"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, BadgeCheck, CalendarDays, Clock, ExternalLink, Globe, MapPin, MessagesSquare, Navigation, PencilLine, Phone, Share2, ShieldCheck } from "@/components/icons";
import { toast } from "sonner";
import type { KosherStatus, KosherStockCategory } from "@prisma/client";
import { cityThreadKey, placeThreadKey } from "@/lib/kosher/geo";
import { DENOMINATION, EVENT_KIND, FOOD, KOSHER_SERVICES, NUSACH, PLACE_TYPES, STATUS, STATUS_HINT, STATUS_ORDER, STOCK, STOCK_STALE_DAYS, STREAM, isFoodPlace, priceLabel, streetAddress } from "@/lib/kosher/labels";
import { formatDateTime } from "@/lib/kosher/time";
import { InviteButton } from "@/components/kosher/CommunityForms";
import { EDITABLE_FIELDS, type EditableField } from "@/lib/kosher/edits";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { Stars, StatusBadge } from "@/components/kosher/StatusBadge";
import { ThreadView } from "@/components/kosher/ThreadView";
import { NearbyPlaces } from "@/components/kosher/place/NearbyPlaces";
import { PhotoGallery } from "@/components/kosher/place/PhotoGallery";
import { HoursTable, OpenNow, useNow } from "@/components/kosher/place/PlaceHours";
import { SaveButton } from "@/components/kosher/place/SaveButton";
import type { PlaceDetail, PlaceReview, PlaceStock } from "@/components/kosher/place/types";
import { placePath } from "@/components/kosher/place/urls";
import { fieldClass, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { cn } from "@/lib/utils";

function relativeDays(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}

/** En la página del lugar el nombre es el h1 y las secciones h2; en el panel del mapa, h2 y h3. */
const SectionHeading = createContext<"h2" | "h3">("h3");

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  const Heading = useContext(SectionHeading);
  return (
    <section className="border-t border-[var(--mv-hairline)] pt-5">
      <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Heading className="text-sm font-semibold text-[var(--text-primary)]">{title}</Heading>
        {action}
      </div>
      {children}
    </section>
  );
}

const actionButton =
  "mv-focus flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-xs font-semibold leading-tight transition-[transform,border-color] duration-150 active:scale-[0.97] disabled:opacity-60";
const actionSecondary = cn(actionButton, "border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-primary)] hover:border-[var(--color-border-gold)]");

/**
 * Ficha de un lugar. En la página del lugar llega `initial` desde el servidor y el primer render ya trae todo;
 * en el mapa se pide a /api/kosher/places/[slug] al abrirla.
 */
export function PlacePanel({ slug, onClose, standalone = false, initial }: { slug: string; onClose?: () => void; standalone?: boolean; initial?: PlaceDetail }) {
  const viewer = useKosherViewer();
  const reduce = useReducedMotion();
  const fromServer = initial?.place.slug === slug ? initial : null;
  const [detail, setDetail] = useState<PlaceDetail | null>(fromServer);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "chat">("info");
  const loadedSlug = useRef<string | null>(fromServer ? slug : null);
  const now = useNow(fromServer?.renderedAt ?? null);
  const canWrite = viewer.signedIn && !viewer.shabbatLocked;

  const load = useCallback(async () => {
    try {
      const data = await kosherFetch<PlaceDetail>(`/api/kosher/places/${slug}`);
      setDetail(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug]);

  useEffect(() => {
    // Si el servidor ya mandó esta ficha, no se pide de nuevo.
    if (loadedSlug.current === slug) return;
    loadedSlug.current = slug;
    setDetail(null);
    setTab("info");
    load();
  }, [slug, load]);

  if (error) return <p role="alert" className="p-6 text-sm text-[var(--text-secondary)]">{error}</p>;
  if (!detail) {
    return (
      <div className="space-y-3 p-6" aria-busy aria-label="Cargando la ficha">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-[var(--mv-panel-hover)]" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[var(--mv-panel-hover)]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--mv-panel-hover)]" />
      </div>
    );
  }

  const { place, stock, reviews, events, managedByMe, timezone, photos, nearby, savedByMe } = detail;
  const Title = standalone ? "h1" : "h2";
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const isFood = isFoodPlace(place.type);
  const certExpired = !!place.certExpiresAt && new Date(place.certExpiresAt).getTime() < Date.now();
  const sourceHost = place.sourceUrl ? new URL(place.sourceUrl).hostname.replace(/^www\./, "") : null;
  const price = priceLabel(place.priceLevel);
  const pagePath = placePath(place.slug);
  const returnPath = standalone ? pagePath : `/kosher/mapa?lugar=${place.slug}`;

  async function share() {
    const url = `${window.location.origin}${pagePath}`;
    try {
      if (navigator.share) await navigator.share({ title: place.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace copiado");
      }
    } catch {
      /* person dismissed the share sheet */
    }
  }

  return (
    <SectionHeading.Provider value={standalone ? "h2" : "h3"}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-5 pb-4 pt-5 md:px-6">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold ring-1 ring-inset ring-gold/20">
              <PlaceIcon type={place.type} className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-secondary)]">{PLACE_TYPES[place.type]}</p>
              <Title className="font-display text-xl font-semibold leading-tight tracking-tight text-[var(--text-primary)]">{place.name}</Title>
              {place.nameLocal && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{place.nameLocal}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha"
                className="mv-focus -mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={place.status} type={place.type} verified={!!place.verifiedAt} />
            {place.foodCategory && (
              <span className="mv-chip h-6">
                {FOOD[place.foodCategory]}
              </span>
            )}
            {place.managed && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-techelet-dim px-2.5 text-xs font-semibold text-techelet ring-1 ring-inset ring-techelet/30">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Ficha oficial
              </span>
            )}
            {place.glatt && <span className="mv-chip h-6">Glatt</span>}
            {place.beitYosef && <span className="mv-chip h-6">Beit Yosef</span>}
            {price && (
              <span className="mv-chip h-6">
                <span aria-hidden>{price}</span>
                <span className="sr-only">Precio: {place.priceLevel} de 4</span>
              </span>
            )}
            {place.reviewCount > 0 && place.rating != null && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Stars value={place.rating} /> {place.rating.toFixed(1)} · {place.reviewCount} {place.reviewCount === 1 ? "valoración" : "valoraciones"}
              </span>
            )}
          </div>
          {place.hours && (
            <p className="mt-3">
              <OpenNow hours={place.hours} timezone={place.timezone} now={now} />
            </p>
          )}

          {isFood && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {place.status === "certified" && place.agencyName ? (
                <>
                  Certificado por <strong className="font-semibold text-[var(--text-primary)]">{place.agencyName}</strong>
                  {place.confirmedAt && !place.sourceUrl ? `, confirmado ${relativeDays(place.confirmedAt)}.` : "."}
                </>
              ) : (
                STATUS_HINT[place.status]
              )}
            </p>
          )}
          {isFood && place.status === "certified" && place.certExpiresAt && (
            <p
              className={cn(
                "mt-3 flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[13px]",
                certExpired ? "border border-amber-500/30 bg-amber-500/10 text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
              )}
            >
              {certExpired ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-techelet" aria-hidden />}
              <span suppressHydrationWarning>
                {certExpired ? "El certificado cargado venció el " : "Certificado vigente hasta el "}
                {new Date(place.certExpiresAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.
                {certExpired && " Confirmá con la agencia antes de ir."}
                {place.certificateUrl && (
                  <>
                    {" "}
                    <a href={place.certificateUrl} target="_blank" rel="noreferrer nofollow" className="font-semibold text-techelet underline underline-offset-4">
                      Ver certificado
                    </a>
                  </>
                )}
              </span>
            </p>
          )}
          {place.sourceUrl && place.verifiedAt && (
            <a
              href={place.sourceUrl}
              target="_blank"
              rel="noreferrer nofollow"
              className="mv-focus mt-3 flex items-center gap-2 rounded-2xl border border-techelet/25 bg-techelet-dim px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] transition-colors hover:border-techelet/50"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-techelet" aria-hidden />
              <span className="min-w-0 flex-1">
                Verificado en <strong className="font-semibold">{sourceHost}</strong>
                <span className="text-[var(--text-secondary)]" suppressHydrationWarning> · {new Date(place.verifiedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", timeZone: timezone })}</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
            </a>
          )}

          <div className="mt-4 grid grid-cols-4 gap-2">
            <a href={directions} target="_blank" rel="noreferrer" className={cn(actionButton, "bg-gold text-[var(--mv-on-gold)]")}>
              <Navigation className="h-4 w-4" aria-hidden />
              Cómo llegar
            </a>
            {place.phone ? (
              <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className={actionSecondary}>
                <Phone className="h-4 w-4" aria-hidden />
                Llamar
              </a>
            ) : place.website ? (
              <a href={place.website} target="_blank" rel="noreferrer nofollow" className={actionSecondary}>
                <Globe className="h-4 w-4" aria-hidden />
                Sitio web
              </a>
            ) : (
              <button type="button" onClick={() => setTab("chat")} className={actionSecondary}>
                <MessagesSquare className="h-4 w-4" aria-hidden />
                Chat
              </button>
            )}
            <SaveButton slug={place.slug} initialSaved={savedByMe} callbackUrl={returnPath} className={actionSecondary} />
            <button type="button" onClick={share} className={actionSecondary}>
              <Share2 className="h-4 w-4" aria-hidden />
              Compartir
            </button>
          </div>

          <div role="tablist" aria-label="Ficha del lugar" className="relative mt-5 grid grid-cols-2 rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-1">
            {(["info", "chat"] as const).map((key) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn("mv-focus relative h-10 rounded-full text-sm font-semibold transition-colors duration-200", tab === key ? "text-[var(--mv-on-gold)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
              >
                {tab === key && (
                  <motion.span
                    layoutId={`place-tab-${standalone ? "page" : "sheet"}`}
                    className="absolute inset-0 rounded-full bg-gold"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 36 }}
                  />
                )}
                <span className="relative">{key === "info" ? "Información" : "Conversación"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-5 pb-8 md:px-6">
          {tab === "chat" ? (
            <div className="space-y-4 pt-1">
              <ThreadView threadKey={placeThreadKey(place.slug)} compact />
              <Link
                href={`/kosher/chat?sala=${encodeURIComponent(cityThreadKey(place.city, place.countryCode))}`}
                className="mv-focus flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[var(--mv-hairline-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--color-border-gold)]"
              >
                Conversación de {place.city}
                <ExternalLink className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="space-y-5 pt-1">
              <PhotoGallery photos={photos} name={place.name} />

              <ul className="space-y-2.5 text-sm">
                <li className="flex gap-3 text-[var(--text-primary)]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                  <span>
                    {streetAddress(place)}
                    <span className={streetAddress(place) ? "block text-[var(--text-secondary)]" : "block"}>
                      {place.city}, {place.country}
                    </span>
                  </span>
                </li>
                {place.phone && (
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                    <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="text-[var(--text-primary)] hover:text-gold">{place.phone}</a>
                  </li>
                )}
                {place.website && (
                  <li className="flex min-w-0 gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                    <a href={place.website} target="_blank" rel="noreferrer nofollow" className="truncate text-[var(--text-primary)] hover:text-gold">
                      {place.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>

              {place.hours && (
                <Section title="Horarios" action={<OpenNow hours={place.hours} timezone={place.timezone} now={now} />}>
                  <HoursTable hours={place.hours} timezone={place.timezone} now={now} city={place.city} />
                </Section>
              )}

              {place.services.length > 0 && (
                <Section title="Servicios">
                  <ul className="flex flex-wrap gap-2">
                    {place.services.map((key) => (
                      <li key={key} className="mv-chip">
                        {KOSHER_SERVICES[key]}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {place.notes && <p className="rounded-2xl bg-[var(--mv-panel)] ring-1 ring-inset ring-[var(--mv-hairline)] px-4 py-3 text-sm leading-relaxed text-[var(--text-secondary)]">{place.notes}</p>}
              {place.chainName && place.type === "grocery_branch" && (
                <p className="rounded-2xl border border-techelet/25 bg-techelet-dim px-4 py-3 text-sm text-[var(--text-primary)]">
                  {place.chainName}: el stock se reporta por sucursal. Una cadena no es una cocina kosher.
                </p>
              )}

              {(place.nusach || place.denomination || place.prayerTimes) && (
                <Section title="Tefilá">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {place.nusach && (
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)]">Nusaj</dt>
                        <dd className="text-[var(--text-primary)]">{NUSACH[place.nusach]}</dd>
                      </div>
                    )}
                    {(place.orthodoxStream || place.denomination) && (
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)]">Corriente</dt>
                        <dd className="text-[var(--text-primary)]">
                          {place.orthodoxStream ? STREAM[place.orthodoxStream] : DENOMINATION[place.denomination!]}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {place.prayerTimes && (
                    <ul className="mt-3 grid grid-cols-3 gap-2">
                      {(["shacharit", "mincha", "maariv"] as const).map((k) =>
                        place.prayerTimes?.[k] ? (
                          <li key={k} className="rounded-2xl bg-[var(--mv-panel)] ring-1 ring-inset ring-[var(--mv-hairline)] px-3 py-2.5 text-center">
                            <span className="block text-xs text-[var(--text-secondary)]">{{ shacharit: "Shajarit", mincha: "Minjá", maariv: "Arvit" }[k]}</span>
                            <span className="mv-data text-sm text-[var(--text-primary)]">{place.prayerTimes[k]}</span>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  )}
                </Section>
              )}

              {events.length > 0 && (
                <Section title="Próximamente acá">
                  <ul className="space-y-2">
                    {events.map((e) => (
                      <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-[var(--mv-hairline)] px-4 py-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-techelet" aria-hidden />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[var(--text-primary)]">{e.title}</span>
                          <span className="text-xs text-[var(--text-secondary)]" suppressHydrationWarning>
                            {EVENT_KIND[e.kind]} · {formatDateTime(e.startsAt, timezone)}
                            {e.official && " · Oficial"}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {place.type === "grocery_branch" && <StockSection slug={place.slug} stock={stock} canWrite={canWrite} onChange={load} />}

              {isFood && <ReviewsSection slug={place.slug} reviews={reviews} canWrite={canWrite} onChange={load} />}

              {nearby.length > 0 && (
                <Section title="Cerca de acá">
                  <NearbyPlaces places={nearby} />
                </Section>
              )}

              <SuggestEdit slug={place.slug} canWrite={canWrite} returnPath={returnPath} />

              <section className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                <Link
                  href={`/kosher/lugar/${place.slug}/administrar`}
                  className="mv-focus flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[var(--mv-hairline-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--color-border-gold)]"
                >
                  {managedByMe ? "Administrar esta ficha" : place.managed ? "¿Sos parte del equipo? Pedí acceso" : "¿Es tu lugar? Administrá la ficha"}
                  <BadgeCheck className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
                </Link>
                {viewer.isModerator && <InviteButton slug={place.slug} />}
              </section>

              {place.source === "osm" && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  Datos:{" "}
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="mv-link">
                    © colaboradores de OpenStreetMap
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </SectionHeading.Provider>
  );
}

function StockSection({ slug, stock, canWrite, onChange }: { slug: string; stock: PlaceStock[]; canWrite: boolean; onChange: () => void }) {
  const [category, setCategory] = useState<KosherStockCategory>("wine");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await kosherFetch(`/api/kosher/places/${slug}/stock`, { method: "POST", json: { category, note } });
      setNote("");
      toast.success("Gracias. Tu reporte ya está visible.");
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(id: string) {
    try {
      await kosherFetch(`/api/kosher/stock/${id}/confirm`, { method: "POST" });
      toast.success("Confirmado. Sigue ahí.");
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Section title="Stock en esta sucursal">
      <ul className="space-y-2">
        {stock.length === 0 && <li className="text-sm text-[var(--text-secondary)]">Nadie reportó stock todavía.</li>}
        {stock.map((s) => {
          const stale = Date.now() - new Date(s.confirmedAt).getTime() > STOCK_STALE_DAYS * 86_400_000;
          return (
            <li key={s.id} className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{STOCK[s.category]}</span>
                <span className={cn("inline-flex items-center gap-1 text-xs", stale ? "text-amber-500" : "text-emerald-500")}>
                  <Clock className="h-3 w-3" aria-hidden />
                  {stale ? "Puede estar desactualizado" : `Confirmado ${relativeDays(s.confirmedAt)}`}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.note}</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
                <span>
                  {s.authorName} · {s.confirmations} {s.confirmations === 1 ? "confirmación" : "confirmaciones"}
                </span>
                {canWrite && (
                  <button
                    type="button"
                    disabled={s.confirmedByMe}
                    onClick={() => confirm(s.id)}
                    className={cn(secondaryButton, "h-9 px-3 text-xs")}
                  >
                    {s.confirmedByMe ? "Ya confirmaste" : "Sigue ahí"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {canWrite && (
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-3">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`stock-cat-${slug}`}>Categoría</label>
            <select id={`stock-cat-${slug}`} value={category} onChange={(e) => setCategory(e.target.value as KosherStockCategory)} className={cn(fieldClass, "h-11 w-36 shrink-0 text-sm")}>
              {Object.entries(STOCK).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor={`stock-note-${slug}`}>Qué viste</label>
            <input id={`stock-note-${slug}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Qué viste y dónde (pasillo, marca)" className={cn(fieldClass, "h-11 min-w-0 flex-1 text-sm")} />
          </div>
          <button type="submit" disabled={busy || note.trim().length < 3} className={cn(primaryButton, "w-full")}>
            Reportar stock
          </button>
        </form>
      )}
    </Section>
  );
}

function ReviewsSection({ slug, reviews, canWrite, onChange }: { slug: string; reviews: PlaceReview[]; canWrite: boolean; onChange: () => void }) {
  const mine = reviews.find((r) => r.mine);
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(mine?.body ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    try {
      await kosherFetch(`/api/kosher/places/${slug}/reviews`, { method: "POST", json: { rating, body } });
      toast.success(mine ? "Actualizaste tu valoración." : "Gracias por tu valoración.");
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Valoraciones de la comunidad">
      {canWrite && (
        <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">{mine ? "Tu valoración" : "¿Cómo fue tu experiencia?"}</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Estrellas" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
                onMouseEnter={() => setHover(i)}
                onClick={() => setRating(i)}
                className="mv-focus grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-90"
              >
                <svg viewBox="0 0 20 20" className={cn("h-7 w-7 transition-colors", (hover || rating) >= i ? "text-gold" : "text-[var(--text-tertiary)]")} aria-hidden>
                  <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8L10 1.8z" fill={(hover || rating) >= i ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor={`review-${slug}`}>Comentario</label>
          <textarea id={`review-${slug}`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} rows={2} placeholder="Comida, atención, cómo se maneja la kashrut… (opcional)" className={cn(fieldClass, "h-auto resize-none py-2.5 text-sm")} />
          <button type="submit" disabled={busy || !rating} className={cn(primaryButton, "w-full")}>
            {mine ? "Actualizar" : "Publicar valoración"}
          </button>
        </form>
      )}
      <ul className="space-y-3">
        {reviews.length === 0 && <li className="text-sm text-[var(--text-secondary)]">Todavía sin valoraciones. La primera ayuda a toda la comunidad.</li>}
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-[var(--mv-hairline)] px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{r.mine ? "Vos" : r.author}</span>
              <Stars value={r.rating} />
            </div>
            {r.body && <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{r.body}</p>}
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">{relativeDays(r.updatedAt)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Estados que una persona puede sugerir: todos menos "certificado", que solo sale de un certificado revisado. */
const SUGGESTABLE_STATUS = STATUS_ORDER.filter((s) => s !== "certified" && (EDITABLE_FIELDS.status.options as readonly string[]).includes(s));

function SuggestEdit({ slug, canWrite, returnPath }: { slug: string; canWrite: boolean; returnPath: string }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<EditableField>("status");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const options = EDITABLE_FIELDS[field].options;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await kosherFetch(`/api/kosher/places/${slug}/edits`, { method: "POST", json: { field, newValue: value, note } });
      toast.success("Enviado. Un moderador lo revisa antes de publicarlo.");
      setOpen(false);
      setValue("");
      setNote("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!canWrite) {
    return (
      <p className="border-t border-[var(--mv-hairline)] pt-5 text-sm text-[var(--text-secondary)]">
        ¿Algo cambió? <Link href={`/login?callbackUrl=${encodeURIComponent(returnPath)}`} className="mv-link">Entrá con Mercav</Link> para sugerir una corrección.
      </p>
    );
  }

  return (
    <Section
      title="¿Algo cambió?"
      action={
        !open && (
          <button type="button" onClick={() => setOpen(true)} className={cn(secondaryButton, "h-9 px-3 text-xs")}>
            <PencilLine className="h-3.5 w-3.5" aria-hidden /> Sugerir cambio
          </button>
        )
      }
    >
      {open ? (
        <form onSubmit={submit} className="space-y-2">
          <label className="sr-only" htmlFor={`edit-field-${slug}`}>Campo</label>
          <select
            id={`edit-field-${slug}`}
            value={field}
            onChange={(e) => {
              setField(e.target.value as EditableField);
              setValue("");
            }}
            className={cn(fieldClass, "h-11 text-sm")}
          >
            {Object.entries(EDITABLE_FIELDS).map(([k, spec]) => (
              <option key={k} value={k}>{spec.label}</option>
            ))}
          </select>
          {options ? (
            <>
              <select aria-label="Nuevo estado" aria-describedby={`edit-status-hint-${slug}`} value={value} onChange={(e) => setValue(e.target.value)} className={cn(fieldClass, "h-11 text-sm")}>
                <option value="">Elegí el nuevo estado</option>
                {SUGGESTABLE_STATUS.map((o) => (
                  <option key={o} value={o}>{STATUS[o]}</option>
                ))}
              </select>
              <p id={`edit-status-hint-${slug}`} className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {value ? STATUS_HINT[value as KosherStatus] : "«Certificado» no se sugiere acá: sale de un certificado que revisa moderación."}
              </p>
            </>
          ) : (
            <input aria-label="Nuevo valor" value={value} onChange={(e) => setValue(e.target.value)} maxLength={600} placeholder="Nuevo valor" className={cn(fieldClass, "h-11 text-sm")} />
          )}
          <input aria-label="Cómo lo sabés" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Cómo lo sabés (ej.: vi el certificado en la puerta)" className={cn(fieldClass, "h-11 text-sm")} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className={cn(secondaryButton, "flex-1")}>
              Cancelar
            </button>
            <button type="submit" disabled={busy || !value.trim()} className={cn(primaryButton, "flex-1")}>
              Enviar a revisión
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Las correcciones pasan por moderación. Los desacuerdos quedan abiertos: Mercav Kosher no decide quién tiene razón.</p>
      )}
    </Section>
  );
}
// creado por pato dev y askforvini
