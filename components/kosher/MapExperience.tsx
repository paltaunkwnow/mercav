"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { List, LocateFixed, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import type { PlaceDTO } from "@/lib/kosher/server";
import { SCOPES, type ScopeKey } from "@/lib/kosher/labels";
import { formatKm, haversineKm } from "@/lib/kosher/geo";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { Stars, StatusBadge } from "@/components/kosher/StatusBadge";
import { PlacePanel } from "@/components/kosher/PlacePanel";
import { KosherWordmark } from "@/components/kosher/KosherShell";
import type { MapCommunity } from "@/components/kosher/KosherMap";
import { cn } from "@/lib/utils";

const KosherMap = dynamic(() => import("@/components/kosher/KosherMap").then((m) => m.KosherMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-sm text-[var(--text-secondary)]">Cargando el mapa…</div>
  ),
});

const spring = { type: "spring", stiffness: 380, damping: 38 } as const;

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function MapExperience({ places, communities }: { places: PlaceDTO[]; communities: (MapCommunity & { city: string })[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState(params?.get("q") ?? "");
  const [scopes, setScopes] = useState<ScopeKey[]>([]);
  const [selected, setSelected] = useState<string | null>(params?.get("lugar") ?? null);
  const [showCommunities, setShowCommunities] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number; key: number } | null>(null);
  const [fitKey, setFitKey] = useState(0);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const types = new Set(scopes.flatMap((s) => SCOPES[s].types as readonly string[]));
    let list = places.filter((p) => {
      if (types.size && !types.has(p.type)) return false;
      if (!q) return true;
      return [p.name, p.nameLocal, p.city, p.country, p.address, p.agencyName, p.chainName]
        .filter(Boolean)
        .some((v) => normalize(v!).includes(q));
    });
    if (near) list = [...list].sort((a, b) => haversineKm(near, a) - haversineKm(near, b));
    return list;
  }, [places, query, scopes, near]);

  const openedWithPlace = useRef(!!params?.get("lugar"));
  useEffect(() => {
    if (openedWithPlace.current) {
      if (!query && scopes.length === 0) return;
      openedWithPlace.current = false;
    }
    const id = window.setTimeout(() => setFitKey((k) => k + 1), query ? 450 : 0);
    return () => window.clearTimeout(id);
  }, [query, scopes]);

  useEffect(() => {
    const slug = params?.get("lugar");
    if (!slug) return;
    const p = places.find((x) => x.slug === slug);
    if (p) setFocus({ lat: p.lat, lng: p.lng, zoom: 14, key: Date.now() });
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(slug: string) {
    setSelected(slug);
    setListOpen(false);
    const p = places.find((x) => x.slug === slug);
    if (p) setFocus({ lat: p.lat, lng: p.lng, zoom: 14, key: Date.now() });
    router.replace(`/kosher/mapa?lugar=${slug}`, { scroll: false });
  }

  function close() {
    setSelected(null);
    router.replace("/kosher/mapa", { scroll: false });
  }

  function locate() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no permite ubicarte.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNear(coords);
        setFocus({ ...coords, zoom: 12, key: Date.now() });
        setLocating(false);
      },
      () => {
        toast.error("No pudimos acceder a tu ubicación. Podés buscar por ciudad.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const toggleScope = (s: ScopeKey) => setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const searchBar = (
    <div className="flex items-center gap-2">
      <label className="relative flex h-11 flex-1 items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
        <span className="sr-only">Buscar lugares, ciudades o agencias</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lugar, ciudad o agencia"
          className="h-11 w-full rounded-full border border-[var(--lg-stroke)] bg-bg-primary/40 pl-10 pr-9 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-gold/50"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda" className="absolute right-1.5 grid h-8 w-8 place-items-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      <button
        type="button"
        onClick={locate}
        aria-label="Lugares cerca de mí"
        title="Cerca de mí"
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--lg-stroke)] bg-bg-primary/40 text-[var(--text-primary)] transition-colors hover:border-gold/50",
          near && "border-gold/60 text-gold",
        )}
      >
        <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} />
      </button>
    </div>
  );

  const chips = (
    <div className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1">
      {(Object.keys(SCOPES) as ScopeKey[]).map((key) => {
        const active = scopes.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => toggleScope(key)}
            className={cn(
              "relative inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors",
              active ? "text-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {active && <motion.span layoutId={`chip-${key}`} className="absolute inset-0 rounded-full bg-gold" transition={spring} />}
            {!active && (
              <span className="absolute inset-0 rounded-full border border-[var(--lg-stroke)] max-md:bg-bg-secondary/75 max-md:shadow-[0_4px_14px_rgba(0,0,0,0.18)] max-md:backdrop-blur-xl" />
            )}
            <span className="relative">{SCOPES[key].label}</span>
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={showCommunities}
        onClick={() => setShowCommunities((v) => !v)}
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
          showCommunities
            ? "border-techelet/50 bg-techelet-dim text-techelet max-md:backdrop-blur-xl"
            : "border-[var(--lg-stroke)] text-[var(--text-secondary)] max-md:bg-bg-secondary/75 max-md:shadow-[0_4px_14px_rgba(0,0,0,0.18)] max-md:backdrop-blur-xl",
        )}
      >
        <Users className="h-3.5 w-3.5" aria-hidden /> Kehilot
      </button>
    </div>
  );

  const results = (
    <ul className="space-y-1">
      {filtered.length === 0 && (
        <li className="px-3 py-8 text-center text-sm text-[var(--text-secondary)]">
          No encontramos lugares con ese filtro.{" "}
          <Link href="/kosher/sugerir" className="font-semibold text-gold">Sugerí uno</Link>
        </li>
      )}
      {filtered.map((p) => (
        <li key={p.slug}>
          <button
            type="button"
            onClick={() => select(p.slug)}
            className={cn(
              "flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
              selected === p.slug ? "bg-gold/10" : "hover:bg-[var(--lg-fill-regular)]",
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-tertiary text-gold">
              <PlaceIcon type={p.type} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{p.name}</span>
                {near && <span className="shrink-0 font-mono text-[11px] text-[var(--text-tertiary)]">{formatKm(haversineKm(near, p))}</span>}
              </span>
              <span className="block truncate text-xs text-[var(--text-secondary)]">
                {p.city}, {p.country}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={p.status} type={p.type} verified={!!p.verifiedAt} />
                {p.agencyName && p.status === "certified" && <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{p.agencyName}</span>}
                {p.rating != null && <Stars value={p.rating} />}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  const selectedPlace = selected ? places.find((p) => p.slug === selected) : null;

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        <KosherMap
          places={filtered}
          communities={communities}
          showCommunities={showCommunities}
          selectedSlug={selected}
          onSelect={select}
          onSelectCommunity={(slug) => router.push(`/kosher/comunidades#${slug}`)}
          focus={focus}
          fitKey={fitKey}
          userLocation={near}
        />
      </div>

      {/* Desktop sidebar */}
      <aside
        aria-label="Buscar en el mapa"
        className="liquid-glass pointer-events-auto absolute bottom-4 left-4 top-[6.5rem] z-10 hidden w-[372px] flex-col overflow-hidden rounded-[1.75rem] md:flex"
      >
        <div className="space-y-3 p-4 pb-3">
          <div className="flex items-center justify-between">
            <Link href="/kosher" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <KosherWordmark />
            </Link>
            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
              {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
            </span>
          </div>
          {searchBar}
          {chips}
        </div>
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 pb-3">{results}</div>
        <p className="border-t border-[var(--lg-stroke)] px-4 py-2.5 text-[11px] leading-snug text-[var(--text-tertiary)]">
          Certificado significa que figura una agencia. Un reporte comunitario no es un hechsher.
        </p>
      </aside>

      {/* Mobile top controls */}
      <div className="absolute inset-x-3 top-[5.25rem] z-10 space-y-2 md:hidden">
        <div className="liquid-glass rounded-[1.6rem] p-2">{searchBar}</div>
        {chips}
      </div>

      {/* Mobile results toggle */}
      {!selected && (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="liquid-glass absolute bottom-24 left-1/2 z-10 inline-flex h-11 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--text-primary)] md:hidden"
        >
          <List className="h-4 w-4" aria-hidden /> Ver {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
        </button>
      )}

      <AnimatePresence>
        {listOpen && (
          <motion.div
            key="list"
            className="absolute inset-x-0 bottom-0 z-30 md:hidden"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={spring}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) setListOpen(false);
            }}
          >
            <div className="liquid-glass flex max-h-[70dvh] flex-col rounded-t-[2rem] pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-[var(--text-tertiary)]/40" />
                <p className="pt-2 text-sm font-semibold text-[var(--text-primary)]">{filtered.length} lugares</p>
                <button type="button" onClick={() => setListOpen(false)} aria-label="Cerrar lista" className="mt-1 grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2 pb-24">{results}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place sheet */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.aside
            key={selectedPlace.slug}
            aria-label={`Ficha de ${selectedPlace.name}`}
            className="absolute inset-x-0 bottom-0 z-40 max-h-[60dvh] md:inset-x-auto md:bottom-4 md:right-4 md:top-[6.5rem] md:max-h-none md:w-[420px]"
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
            transition={spring}
          >
            <div className="flex h-full max-h-[60dvh] flex-col overflow-hidden rounded-t-[2rem] border border-border bg-bg-secondary/95 pb-20 md:pb-0 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:max-h-none md:rounded-[1.75rem]">
              <PlacePanel slug={selectedPlace.slug} onClose={close} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
