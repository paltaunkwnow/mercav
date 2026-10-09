"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { ArrowRight, MapPin, Plus } from "@/components/icons";
import { PixelMap, cityCell } from "@/components/home/PixelMap";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { cn } from "@/lib/utils";

export type AtlasPlaceDTO = {
  slug: string;
  name: string;
  city: string;
  type: KosherPlaceType;
  typeLabel: string;
  status: KosherStatus;
  verified: boolean;
};

/**
 * El atlas de Mercav Kosher como en el celular de la portada: el mapa en pixel art con un punto por ciudad, las
 * ciudades como pastillas y los lugares en tarjetas. Pasar por un lugar enciende su ciudad en el mapa.
 */
export function KosherAtlas({ places }: { places: AtlasPlaceDTO[] }) {
  const cities = useMemo(() => Array.from(new Set(places.map((p) => p.city))).filter((c) => cityCell(c)), [places]);
  const [city, setCity] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(places[0]?.slug ?? null);
  const list = places.filter((p) => !city || p.city === city);
  const current = places.find((p) => p.slug === selected) ?? null;

  // Ciudades muy cercanas en el mapa (Buenos Aires y Montevideo) comparten un punto; tocarlo de nuevo pasa a la siguiente.
  const pins = useMemo(() => {
    const groups: { cities: string[]; x: number; y: number }[] = [];
    for (const c of cities) {
      const [x, y] = cityCell(c)!;
      const near = groups.find((g) => Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) <= 2);
      if (near) near.cities.push(c);
      else groups.push({ cities: [c], x, y });
    }
    return groups;
  }, [cities]);

  function pickCity(next: string | null) {
    setCity(next);
    setSelected(places.find((p) => !next || p.city === next)?.slug ?? null);
  }

  return (
    <section aria-labelledby="atlas-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 id="atlas-title" className="flex items-center gap-2.5 text-[1.75rem] font-bold tracking-[-0.022em] sm:text-[2.25rem]">
          <StarOfDavid className="h-7 w-7 text-[var(--k-accent)] sm:h-8 sm:w-8" />
          Atlas Kosher
        </h1>
        <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--k-accent)_15%,transparent)] px-3 py-1 text-[0.85rem] font-medium text-[var(--k-accent)]">
          {city ?? "Latinoamérica"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <div className="relative rounded-[1.5rem] bg-[var(--mv-panel)] p-3 shadow-[var(--mv-tile-shadow)] [--pad:0.75rem] sm:p-4 sm:[--pad:1rem] lg:sticky lg:top-[calc(var(--c-nav-h)+1rem)]">
          <PixelMap
            land="var(--k-land)"
            shade="var(--k-shade)"
            ocean="var(--k-ocean)"
            title="Mapa de Latinoamérica con las ciudades que tienen lugares en el atlas"
            pins={pins.map((p) => {
              const on = !!current && p.cities.includes(current.city);
              return { x: p.x, y: p.y, active: on, color: on ? "#ff3d8b" : "#e6bd55" };
            })}
            className="w-full"
          />
          {pins.map((p) => (
            <button
              key={p.cities.join("|")}
              type="button"
              aria-label={`Ver lugares en ${p.cities.join(" y ")}`}
              onClick={() => {
                const i = city ? p.cities.indexOf(city) : -1;
                pickCity(p.cities[(i + 1) % p.cities.length]);
              }}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `calc(var(--pad) + (100% - 2 * var(--pad)) * ${(p.x + 0.5) / 60})`, top: `calc(var(--pad) + (100% - 2 * var(--pad)) * ${(p.y + 0.5) / 50})` }}
            />
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {[null, ...cities].map((c) => (
              <button
                key={c ?? "todas"}
                type="button"
                onClick={() => pickCity(c)}
                aria-pressed={city === c}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-[0.9rem] font-semibold transition-colors duration-150",
                  city === c ? "bg-[var(--k-accent)] text-[var(--k-on-accent)]" : "bg-[var(--mv-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {c ?? "Todas"}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-2" aria-label={city ? `Lugares en ${city}` : "Lugares del atlas"}>
            {list.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/kosher/lugar/${p.slug}`}
                  onPointerEnter={() => setSelected(p.slug)}
                  onFocus={() => setSelected(p.slug)}
                  className={cn(
                    "mv-focus flex flex-col gap-1.5 rounded-[1rem] bg-[var(--mv-panel)] px-4 py-3.5 shadow-[var(--mv-tile-shadow)] transition-[background-color,box-shadow] duration-150",
                    selected === p.slug ? "shadow-[inset_0_0_0_1.5px_var(--k-accent)]" : "hover:bg-[var(--mv-panel-hover)]",
                  )}
                >
                  <span className="truncate text-[1.05rem] font-semibold text-[var(--text-primary)]">{p.name}</span>
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[0.9rem] text-[var(--text-secondary)]">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      <span>
                        {p.typeLabel} · {p.city}
                      </span>
                    </span>
                    <StatusBadge status={p.status} type={p.type} verified={p.verified} className="shrink-0" />
                  </span>
                </Link>
              </li>
            ))}
            {list.length === 0 ? <li className="rounded-[1rem] bg-[var(--mv-panel)] px-4 py-6 text-center text-[var(--text-secondary)]">Todavía no hay lugares publicados acá.</li> : null}
          </ul>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Link href="/kosher/mapa" className="mv-btn mv-focus bg-[var(--k-accent)] text-[var(--k-on-accent)] sm:flex-1">
              Abrir el mapa
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/kosher/sugerir" className="mv-btn mv-btn-secondary mv-focus sm:flex-1">
              <Plus className="h-4 w-4" aria-hidden />
              Sugerir un lugar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
