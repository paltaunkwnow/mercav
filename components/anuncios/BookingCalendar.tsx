"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarRange } from "@/components/icons";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  occupiedDates: { start: Date; end: Date }[];
  onDateChange?: (start: Date | null, end: Date | null) => void;
}

export default function BookingCalendar({ occupiedDates, onDateChange }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // "Hoy" depende de la zona horaria del navegador: se calcula después de montar para que
  // el HTML del servidor (otra zona) no difiera del cliente (hydration mismatch).
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setToday(now);
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);
  const isPast = (date: Date) => !!today && date < today;

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isDateOccupied = (date: Date) => {
    return occupiedDates.some(range => {
      const start = new Date(range.start);
      const end = new Date(range.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const isSelected = (date: Date) => {
    if (!startDate) return false;
    if (startDate && !endDate) return date.getTime() === startDate.getTime();
    return date >= startDate && date <= endDate!;
  };

  const rangeHasOccupied = (from: Date, to: Date) => {
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      if (isDateOccupied(new Date(d))) return true;
    }
    return false;
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(year, month, day);
    if (isDateOccupied(selected) || isPast(selected)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
      onDateChange?.(selected, null);
    } else if (startDate && !endDate) {
      if (selected < startDate) {
        setStartDate(selected);
        setEndDate(null);
        onDateChange?.(selected, null);
      } else if (rangeHasOccupied(startDate, selected)) {
        // El rango no puede atravesar días ya reservados: se reinicia desde el día elegido.
        setStartDate(selected);
        setEndDate(null);
        onDateChange?.(selected, null);
      } else {
        setEndDate(selected);
        onDateChange?.(startDate, selected);
      }
    }
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Padding for first week
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  const nights = startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1 : 0;

  return (
    <div className="mv-panel w-full p-4 sm:p-6 md:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]" aria-live="polite">
          {monthNames[month]} <span className="mv-data text-[var(--text-secondary)]">{year}</span>
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="mv-focus grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="mv-focus grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1" aria-hidden>
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
          <div key={day} className="py-1 text-center text-xs font-medium text-[var(--text-tertiary)]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          
          const date = new Date(year, month, day);
          const occupied = isDateOccupied(date);
          const past = isPast(date);
          const selected = isSelected(date);
          const isStart = startDate && date.getTime() === startDate.getTime();
          const isEnd = endDate && date.getTime() === endDate.getTime();
          const isToday = !!today && today.toDateString() === date.toDateString();
          const edge = isStart || isEnd;

          return (
            <button
              key={day}
              type="button"
              disabled={occupied || past}
              onClick={() => handleDateClick(day)}
              aria-pressed={!!selected && !occupied}
              aria-label={`${fmt(date)}${occupied ? ", ocupado" : ""}${isToday ? ", hoy" : ""}`}
              className={cn(
                "mv-focus mv-data relative flex h-10 items-center justify-center rounded-xl text-sm transition-colors duration-150 sm:h-12",
                occupied
                  ? "cursor-not-allowed text-[var(--text-tertiary)] line-through decoration-[var(--text-tertiary)] opacity-60"
                  : past
                    ? "cursor-not-allowed text-[var(--text-tertiary)] opacity-60"
                    : "text-[var(--text-primary)] hover:bg-[var(--mv-panel-hover)]",
                selected && !occupied && !edge && "bg-[var(--mv-gold-wash)]",
                edge && "bg-gold font-semibold !text-[var(--mv-on-gold)] hover:bg-gold",
                isToday && !selected && "ring-1 ring-inset ring-[var(--color-border-gold)]",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--mv-hairline)] pt-4 text-xs text-[var(--text-secondary)]">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[4px] bg-gold" aria-hidden /> Seleccionado
        </li>
        <li className="flex items-center gap-2">
          <span className="mv-data text-[var(--text-tertiary)] line-through" aria-hidden>12</span> Ocupado
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[4px] ring-1 ring-inset ring-[var(--color-border-gold)]" aria-hidden /> Hoy
        </li>
      </ul>

      <div aria-live="polite">
        {startDate ? (
          <div className="mv-fade mt-5 flex items-start gap-3 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4">
            <CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-[var(--text-secondary)]">Fechas seleccionadas</p>
              <p className="mv-data text-sm font-semibold text-[var(--text-primary)]">
                {fmt(startDate)}
                {endDate ? ` — ${fmt(endDate)}` : ""}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {endDate ? `${nights} ${nights === 1 ? "día" : "días"}. El total se calcula en el checkout.` : "Elegí la fecha final."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
