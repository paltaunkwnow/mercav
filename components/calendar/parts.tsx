"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Download, EyeOff } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { weekday } from "@/lib/calendar/bolivia";
import { dayLabel, MONTHS_ES, rangeLabel, relativeRange, type DateGroup } from "@/lib/calendar/dates";
import { calendarSource } from "@/lib/calendar/sources";
import type { CalendarEntry, CalendarSourceKey } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

export const MONTHS = MONTHS_ES.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
export const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_SHORT = MONTHS_ES.map((m) => m.slice(0, 3));

/**
 * Marca de la fuente. Además del color cambia la forma: círculo para los feriados del país y rombo
 * para el calendario hebreo, así no depende solo del color (y la leyenda lo explica).
 */
export function SourceMark({ source, size = "sm", className }: { source: CalendarSourceKey; size?: "sm" | "md"; className?: string }) {
  const s = calendarSource(source);
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0", size === "md" ? "h-2.5 w-2.5" : "h-1.5 w-1.5", s.group === "judio" ? "rotate-45 rounded-[1px]" : "rounded-full", s.dot, className)}
    />
  );
}

export function SourceChip({ source }: { source: CalendarSourceKey }) {
  const s = calendarSource(source);
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", s.chip)}>{s.label}</span>;
}

export function EntryRow({ entry, onHide, today }: { entry: CalendarEntry; onHide?: (key: string) => void; today: string }) {
  const d = Number(entry.date.slice(8));
  // Lo que ya pasó se apaga con color, no con opacidad (la opacidad baja el contraste de todo, chips incluidos).
  const past = entry.date < today;
  return (
    <li className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-[var(--mv-panel-hover)]">
      <span
        aria-hidden
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-center leading-none",
          past
            ? "border-[var(--mv-hairline)] text-[var(--text-tertiary)]"
            : entry.dayOff
              ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]"
              : "border-[var(--mv-hairline)] text-[var(--text-primary)]",
        )}
      >
        <span>
          <span className="block font-display text-base font-semibold tabular-nums">{d}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wide">{WEEKDAYS_SHORT[(weekday(entry.date) + 6) % 7]}</span>
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("text-[15px] font-semibold", past ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")}>{entry.title}</span>
          <span className="sr-only">
            , {dayLabel(entry.date)}
            {past ? ", ya pasó" : ""}
          </span>
          {entry.dayOff ? <span className={cn("mv-chip !py-0.5 !text-[11px]", !past && "mv-chip-gold")}>Descanso</span> : null}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <SourceChip source={entry.source} />
          {entry.hebrewDate ? <span className="text-xs text-[var(--text-secondary)]">{entry.hebrewDate}</span> : null}
          {entry.hebrew ? (
            <bdi lang="he" dir="rtl" className="text-xs text-techelet">
              {entry.hebrew}
            </bdi>
          ) : null}
        </span>
        {entry.note ? <span className="mt-1 block text-xs leading-snug text-[var(--text-secondary)]">{entry.note}</span> : null}
      </span>
      {onHide ? (
        <button
          type="button"
          onClick={() => onHide(entry.key)}
          aria-label={`Ocultar ${entry.title}`}
          title="Ocultar esta fecha"
          className="mv-focus -my-1 -mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
        >
          <EyeOff className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </li>
  );
}

/** Tarjeta de próximas fechas: el rótulo dorado adentro, como en el celular de la portada. */
export function UpcomingCard({ label, groups, today, onPick }: { label: string; groups: DateGroup[]; today: string; onPick: (date: string) => void }) {
  return (
    <section aria-labelledby="cal-upcoming" className="mv-panel p-3 sm:p-4">
      <h2 id="cal-upcoming" className="mv-kicker px-2 pt-1">
        {label}
      </h2>
      <ul className="mt-2 grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-x-2">
        {groups.map((g) => {
          const [, m, d] = g.date.split("-").map(Number);
          return (
            <li key={g.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onPick(g.date)}
                className="mv-focus flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--mv-panel-hover)]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-center leading-none",
                    g.dayOff ? "bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]" : "bg-[var(--mv-panel-sunk)] text-[var(--text-primary)]",
                  )}
                >
                  <span>
                    <span className="block font-display text-base font-semibold tabular-nums">{d}</span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide">{MONTHS_SHORT[m - 1]}</span>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <SourceMark source={g.source} />
                    <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{g.title}</span>
                  </span>
                  <span className="block truncate text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--mv-gold-ink)]">{relativeRange(g.date, g.end, today)}</span> · {rangeLabel(g.date, g.end)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Abre y cierra un popover: Escape o tocar afuera lo cierran y el foco vuelve al botón. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  // Si el foco sale del popover con Tab, se cierra.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  };
  return { open, setOpen, close, triggerRef, wrapRef, onBlur };
}

const popoverClass =
  "mv-panel absolute z-30 mt-2 border border-[var(--mv-hairline-strong)] p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)]";

/** El título del mes es un botón: abre un selector de mes y año. */
export function MonthPicker({
  year,
  month,
  view,
  minYear,
  maxYear,
  onYear,
  onMonth,
}: {
  year: number;
  month: number;
  view: "mes" | "anio";
  minYear: number;
  maxYear: number;
  onYear: (year: number) => void;
  onMonth: (month: number) => void;
}) {
  const { open, setOpen, close, triggerRef, wrapRef, onBlur } = usePopover();
  const gridRef = useRef<HTMLDivElement>(null);
  // Al abrir, el foco va al mes que se está viendo.
  useEffect(() => {
    if (!open) return;
    const grid = gridRef.current;
    (grid?.querySelector<HTMLElement>("[aria-pressed='true']") ?? grid?.querySelector<HTMLElement>("button"))?.focus();
  }, [open]);
  const title = view === "anio" ? String(year) : `${MONTHS[month]} ${year}`;
  return (
    <div ref={wrapRef} className="relative min-w-0" onBlur={onBlur}>
      <h2 id="cal-month">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? "cal-picker" : undefined}
          onClick={() => setOpen((o) => !o)}
          className="mv-focus -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-display text-xl font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)]"
        >
          {title}
          <ChevronDown className={cn("h-4 w-4 text-[var(--text-tertiary)] transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
          <span className="sr-only">. Elegí otro mes o año</span>
        </button>
      </h2>
      {open ? (
        <div id="cal-picker" role="dialog" aria-label="Elegí mes y año" className={cn(popoverClass, "left-0 w-[17.5rem]")}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onYear(year - 1)}
              disabled={year <= minYear}
              aria-label="Año anterior"
              className="mv-focus grid h-11 w-11 place-items-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)] disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <span aria-live="polite" className="font-display text-base font-semibold tabular-nums text-[var(--text-primary)]">
              {year}
            </span>
            <button
              type="button"
              onClick={() => onYear(year + 1)}
              disabled={year >= maxYear}
              aria-label="Año siguiente"
              className="mv-focus grid h-11 w-11 place-items-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)] disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div ref={gridRef} className="mt-1 grid grid-cols-3 gap-1">
            {MONTHS.map((name, i) => {
              const on = view === "mes" && i === month;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${name} ${year}`}
                  onClick={() => {
                    onMonth(i);
                    close();
                  }}
                  className={cn(
                    "mv-focus h-11 rounded-xl text-sm font-semibold transition-colors",
                    on ? "bg-gold text-[var(--mv-on-gold)]" : "text-[var(--text-primary)] hover:bg-[var(--mv-panel-hover)]",
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Feed = { url: string; webcal: string } | null;

/**
 * Suscripción: un link secreto que Google Calendar, Apple u Outlook vuelven a leer cada día, así los feriados que
 * mueve un decreto llegan solos. Regenerarlo corta el link anterior.
 */
function SubscribePanel() {
  const [feed, setFeed] = useState<Feed | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/calendar/feed", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => alive && setFeed(j?.success ? (j.data as Feed) : null))
      .catch(() => alive && setFeed(null));
    return () => {
      alive = false;
    };
  }, []);

  async function send(method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/calendar/feed", { method });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.success) throw new Error(j?.error ?? "No pudimos actualizar el link.");
      setFeed(j.data as Feed);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar el link.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!feed) return;
    try {
      await navigator.clipboard.writeText(feed.url);
      setCopied(true);
    } catch {
      setError("Copialo a mano: tocá el link y seleccionalo.");
    }
  }

  const btn = "mv-focus flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors";
  if (feed === undefined) return <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">Cargando…</p>;
  return (
    <div className="flex flex-col gap-2 px-1 pb-1">
      <p className="px-2 text-xs leading-snug text-[var(--text-secondary)]">
        Tu calendario de siempre lo vuelve a leer cada día: si un decreto mueve un feriado, te llega solo.
      </p>
      {feed ? (
        <>
          <input readOnly value={feed.url} onFocus={(e) => e.currentTarget.select()} aria-label="Link de suscripción" className="mv-input h-10 text-xs" />
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={copy} className={cn(btn, "bg-[var(--mv-panel-hover)] text-[var(--text-primary)]")}>
              {copied ? "Copiado" : "Copiar link"}
            </button>
            <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed.webcal)}`} target="_blank" rel="noopener noreferrer" className={cn(btn, "bg-[var(--mv-panel-hover)] text-[var(--text-primary)]")}>
              Google
            </a>
            <a href={feed.webcal} className={cn(btn, "col-span-2 bg-[var(--mv-panel-hover)] text-[var(--text-primary)]")}>
              Apple u Outlook
            </a>
          </div>
          <div className="flex justify-between gap-2 px-1">
            <button type="button" disabled={busy} onClick={() => void send("POST")} className={cn(btn, "min-h-10 px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>
              Regenerar link
            </button>
            <button type="button" disabled={busy} onClick={() => void send("DELETE")} className={cn(btn, "min-h-10 px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>
              Desactivar
            </button>
          </div>
          <p className="px-2 text-[11px] leading-snug text-[var(--text-tertiary)]">No lo compartas: quien lo tenga ve lo que elegiste ver.</p>
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => void send("POST")} className={buttonClass("primary", "sm", "min-h-11")}>
          {busy ? "Creando…" : "Crear link de suscripción"}
        </button>
      )}
      {error ? (
        <p role="alert" className="px-2 text-xs text-red-400 [.light_&]:text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Descarga .ics: el año que se está viendo o los próximos 12 meses, o la suscripción que se actualiza sola. */
export function ExportMenu({ year }: { year: number }) {
  const [subscribing, setSubscribing] = useState(false);
  const { open, setOpen, triggerRef, wrapRef, onBlur } = usePopover();
  const itemClass =
    "mv-focus flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)]";
  return (
    <div ref={wrapRef} className="relative" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? "cal-export" : undefined}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass("ghost", "sm", "min-h-11")}
      >
        <Download className="h-4 w-4" aria-hidden />
        Descargar .ics
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div id="cal-export" className={cn(popoverClass, "right-0 flex flex-col", subscribing ? "w-80" : "w-60")}>
          <a href={`/api/calendar/ics?year=${year}`} download onClick={() => setOpen(false)} className={itemClass}>
            Todo {year}
          </a>
          <a href="/api/calendar/ics?rango=12m" download onClick={() => setOpen(false)} className={itemClass}>
            Próximos 12 meses
          </a>
          <button type="button" onClick={() => setSubscribing((v) => !v)} aria-expanded={subscribing} className={cn(itemClass, "justify-between")}>
            Suscribirme (se actualiza solo)
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform motion-reduce:transition-none", subscribing && "rotate-180")} aria-hidden />
          </button>
          {subscribing ? <SubscribePanel /> : null}
          <p className="px-3 pb-1 pt-1.5 text-xs leading-snug text-[var(--text-tertiary)]">Con lo que elegiste ver. Sumalo a tu calendario de siempre.</p>
        </div>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
