"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, X } from "@/components/icons";
import { CALENDAR_SOURCES } from "@/lib/calendar/sources";
import type { CalendarEntry, CalendarPrefs, CalendarRegion, CalendarSourceKey } from "@/lib/calendar/types";
import { LATAM_COUNTRIES } from "@/lib/geo/latam";
import { cn } from "@/lib/utils";
import { SourceMark } from "./parts";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function Toggle({ on, onChange, label, desc, source }: { on: boolean; onChange: (next: boolean) => void; label: string; desc: string; source: CalendarSourceKey }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="mv-focus flex min-h-11 w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--mv-panel-hover)]"
    >
      <SourceMark source={source} className={cn("mt-1.5", !on && "opacity-30")} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="block text-xs leading-snug text-[var(--text-secondary)]">{desc}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors",
          on ? "border-transparent bg-gold" : "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)]",
        )}
      >
        <span
          className={cn(
            "absolute rounded-full shadow-sm transition-transform duration-200 motion-reduce:transition-none",
            on ? "translate-x-[1.15rem] bg-[var(--mv-on-gold)]" : "translate-x-[0.2rem] bg-[var(--text-tertiary)]",
          )}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </span>
    </button>
  );
}

export function PrefsPanel({
  idPrefix,
  prefs,
  regions,
  hiddenEntries,
  onChange,
  status,
}: {
  /** El panel se monta dos veces (aside de escritorio y hoja de mobile): el prefijo evita ids duplicados. */
  idPrefix: string;
  prefs: CalendarPrefs;
  regions: Record<string, CalendarRegion[]>;
  hiddenEntries: CalendarEntry[];
  onChange: (next: CalendarPrefs) => void;
  status: SaveStatus;
}) {
  const toggle = (key: CalendarSourceKey, on: boolean) =>
    onChange({ ...prefs, sources: on ? [...prefs.sources, key] : prefs.sources.filter((s) => s !== key) });
  const countryRegions = regions[prefs.country] ?? [];
  const regionWord = prefs.country === "BO" ? "departamento" : prefs.country === "AR" ? "provincia" : "región";
  const id = (name: string) => `cal-${idPrefix}-${name}`;

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby={id("pais")}>
        <h2 id={id("pais")} className="px-3 pb-1 text-xs font-semibold text-[var(--text-tertiary)]">
          Tu país
        </h2>
        <div className="px-3 pb-2">
          <label htmlFor={id("country")} className="sr-only">
            País
          </label>
          <select
            id={id("country")}
            value={prefs.country}
            onChange={(e) => onChange({ ...prefs, country: e.target.value, region: null })}
            className="mv-input text-sm"
          >
            {LATAM_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {CALENDAR_SOURCES.filter((s) => s.group === "pais").map((s) => {
          if (s.key === "FERIADOS_REGIONALES" && countryRegions.length === 0) return null;
          return (
            <div key={s.key}>
              <Toggle on={prefs.sources.includes(s.key)} onChange={(on) => toggle(s.key, on)} label={s.label} desc={s.desc} source={s.key} />
              {s.key === "FERIADOS_REGIONALES" && prefs.sources.includes("FERIADOS_REGIONALES") ? (
                <div className="px-3 pb-2 pl-[2.1rem]">
                  <label htmlFor={id("region")} className="sr-only">
                    {regionWord}
                  </label>
                  <select
                    id={id("region")}
                    value={prefs.region ?? ""}
                    onChange={(e) => onChange({ ...prefs, region: e.target.value || null })}
                    className="mv-input text-sm"
                  >
                    <option value="">Elegí tu {regionWord}</option>
                    {countryRegions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section aria-labelledby={id("judio")}>
        <h2 id={id("judio")} className="px-3 pb-1 text-xs font-semibold text-[var(--text-tertiary)]">
          Calendario hebreo
        </h2>
        {CALENDAR_SOURCES.filter((s) => s.group === "judio").map((s) => (
          <Toggle key={s.key} on={prefs.sources.includes(s.key)} onChange={(on) => toggle(s.key, on)} label={s.label} desc={s.desc} source={s.key} />
        ))}
        <div className="px-3 pt-2">
          <p id={id("israel")} className="pb-2 text-xs text-[var(--text-secondary)]">
            Las fiestas duran un día más fuera de Israel.
          </p>
          <div role="radiogroup" aria-labelledby={id("israel")} className="inline-flex rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-1">
            {[
              { value: false, label: "Diáspora" },
              { value: true, label: "Israel" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={prefs.israel === opt.value}
                onClick={() => onChange({ ...prefs, israel: opt.value })}
                className={cn(
                  "mv-focus h-11 rounded-full px-5 text-[13px] font-semibold transition-colors",
                  prefs.israel === opt.value ? "bg-gold text-[var(--mv-on-gold)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {hiddenEntries.length ? (
        <section aria-labelledby={id("hidden")}>
          <h2 id={id("hidden")} className="px-3 pb-1 text-xs font-semibold text-[var(--text-tertiary)]">
            Ocultas ({hiddenEntries.length})
          </h2>
          <ul>
            {hiddenEntries.map((e) => (
              <li key={e.key} className="flex items-center gap-2 rounded-2xl px-3 py-0.5">
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-secondary)]">{e.title}</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...prefs, hidden: prefs.hidden.filter((h) => h !== e.key) })}
                  aria-label={`Mostrar ${e.title}`}
                  className="mv-focus inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--mv-gold-ink)] transition-colors hover:bg-[var(--mv-gold-wash)]"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Mostrar
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p role="status" aria-live="polite" className="px-3 text-xs text-[var(--text-tertiary)]">
        {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado." : status === "error" ? "No se pudo guardar. Probá de nuevo." : "Se guarda solo."}
      </p>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Hoja de preferencias en mobile: sube desde abajo, atrapa el foco y lo devuelve al botón que la abrió. */
export function PrefsSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    // Lo que tenía el foco al abrir (el botón "Elegí qué ver"): vuelve ahí al cerrar.
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // Si la ventana pasa a escritorio, la hoja no se ve (lg:hidden): se cierra para no dejar el foco atrapado.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && onClose();
    desktop.addEventListener("change", onDesktop);
    const raf = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      document.body.style.overflow = prevOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div key="cal-sheet" className="fixed inset-0 z-[150] lg:hidden">
          {/* Fondo: se toca para cerrar, pero no entra en el orden de tabulación ni lo lee el lector. */}
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-sheet-title"
            className="mv-panel absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-b-none px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-16px_48px_-16px_rgba(0,0,0,0.5)]"
            initial={{ y: reduce ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : "100%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", damping: 36, stiffness: 380, mass: 0.9 }}
          >
            <span aria-hidden className="mx-auto mb-1 block h-1 w-10 rounded-full bg-[var(--mv-hairline-strong)]" />
            <div className="flex items-center justify-between px-3 pb-3">
              <h2 id="cal-sheet-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Elegí qué ver
              </h2>
              <button
                type="button"
                data-autofocus
                onClick={onClose}
                aria-label="Cerrar"
                className="mv-focus -mr-1 grid h-11 w-11 place-items-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
// creado por pato dev y askforvini
