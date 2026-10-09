"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Flame, MapPin, Moon } from "@/components/icons";
import { HostLink } from "@/components/layout/HostContext";
import { PixelMap, CAPITALS } from "./PixelMap";
import { cn } from "@/lib/utils";
import { countryFromTimeZone } from "@/lib/geo/latam";
import { CartelSelect } from "@/components/site/cartel/CartelSelect";

/* ------------------------------------------------------------------ */
/* Barra de pilares: Business · Pwn · Kosher                           */
/* ------------------------------------------------------------------ */

const PILLARS = [
  { id: "pilar-business", label: "Business", active: "bg-[var(--c-yellow)] text-[#0b0a09]" },
  { id: "pilar-pwn", label: "Pwn", active: "bg-[#2ee06f] text-[#0b0a09]" },
  { id: "pilar-kosher", label: "Kosher", active: "bg-[#8db4ec] text-[#0a1626]" },
];

/** Marca el pilar que cruza la mitad de la pantalla. Flota abajo, como una barra de pestañas, mientras se recorren los tres. */
export function PillarNav({ className }: { className?: string }) {
  const [current, setCurrent] = useState(PILLARS[0].id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.45;
      for (const p of PILLARS) {
        const r = document.getElementById(p.id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) {
          setCurrent(p.id);
          return;
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav aria-label="Las tres apps de Mercav" className={cn("pointer-events-none sticky bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-40 flex justify-center py-3", className)}>
      <ul className="c-pillnav pointer-events-auto flex gap-1 rounded-full p-1">
        {PILLARS.map((p) => (
          <li key={p.id}>
            <a
              href={`#${p.id}`}
              aria-current={current === p.id ? "true" : undefined}
              className={cn(
                "c-label block rounded-full px-4 py-2 text-[1.05rem] transition-colors duration-200 sm:px-5",
                current === p.id ? p.active : "text-[#d2cbc0] hover:text-white",
              )}
            >
              {p.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Países: feriado, moneda y mapa                                      */
/* ------------------------------------------------------------------ */

export type CountryInfo = { code: string; name: string; currency: string; money: string; holiday: { date: string; title: string } | null };

function longDate(date: string) {
  return new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export function RegionPicker({ countries, initial, detected }: { countries: CountryInfo[]; initial: string; detected: boolean }) {
  const [code, setCode] = useState(countries.some((c) => c.code === initial) ? initial : countries[0]?.code);
  // Cómo se eligió el país: por IP (servidor), por la zona horaria del navegador, o a mano.
  const [auto, setAuto] = useState<"ip" | "zona" | null>(detected ? "ip" : null);
  useEffect(() => {
    if (detected) return;
    let guess: string | null = null;
    try {
      guess = countryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      guess = null;
    }
    if (guess && countries.some((c) => c.code === guess)) {
      setCode(guess);
      setAuto("zona");
    }
  }, [detected, countries]);
  const current = countries.find((c) => c.code === code) ?? countries[0];
  if (!current) return null;
  const pin = CAPITALS[current.code];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
      <div className="relative mx-auto w-full max-w-[30rem]">
        <PixelMap
          land="var(--c-text)"
          shade="var(--c-line-strong)"
          pins={Object.entries(CAPITALS).map(([c, [x, y]]) => ({ x, y, active: c === current.code, color: c === current.code ? "#ff3d8b" : "#e6bd55" }))}
          className="w-full"
          title="Mapa de Latinoamérica con las capitales de los 20 países"
        />
        {pin ? <span className="sr-only">{current.name} marcado en el mapa</span> : null}
      </div>
      <div className="flex flex-col gap-8">
        <ul className="flex flex-wrap gap-2" aria-label="Elegí un país">
          {countries.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => {
                  setCode(c.code);
                  setAuto(null);
                }}
                aria-pressed={c.code === code}
                className={cn(
                  "c-label rounded-full px-3 py-1.5 text-[1rem] transition-colors duration-150",
                  c.code === code ? "bg-[var(--c-magenta)] text-[#0b0a09]" : "shadow-[inset_0_0_0_2px_var(--c-line-strong)] hover:shadow-[inset_0_0_0_2px_var(--c-text)]",
                )}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        {auto ? (
          <p className="-mt-4 flex items-center gap-2 text-[0.92rem] text-[var(--c-soft)]">
            <MapPin className="h-4 w-4 text-[var(--c-magenta-text)]" aria-hidden />
            Elegimos {current.name} según tu ubicación aproximada. Podés cambiarlo.
          </p>
        ) : null}
        <dl className="grid gap-px overflow-hidden rounded-[1.5rem] bg-[var(--c-line)] sm:grid-cols-2" aria-live="polite">
          <div className="bg-[var(--c-ground)] p-6 sm:col-span-2">
            <dt className="c-label flex items-center gap-2 text-[1rem] text-[var(--c-muted)]">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Próximo feriado en {current.name}
            </dt>
            <dd className="mt-2">
              {current.holiday ? (
                <>
                  <span className="c-display block text-[clamp(2rem,1.4rem+2.4vw,3.2rem)] first-letter:uppercase">{longDate(current.holiday.date)}</span>
                  <span className="mt-1 block text-[1.0625rem] text-[var(--c-soft)]">{current.holiday.title}</span>
                </>
              ) : (
                <span className="text-[var(--c-soft)]">Sin feriados cargados para los próximos meses.</span>
              )}
            </dd>
          </div>
          <div className="bg-[var(--c-ground)] p-6">
            <dt className="c-label text-[1rem] text-[var(--c-muted)]">Así se ven los montos</dt>
            <dd className="c-display c-num mt-2 text-[2rem] normal-case">{current.money}</dd>
          </div>
          <div className="bg-[var(--c-ground)] p-6">
            <dt className="c-label text-[1rem] text-[var(--c-muted)]">Moneda</dt>
            <dd className="c-display mt-2 text-[2rem]">{current.currency}</dd>
          </div>
        </dl>
        <HostLink href="/calendario" className="c-link inline-flex w-fit items-center gap-2 font-semibold">
          Ver el calendario con tus feriados y el calendario hebreo
        </HostLink>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kosher: próximo Shabat por ciudad                                   */
/* ------------------------------------------------------------------ */

export type ShabbatCity = { slug: string; city: string; timezone: string; candles: string | null; havdalah: string | null; parasha: string | null; chag: string | null };

function hour(iso: string | null, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
}
function day(iso: string | null, timeZone: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(iso));
}

export function ShabbatPicker({ cities }: { cities: ShabbatCity[] }) {
  const [slug, setSlug] = useState(cities[0]?.slug);
  const c = cities.find((x) => x.slug === slug) ?? cities[0];
  if (!c) return null;
  return (
    <div className="rounded-[1.5rem] bg-[var(--c-raised)] p-6 shadow-[inset_0_0_0_1px_var(--c-line-strong)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="c-label flex items-center gap-2 text-[1.1rem]">
          <Flame className="h-[18px] w-[18px] text-[var(--c-yellow-text)]" aria-hidden />
          Próximo Shabat
        </p>
        <CartelSelect
          label="Ciudad"
          value={c.slug}
          onChange={setSlug}
          options={cities.map((x) => ({ value: x.slug, label: x.city }))}
          icon={<MapPin className="h-4 w-4" aria-hidden />}
          className="[--select-ink:#8db4ec]"
        />
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4" aria-live="polite">
        <div>
          <dt className="text-[0.85rem] text-[var(--c-muted)]">Encendido de velas</dt>
          <dd className="c-display c-num mt-1 text-[2.4rem] text-[var(--c-yellow-text)]">{hour(c.candles, c.timezone)}</dd>
          <dd className="text-[0.85rem] text-[var(--c-soft)] first-letter:uppercase">{day(c.candles, c.timezone)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[0.85rem] text-[var(--c-muted)]">
            <Moon className="h-3.5 w-3.5" aria-hidden />
            Havdalá
          </dt>
          <dd className="c-display c-num mt-1 text-[2.4rem]">{hour(c.havdalah, c.timezone)}</dd>
          <dd className="text-[0.85rem] text-[var(--c-soft)] first-letter:uppercase">{day(c.havdalah, c.timezone)}</dd>
        </div>
      </dl>
      {c.parasha || c.chag ? (
        <p className="mt-4 border-t border-[var(--c-line-strong)] pt-4 text-[0.95rem] text-[var(--c-soft)]">{[c.parasha, c.chag].filter(Boolean).join(" · ")}</p>
      ) : null}
      <p className="mt-3 text-[0.8rem] text-[var(--c-muted)]">Calculado ahora para {c.city}, con 18 minutos antes de la puesta del sol para las velas.</p>
    </div>
  );
}
// creado por pato dev y askforvini
