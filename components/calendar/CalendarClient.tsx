"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal } from "@/components/icons";
import { AppPage } from "@/components/app-shell/AppPage";
import { buttonClass } from "@/components/site/primitives";
import { boliviaDecrees } from "@/lib/calendar/bolivia";
import { dayLabel, longWeekends, MONTHS_ES, shortDayLabel, upcomingFrom, workingDays, YEAR_SPAN, type LongWeekend } from "@/lib/calendar/dates";
import { hebrewMonthEs } from "@/lib/calendar/hebrew-names";
import { calendarSource, prefsVersion, SOURCE_KEYS, usesJewishCalendar } from "@/lib/calendar/sources";
import type { CalendarEntry, CalendarPrefs, CalendarRegion } from "@/lib/calendar/types";
import { latamCountry } from "@/lib/geo/latam";
import { cn } from "@/lib/utils";
import { MonthGrid, monthWeeks } from "./MonthGrid";
import { PrefsPanel, PrefsSheet, type SaveStatus } from "./Prefs";
import { EntryRow, ExportMenu, MONTHS, MonthPicker, UpcomingCard } from "./parts";

/** Fechas de un año (incluidas las ocultas, marcadas) y días de descanso civiles para contar días hábiles. */
export type CalendarYearData = { entries: CalendarEntry[]; daysOff: string[] };
/** `gen` = generación de preferencias con la que se cargó; si es vieja, se muestra mientras se recarga. */
type YearSlot = CalendarYearData & { gen: number };

let hebrewFormatter: Intl.DateTimeFormat | null = null;
function hebrewDay(date: string): string | null {
  try {
    hebrewFormatter ??= new Intl.DateTimeFormat("es-u-ca-hebrew", { day: "numeric", month: "short", timeZone: "UTC" });
    const parts = hebrewFormatter.formatToParts(new Date(`${date}T12:00:00Z`));
    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    return day ? `${day} ${hebrewMonthEs(month)}` : null;
  } catch {
    return null;
  }
}

/** Copia sin una clave (para sacar un año del registro de fallas). */
function without<T>(record: Record<number, T>, key: number) {
  const next = { ...record };
  delete next[key];
  return next;
}

function joinEs(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}` : (items[0] ?? "");
}

function weekendLabel(w: LongWeekend) {
  if (w.kind === "puente") return `Puente posible · ${shortDayLabel(w.bridge)} (feriado el ${shortDayLabel(w.holiday)})`;
  const sameMonth = w.start.slice(0, 7) === w.end.slice(0, 7);
  const month = (d: string) => (sameMonth ? "" : ` de ${MONTHS_ES[Number(d.slice(5, 7)) - 1]}`);
  return `Fin de semana largo · ${shortDayLabel(w.start)}${month(w.start)} al ${shortDayLabel(w.end)}${month(w.end)}`;
}

function YearAgenda({ year, entries, daysOff, today, onHide }: { year: number; entries: CalendarEntry[]; daysOff: Set<string> | null; today: string; onHide: (key: string) => void }) {
  const months = useMemo(() => {
    const map = new Map<number, CalendarEntry[]>();
    for (const e of entries) {
      const m = Number(e.date.slice(5, 7)) - 1;
      map.set(m, [...(map.get(m) ?? []), e]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [entries]);
  if (!months.length) return <p className="px-2 py-4 text-sm text-[var(--text-secondary)]">No hay fechas en {year} con lo que elegiste.</p>;
  return (
    <div className="flex flex-col gap-4">
      {months.map(([m, list]) => (
        <section key={m} aria-labelledby={`cal-y-${m}`}>
          <h3 id={`cal-y-${m}`} className="flex items-baseline justify-between gap-2 border-b border-[var(--mv-hairline)] px-3 pb-2 text-sm font-semibold text-[var(--text-primary)]">
            {MONTHS[m]}
            {daysOff ? <span className="text-xs font-normal text-[var(--text-tertiary)]">{workingDays(year, m, daysOff)} días hábiles</span> : null}
          </h3>
          <ul className="pt-1">
            {list.map((e) => (
              <EntryRow key={e.id} entry={e} onHide={onHide} today={today} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function CalendarClient({
  today,
  initialDate,
  initialYears,
  initialPrefs,
  regions,
}: {
  today: string;
  /** Día pedido por link (?fecha=yyyy-mm-dd), ya validado. */
  initialDate: string | null;
  initialYears: Record<number, CalendarYearData>;
  initialPrefs: CalendarPrefs;
  regions: Record<string, CalendarRegion[]>;
}) {
  const todayYear = Number(today.slice(0, 4));
  const minYear = todayYear - YEAR_SPAN;
  const maxYear = todayYear + YEAR_SPAN;
  const start = initialDate ?? today;

  const [prefs, setPrefs] = useState(initialPrefs);
  const [view, setView] = useState<"mes" | "anio">("mes");
  const [year, setYear] = useState(Number(start.slice(0, 4)));
  const [month, setMonth] = useState(Number(start.slice(5, 7)) - 1);
  const [selected, setSelected] = useState<string | null>(start);
  // Caché por año: lo que vino del servidor más lo que se va cargando.
  const [years, setYears] = useState<Record<number, YearSlot>>(() =>
    Object.fromEntries(Object.entries(initialYears).map(([y, data]) => [Number(y), { ...data, gen: 0 }])),
  );
  const [gen, setGen] = useState(0);
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({});
  // Año → generación en la que falló (una falla vieja no frena la recarga con preferencias nuevas).
  const [failedYears, setFailedYears] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [sheetOpen, setSheetOpen] = useState(false);

  const genRef = useRef(0);
  const versionRef = useRef(prefsVersion(initialPrefs));
  const inflight = useRef(new Map<string, Promise<boolean>>());
  // Guardado en serie: un PUT a la vez; lo que llega mientras tanto se junta y se manda al final.
  const saving = useRef(false);
  const queuedPrefs = useRef<CalendarPrefs | null>(null);

  /** Pide las fechas de un año. Devuelve false si falló. Dos pedidos iguales en vuelo comparten la promesa. */
  const fetchYear = useCallback((target: number): Promise<boolean> => {
    const g = genRef.current;
    const id = `${target}:${g}`;
    const running = inflight.current.get(id);
    if (running) return running;
    const run = (async () => {
      setLoadingYears((s) => ({ ...s, [target]: true }));
      try {
        const res = await fetch(`/api/calendar/events?year=${target}&includeHidden=1&v=${encodeURIComponent(versionRef.current)}`);
        const json = res.ok ? await res.json() : null;
        const data = json?.success ? json.data : null;
        // Tiene que volver el año pedido: si no, no se muestra como si lo fuera.
        if (!data || data.year !== target || !Array.isArray(data.entries)) throw new Error("Respuesta inválida");
        setYears((prev) =>
          prev[target] && prev[target].gen > g
            ? prev
            : { ...prev, [target]: { gen: g, entries: data.entries, daysOff: Array.isArray(data.daysOff) ? data.daysOff : [] } },
        );
        setFailedYears((s) => without(s, target));
        return true;
      } catch {
        setFailedYears((s) => ({ ...s, [target]: g }));
        return false;
      } finally {
        inflight.current.delete(id);
        setLoadingYears((s) => ({ ...s, [target]: false }));
      }
    })();
    inflight.current.set(id, run);
    return run;
  }, []);

  // Carga lo que falta o quedó viejo: el año que se ve y los de "Próximas fechas"; después, los vecinos.
  useEffect(() => {
    const fresh = (y: number) => years[y]?.gen === gen;
    const blocked = (y: number) => failedYears[y] === gen;
    const inRange = (y: number) => y >= minYear && y <= maxYear;
    for (const y of [year, todayYear, todayYear + 1]) if (inRange(y) && !fresh(y) && !blocked(y)) void fetchYear(y);
    if (fresh(year)) for (const y of [year - 1, year + 1]) if (inRange(y) && !fresh(y) && !blocked(y)) void fetchYear(y);
  }, [year, gen, years, failedYears, fetchYear, todayYear, minYear, maxYear]);

  // Al llegar a un año que falló de fondo (precarga), se reintenta una vez sin pedirle nada a la persona.
  useEffect(() => {
    setFailedYears((s) => (year in s ? without(s, year) : s));
  }, [year]);

  const retryYear = (y: number) => {
    setFailedYears((s) => without(s, y));
    void fetchYear(y);
  };

  const flushSaves = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      for (let next = queuedPrefs.current; next; next = queuedPrefs.current) {
        queuedPrefs.current = null;
        let ok = false;
        try {
          const res = await fetch("/api/calendar/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          ok = res.ok;
        } catch {
          ok = false;
        }
        // Llegó un cambio más nuevo: se manda ya.
        if (queuedPrefs.current) continue;
        if (!ok) {
          setStatus("error");
          continue;
        }
        setStatus("saved");
        const version = prefsVersion(next);
        if (version !== versionRef.current) {
          // Cambió algo que define las fechas: lo cargado queda viejo y el efecto de arriba lo vuelve a pedir.
          versionRef.current = version;
          genRef.current += 1;
          setGen(genRef.current);
        }
      }
    } finally {
      saving.current = false;
    }
  }, []);

  const onPrefsChange = (next: CalendarPrefs) => {
    setPrefs(next);
    setStatus("saving");
    queuedPrefs.current = next;
    void flushSaves();
  };

  const hide = (key: string) => onPrefsChange({ ...prefs, hidden: [...prefs.hidden, key] });
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  /** Va a un día: cambia de mes y de año si hace falta. */
  const goTo = useCallback(
    (date: string) => {
      const y = Number(date.slice(0, 4));
      if (y < minYear || y > maxYear) return;
      setYear(y);
      setMonth(Number(date.slice(5, 7)) - 1);
      setSelected(date);
    },
    [minYear, maxYear],
  );

  // Un link nuevo a /calendario?fecha=… sin desmontar la página.
  const lastInitial = useRef(initialDate);
  useEffect(() => {
    if (!initialDate || initialDate === lastInitial.current) return;
    lastInitial.current = initialDate;
    setView("mes");
    goTo(initialDate);
  }, [initialDate, goTo]);

  const goMonth = (delta: number) => {
    const total = year * 12 + month + delta;
    const y = Math.floor(total / 12);
    if (y < minYear || y > maxYear) return;
    setYear(y);
    setMonth(total - y * 12);
    setSelected(null);
  };

  const goYear = (y: number) => {
    if (y < minYear || y > maxYear) return;
    setYear(y);
    setSelected(null);
  };

  const goToday = () => goTo(today);

  /** "Elegí qué ver": en escritorio lleva al panel de al lado; en el celular abre la hoja. */
  const openPrefs = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      const el = document.getElementById("cal-aside-country");
      el?.scrollIntoView({ block: "center" });
      el?.focus({ preventScroll: true });
    } else {
      setSheetOpen(true);
    }
  };

  const hiddenSet = useMemo(() => new Set(prefs.hidden), [prefs.hidden]);
  const sourceSet = useMemo(() => new Set(prefs.sources), [prefs.sources]);
  // Ocultas y fuentes apagadas se filtran acá, así el cambio se ve al instante (sin esperar al servidor).
  const isVisible = useCallback((e: CalendarEntry) => !hiddenSet.has(e.key) && sourceSet.has(e.source), [hiddenSet, sourceSet]);

  const slot = years[year];
  const visible = useMemo(() => (slot?.entries ?? []).filter(isVisible), [slot, isVisible]);
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of visible) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [visible]);
  const hiddenEntries = useMemo(() => {
    const seen = new Set<string>();
    const out: CalendarEntry[] = [];
    for (const y of Object.keys(years).map(Number).sort()) {
      for (const e of years[y].entries) {
        if (!hiddenSet.has(e.key) || !sourceSet.has(e.source) || seen.has(e.key)) continue;
        seen.add(e.key);
        out.push(e);
      }
    }
    return out;
  }, [years, hiddenSet, sourceSet]);

  // "Próximas fechas" sale siempre de este año y el siguiente, aunque estés mirando otro.
  const upcoming = useMemo(
    () => upcomingFrom([...(years[todayYear]?.entries ?? []), ...(years[todayYear + 1]?.entries ?? [])].filter(isVisible), today, 6),
    [years, todayYear, isVisible, today],
  );

  const daysOff = useMemo(() => (slot ? new Set(slot.daysOff) : null), [slot]);
  const workdays = daysOff ? workingDays(year, month, daysOff) : null;
  const weekends = useMemo(() => (daysOff ? longWeekends(year, month, daysOff) : []), [daysOff, year, month]);

  const showHebrew = usesJewishCalendar(prefs);
  // Las fechas hebreas del mes se calculan una vez por mes, no en cada celda en cada render.
  const hebrewLabels = useMemo(() => {
    if (!showHebrew) return null;
    const map = new Map<string, string | null>();
    for (const week of monthWeeks(year, month)) for (const d of week) if (d) map.set(d, hebrewDay(d));
    return map;
  }, [showHebrew, year, month]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntries = visible.filter((e) => e.date.startsWith(monthPrefix));
  const selectedEntries = selected ? (byDate.get(selected) ?? []) : [];
  const selectedHebrew = selected && showHebrew ? (hebrewLabels?.get(selected) ?? hebrewDay(selected)) : null;
  const loading = !!loadingYears[year];
  const failed = failedYears[year] === gen && slot?.gen !== gen;
  const nothingSelected = prefs.sources.length === 0;
  const activeSources = SOURCE_KEYS.filter((k) => sourceSet.has(k));

  const country = latamCountry(prefs.country);
  const hasCountry = prefs.sources.some((s) => calendarSource(s).group === "pais");
  const upcomingLabel = hasCountry ? `${showHebrew ? "Próximas fechas" : "Próximos feriados"} · ${country.name}` : "Próximas fechas · calendario hebreo";
  const decrees = prefs.country === "BO" ? boliviaDecrees(year) : [];
  const regionName = prefs.sources.includes("FERIADOS_REGIONALES") && prefs.region ? regions[prefs.country]?.find((r) => r.code === prefs.region)?.name : null;

  const atStart = view === "anio" ? year <= minYear : year <= minYear && month === 0;
  const atEnd = view === "anio" ? year >= maxYear : year >= maxYear && month === 11;
  const navButton =
    "mv-focus grid h-11 w-11 place-items-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)] disabled:pointer-events-none disabled:opacity-30";

  const panelProps = { prefs, regions, hiddenEntries, onChange: onPrefsChange, status };

  return (
    <AppPage
      title="Calendario"
      lead={`Feriados de ${country.name} y fechas del calendario hebreo. Elegí qué querés ver y ocultá lo que no te sirve.`}
      width="wide"
      actions={
        <>
          <button type="button" onClick={() => setSheetOpen(true)} className={buttonClass("secondary", "sm", "min-h-11 lg:hidden")}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Elegí qué ver
          </button>
          <ExportMenu year={year} />
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {nothingSelected ? (
            <div className="mv-panel flex flex-col items-start gap-4 p-6">
              <span className="mv-kicker">Tu calendario</span>
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                No elegiste ninguna fuente. Activá los feriados de tu país o el calendario hebreo para empezar.
              </p>
              <button type="button" onClick={openPrefs} className={buttonClass("primary", "sm", "min-h-11")}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Elegí qué ver
              </button>
            </div>
          ) : upcoming.length ? (
            <UpcomingCard
              label={upcomingLabel}
              groups={upcoming}
              today={today}
              onPick={(date) => {
                setView("mes");
                goTo(date);
              }}
            />
          ) : null}

          <section aria-labelledby="cal-month" className="mv-panel p-2 sm:p-5">
            <div className="flex items-center justify-between gap-1 px-1 pb-1">
              <MonthPicker
                year={year}
                month={month}
                view={view}
                minYear={minYear}
                maxYear={maxYear}
                onYear={goYear}
                onMonth={(m) => {
                  setMonth(m);
                  setView("mes");
                  setSelected(null);
                }}
              />
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={goToday}
                  className="mv-focus h-11 rounded-full px-3 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => (view === "anio" ? goYear(year - 1) : goMonth(-1))}
                  disabled={atStart}
                  aria-label={view === "anio" ? "Año anterior" : "Mes anterior"}
                  className={navButton}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => (view === "anio" ? goYear(year + 1) : goMonth(1))}
                  disabled={atEnd}
                  aria-label={view === "anio" ? "Año siguiente" : "Mes siguiente"}
                  className={navButton}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
              <div role="group" aria-label="Vista" className="inline-flex rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel-sunk)] p-0.5">
                {(
                  [
                    ["mes", "Mes"],
                    ["anio", "Año"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={view === value}
                    onClick={() => setView(value)}
                    className={cn(
                      "mv-focus h-11 rounded-full px-5 text-[13px] font-semibold transition-colors",
                      view === value
                        ? "bg-[var(--mv-panel-hover)] text-[var(--text-primary)] shadow-sm ring-1 ring-inset ring-[var(--mv-hairline-strong)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {view === "mes" && workdays !== null ? (
                <p className="text-xs text-[var(--text-secondary)]" title={`De lunes a viernes, sin los feriados con descanso de ${regionName ?? country.name}`}>
                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">{workdays}</span> días hábiles
                  <span className="sr-only">
                    {" "}
                    (de lunes a viernes, sin los feriados con descanso de {regionName ? `${regionName}, ${country.name}` : country.name})
                  </span>
                </p>
              ) : null}
            </div>

            {view === "mes" && weekends.length ? (
              <ul aria-label="Fines de semana largos" className="flex flex-wrap gap-1.5 px-1 pb-3">
                {weekends.map((w) => (
                  <li key={w.kind === "largo" ? w.start : w.holiday} className={cn("mv-chip", w.kind === "largo" && "mv-chip-gold")}>
                    {weekendLabel(w)}
                  </li>
                ))}
              </ul>
            ) : null}

            <p role="status" className="sr-only">
              {loading ? `Cargando ${year}…` : ""}
            </p>
            {failed ? (
              <div role="alert" className="mx-1 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--mv-panel-sunk)] px-3 py-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  {slot ? `No pudimos actualizar las fechas de ${year}. Puede que no estén al día.` : `No pudimos cargar las fechas de ${year}.`}
                </p>
                <button
                  type="button"
                  onClick={() => retryYear(year)}
                  className="mv-focus inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--mv-gold-ink)] transition-colors hover:bg-[var(--mv-gold-wash)]"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Reintentar
                </button>
              </div>
            ) : null}

            {view === "mes" ? (
              <>
                <MonthGrid
                  year={year}
                  month={month}
                  today={today}
                  selected={selected}
                  byDate={byDate}
                  hebrewLabels={hebrewLabels}
                  loading={loading}
                  minDate={`${minYear}-01-01`}
                  maxDate={`${maxYear}-12-31`}
                  activeSources={activeSources}
                  onSelect={goTo}
                />
                {selected ? (
                  <div className="mt-4 border-t border-[var(--mv-hairline)] pt-3">
                    <p className="px-1 pb-1 text-sm font-semibold text-[var(--text-primary)]">
                      {dayLabel(selected)}
                      {selectedHebrew ? <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">{selectedHebrew}</span> : null}
                    </p>
                    {selectedEntries.length ? (
                      <ul>
                        {selectedEntries.map((e) => (
                          <EntryRow key={e.id} entry={e} onHide={hide} today={today} />
                        ))}
                      </ul>
                    ) : (
                      <p className="px-1 py-2 text-sm text-[var(--text-secondary)]">Sin fechas para este día.</p>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className={cn("transition-opacity", loading && "opacity-50")} aria-busy={loading}>
                <YearAgenda year={year} entries={visible} daysOff={daysOff} today={today} onHide={hide} />
              </div>
            )}
          </section>

          <div>
            {view === "mes" ? (
              <section aria-labelledby="cal-list">
                <h2 id="cal-list" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <CalendarDays className="h-4 w-4 text-[var(--mv-gold-ink)]" aria-hidden />
                  Fechas de {MONTHS[month].toLowerCase()}
                </h2>
                {monthEntries.length ? (
                  <ul className="mv-panel p-1.5">
                    {monthEntries.map((e) => (
                      <EntryRow key={e.id} entry={e} onHide={hide} today={today} />
                    ))}
                  </ul>
                ) : (
                  <p className="mv-panel p-5 text-sm text-[var(--text-secondary)]">No hay fechas este mes con lo que elegiste.</p>
                )}
              </section>
            ) : null}
            <p className={cn("text-xs leading-relaxed text-[var(--text-tertiary)]", view === "mes" && "mt-3")}>
              {prefs.country === "BO"
                ? decrees.length
                  ? `Feriados de Bolivia según el DS 2750 y, para ${year}, ${joinEs(decrees)}.`
                  : `Feriados de Bolivia según el DS 2750. Para ${year} todavía no cargamos decretos con traslados o feriados extra.`
                : "Feriados de tu país con datos de date-holidays (CC-BY 3.0)."}{" "}
              El calendario hebreo se calcula con hebcal. Si un gobierno mueve un feriado por decreto, puede tardar en reflejarse: confirmalo con la fuente oficial.
            </p>
          </div>
        </div>

        <aside className="mv-panel sticky top-28 hidden p-2 lg:block" aria-labelledby="cal-aside-title">
          <h2 id="cal-aside-title" className="px-3 pb-2 pt-2 font-display text-base font-semibold text-[var(--text-primary)]">
            Elegí qué ver
          </h2>
          <PrefsPanel idPrefix="aside" {...panelProps} />
        </aside>
      </div>

      <PrefsSheet open={sheetOpen} onClose={closeSheet}>
        <PrefsPanel idPrefix="sheet" {...panelProps} />
      </PrefsSheet>
    </AppPage>
  );
}
// creado por pato dev y askforvini
