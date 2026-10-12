"use client";

import { useEffect, useState } from "react";
import { Clock } from "@/components/icons";
import { DAY_NAMES, WEEK_ORDER, formatTime, openLabel, openState, todayKey, type WeeklyHours } from "@/lib/kosher/hours";
import { cn } from "@/lib/utils";

/**
 * La hora del primer render es la del servidor (renderedAt), así el HTML y la hidratación coinciden.
 * Después del montaje pasa a ser la del navegador y se actualiza cada minuto.
 */
export function useNow(initialIso: string | null) {
  const [now, setNow] = useState(() => (initialIso ? new Date(initialIso) : new Date()));
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** "Abierto · cierra 23:00" o "Cerrado · abre mañana 12:00", siempre con la palabra y el ícono. */
export function OpenNow({ hours, timezone, now, className }: { hours: WeeklyHours | null; timezone: string; now: Date; className?: string }) {
  const label = openLabel(openState(hours, timezone, now), todayKey(timezone, now));
  if (label.open === null) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        label.open ? "text-emerald-500 [.light_&]:text-emerald-700" : "text-[var(--text-secondary)]",
        className,
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label.text}
    </span>
  );
}

/** Semana de lunes a domingo, con hoy marcado con la palabra "hoy" además del fondo. */
export function HoursTable({ hours, timezone, now, city }: { hours: WeeklyHours; timezone: string; now: Date; city: string }) {
  const today = todayKey(timezone, now);
  return (
    <>
      <dl className="space-y-0.5 text-sm">
        {WEEK_ORDER.map((day) => {
          const isToday = day === today;
          const periods = hours[day] ?? [];
          return (
            <div key={day} className={cn("flex items-start justify-between gap-4 rounded-xl px-3 py-1.5", isToday && "bg-[var(--mv-gold-wash)]")}>
              <dt className={isToday ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
                {DAY_NAMES[day]}
                {isToday && <span className="ml-1.5 text-xs font-semibold text-[var(--mv-gold-ink)]">hoy</span>}
              </dt>
              <dd className={cn("text-right text-[var(--text-primary)]", isToday && "font-semibold")}>
                {periods.length ? (
                  periods.map((p) => (
                    <span key={`${p.open}-${p.close}`} className="mv-data block">
                      {formatTime(p.open)}–{formatTime(p.close)}
                    </span>
                  ))
                ) : (
                  <span className="text-[var(--text-secondary)]">Cerrado</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-2 px-3 text-xs text-[var(--text-tertiary)]">En hora local de {city}. Si vas en Shabat o en un jag, confirmá antes.</p>
    </>
  );
}
// creado por pato dev y askforvini
