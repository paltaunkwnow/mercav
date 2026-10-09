"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { addDays, isoDate, weekday } from "@/lib/calendar/bolivia";
import { dayLabel } from "@/lib/calendar/dates";
import { calendarSource } from "@/lib/calendar/sources";
import type { CalendarEntry, CalendarSourceKey } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
import { MONTHS, SourceMark, WEEKDAYS_SHORT } from "./parts";

const WEEKDAYS_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Celdas del mes por semana, empezando en lunes. null = relleno. */
export function monthWeeks(year: number, month: number): (string | null)[][] {
  const first = isoDate(year, month + 1, 1);
  const lead = (weekday(first) + 6) % 7;
  const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(isoDate(year, month + 1, d));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

/** Mismo día `delta` meses después; si no existe (31 de abril), el último del mes. */
function shiftMonth(date: string, delta: number) {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + delta, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return isoDate(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(d, last));
}

function cellLabel(date: string, items: CalendarEntry[], isToday: boolean, hebrew: string | null) {
  const head = [dayLabel(date), isToday ? "hoy" : null, hebrew].filter(Boolean).join(", ");
  if (!items.length) return head;
  const list = items.map((e) => `${e.title} (${calendarSource(e.source).label}${e.dayOff ? ", descanso" : ""})`);
  return `${head}. ${list.join("; ")}`;
}

/**
 * Grilla del mes con el patrón de grilla de ARIA: se entra con Tab a un solo día y se mueve con las
 * flechas, Inicio/Fin (semana), RePág/AvPág (mes; con Shift, año). La selección sigue al foco.
 */
export function MonthGrid({
  year,
  month,
  today,
  selected,
  byDate,
  hebrewLabels,
  loading,
  minDate,
  maxDate,
  activeSources,
  onSelect,
}: {
  year: number;
  month: number;
  today: string;
  selected: string | null;
  byDate: Map<string, CalendarEntry[]>;
  /** Fecha hebrea corta por día del mes, o null si no se muestra el calendario hebreo. */
  hebrewLabels: Map<string, string | null> | null;
  loading: boolean;
  minDate: string;
  maxDate: string;
  activeSources: CalendarSourceKey[];
  /** Elegir un día (puede ser de otro mes si se llegó con el teclado). */
  onSelect: (date: string) => void;
}) {
  const weeks = useMemo(() => monthWeeks(year, month), [year, month]);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const tabStop = selected?.startsWith(prefix) ? selected : today.startsWith(prefix) ? today : `${prefix}-01`;

  // Después de moverse con el teclado, el foco sigue al día elegido (también si cambió de mes).
  useEffect(() => {
    if (!focusNext.current || !selected) return;
    focusNext.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${selected}"]`)?.focus();
  }, [selected, year, month]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const col = (weekday(date) + 6) % 7;
    let target: string;
    switch (e.key) {
      case "ArrowLeft":
        target = addDays(date, -1);
        break;
      case "ArrowRight":
        target = addDays(date, 1);
        break;
      case "ArrowUp":
        target = addDays(date, -7);
        break;
      case "ArrowDown":
        target = addDays(date, 7);
        break;
      case "Home":
        target = addDays(date, -col);
        break;
      case "End":
        target = addDays(date, 6 - col);
        break;
      case "PageUp":
        target = shiftMonth(date, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        target = shiftMonth(date, e.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (target < minDate || target > maxDate) return;
    focusNext.current = true;
    onSelect(target);
  };

  return (
    <div>
      <div
        ref={gridRef}
        role="grid"
        aria-labelledby="cal-month"
        aria-busy={loading}
        className={cn("flex flex-col gap-0.5 transition-opacity sm:gap-1", loading && "opacity-50")}
      >
        <div role="row" className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div
              key={d}
              role="columnheader"
              aria-label={WEEKDAYS_FULL[i]}
              className={cn("pb-1 text-center text-[11px] font-semibold uppercase tracking-wide", i >= 5 ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]")}
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} role="row" className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {week.map((date, i) => {
              if (!date) return <div key={`pad-${w}-${i}`} role="gridcell" />;
              const items = byDate.get(date) ?? [];
              const off = items.some((e) => e.dayOff);
              const isToday = date === today;
              const isSelected = date === selected;
              const weekend = i >= 5;
              const sources = Array.from(new Set(items.map((e) => e.source))).slice(0, 3);
              const hebrew = hebrewLabels?.get(date) ?? null;
              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  data-date={date}
                  tabIndex={date === tabStop ? 0 : -1}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={cellLabel(date, items, isToday, hebrew)}
                  onClick={() => onSelect(date)}
                  onKeyDown={(e) => onKeyDown(e, date)}
                  className={cn(
                    "mv-focus relative flex min-h-[3.25rem] min-w-0 flex-col items-center justify-start gap-0.5 rounded-xl px-0.5 pb-1.5 pt-1.5 transition-colors sm:min-h-[4.4rem]",
                    isSelected
                      ? "bg-[var(--mv-gold-wash)] ring-1 ring-inset ring-[var(--color-border-gold)]"
                      : weekend
                        ? "bg-[var(--mv-panel-sunk)] hover:bg-[var(--mv-panel-hover)]"
                        : "hover:bg-[var(--mv-panel-hover)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-sm tabular-nums",
                      isToday ? "bg-gold font-semibold text-[var(--mv-on-gold)]" : off ? "font-bold text-[var(--mv-gold-ink)]" : "text-[var(--text-primary)]",
                    )}
                  >
                    {Number(date.slice(8))}
                  </span>
                  {hebrew ? <span className="hidden text-[10px] leading-none text-[var(--text-tertiary)] sm:block">{hebrew}</span> : null}
                  {sources.length ? (
                    <span className="mt-auto flex items-center gap-1">
                      {sources.map((s) => (
                        <SourceMark key={s} source={s} />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ul aria-label={`Referencias de ${MONTHS[month].toLowerCase()}`} className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-[var(--text-secondary)]">
        {activeSources.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <SourceMark source={s} size="md" />
            {calendarSource(s).label}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="text-[13px] font-bold tabular-nums text-[var(--mv-gold-ink)]">
            12
          </span>
          Día de descanso
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-[4px] bg-[var(--mv-panel-sunk)] ring-1 ring-inset ring-[var(--mv-hairline)]" />
          Fin de semana
        </li>
      </ul>
    </div>
  );
}
// creado por pato dev y askforvini
