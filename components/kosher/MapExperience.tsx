"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { List, LocateFixed, Search, Users, X } from "@/components/icons";
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
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lugar, ciudad o agencia"
          className="h-11 w-full appearance-none rounded-full border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] pl-10 pr-10 text-base text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-border-gold)] focus:shadow-[0_0_0_3px_var(--mv-gold-wash)] md:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Borrar búsqueda"
            className="mv-focus absolute right-1 grid h-9 w-9 place-items-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </label>
      <button
        type="button"
        onClick={locate}
        aria-label="Ordenar por cercanía a mi ubicación"
        aria-pressed={!!near}
        title="Cerca de mí"
        className={cn(
          "mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors duration-200",
          near
            ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold"
            : "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-primary)] hover:border-[var(--color-border-gold)]",
        )}
      >
        <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} aria-hidden />
      </button>
    </div>
  );

  /** `floating` chips sit directly on the map (mobile), so each carries its own thick material. */
  const chips = (floating: boolean) => (
    <div role="group" aria-label="Filtrar por tipo" className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
      {(Object.keys(SCOPES) as ScopeKey[]).map((key) => {
        const active = scopes.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => toggleScope(key)}
            className={cn(
              "mv-focus relative inline-flex h-10 shrink-0 items-center rounded-full px-4 text-[13px] font-semibold transition-colors duration-200",
              active ? "text-[var(--mv-on-gold)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              !active && (floating ? "mv-menu" : "border border-[var(--mv-hairline-strong)]"),
            )}
          >
            {active && (
              <motion.span
                layoutId={`chip-${floating ? "m" : "d"}-${key}`}
                aria-hidden
                className="absolute inset-0 rounded-full bg-gold"
                transition={reduce ? { duration: 0 } : spring}
              />
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
          "mv-focus inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors duration-200",
          showCommunities
            ? "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/50"
            : cn("text-[var(--text-secondary)] hover:text-[var(--text-primary)]", floating ? "mv-menu" : "border border-[var(--mv-hairline-strong)]"),
          showCommunities && floating && "mv-menu !text-techelet",
        )}
      >
        <Users className="h-3.5 w-3.5" aria-hidden /> Kehilot
      </button>
    </div>
  );

  const countLabel = `${filtered.length} ${filtered.length === 1 ? "lugar" : "lugares"}`;

  const results = (
    <ul className="space-y-1">
      {filtered.length === 0 && (
        <li className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No encontramos lugares con ese filtro.</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Probá con otra ciudad o{" "}
            <Link href="/kosher/sugerir" className="mv-link">
              sugerí uno que falte
            </Link>
            .
          </p>
        </li>
      )}
      {filtered.map((p) => (
        <li key={p.slug}>
          <button
            type="button"
            onClick={() => select(p.slug)}
            aria-current={selected === p.slug ? "true" : undefined}
            className={cn(
              "mv-focus flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-200",
              selected === p.slug ? "bg-[var(--mv-gold-wash)] ring-1 ring-inset ring-[var(--color-border-gold)]" : "hover:bg-[var(--mv-panel-hover)]",
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
              <PlaceIcon type={p.type} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{p.name}</span>
                {near && <span className="mv-data shrink-0 text-xs text-[var(--text-secondary)]">{formatKm(haversineKm(near, p))}</span>}
              </span>
              <span className="block truncate text-xs text-[var(--text-secondary)]">
                {p.city}, {p.country}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={p.status} type={p.type} verified={!!p.verifiedAt} />
                {p.agencyName && p.status === "certified" && <span className="text-xs text-[var(--text-secondary)]">{p.agencyName}</span>}
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
      <h1 className="sr-only">Mapa de Mercav Kosher</h1>
      <div
        className={cn(
          "absolute inset-0",
          // Keep MapLibre's zoom and attribution clear of the bottom nav (mobile) and of the place panel (desktop).
          "max-md:[&_.maplibregl-ctrl-bottom-right]:mb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+4rem)]",
          selectedPlace && "md:[&_.maplibregl-ctrl-bottom-right]:mr-[444px]",
        )}
      >
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
        className="mv-menu pointer-events-auto absolute bottom-4 left-4 top-24 z-10 hidden w-[380px] flex-col overflow-hidden rounded-[1.75rem] md:flex"
      >
        <div className="space-y-3 p-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/kosher" className="mv-focus rounded-lg" aria-label="Mercav Kosher, inicio">
              <KosherWordmark />
            </Link>
            <span className="mv-data text-xs text-[var(--text-secondary)]" aria-live="polite">
              {countLabel}
            </span>
          </div>
          {searchBar}
          {chips(false)}
        </div>
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto border-t border-[var(--mv-hairline)] px-2 py-2">{results}</div>
        <p className="border-t border-[var(--mv-hairline)] px-4 py-3 text-xs leading-snug text-[var(--text-secondary)]">
          Certificado significa que figura una agencia. Un reporte comunitario no es un hechsher, y Mercav Kosher no emite psak.
        </p>
      </aside>

      {/* Mobile top controls, below the floating site header */}
      <div className="absolute inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4.25rem)] z-10 space-y-2 md:hidden">
        <div className="mv-menu rounded-full p-1.5">{searchBar}</div>
        {chips(true)}
      </div>

      {/* Mobile results toggle, above the bottom nav and the home indicator */}
      {!selectedPlace && !listOpen && (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="mv-menu mv-focus absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+4.25rem)] left-3 z-10 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--text-primary)] active:scale-[0.97] md:hidden"
        >
          <List className="h-4 w-4" aria-hidden /> Ver {countLabel}
        </button>
      )}

      <AnimatePresence>
        {listOpen && (
          <motion.div
            key="list"
            role="dialog"
            aria-label="Resultados del mapa"
            className="absolute inset-x-0 bottom-0 z-40 md:hidden"
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
            <div className="mv-menu flex max-h-[78dvh] flex-col rounded-t-[2rem] pb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+3.75rem)]">
              <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-[var(--text-tertiary)] opacity-50" />
              <div className="flex items-center justify-between px-5 pb-2 pt-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{countLabel}</p>
                <button
                  type="button"
                  onClick={() => setListOpen(false)}
                  aria-label="Cerrar lista"
                  className="mv-focus -mr-2 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">{results}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place sheet: bottom sheet on mobile (above the bottom nav), side panel on desktop */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.aside
            key={selectedPlace.slug}
            aria-label={`Ficha de ${selectedPlace.name}`}
            className="absolute inset-x-0 bottom-0 z-40 md:inset-x-auto md:bottom-4 md:right-4 md:top-24 md:z-40 md:w-[420px]"
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
            transition={spring}
          >
            <div className="mv-menu flex h-full max-h-[78dvh] flex-col overflow-hidden rounded-t-[2rem] pb-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+3.75rem)] md:max-h-none md:rounded-[1.75rem] md:pb-0">
              <PlacePanel slug={selectedPlace.slug} onClose={close} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
