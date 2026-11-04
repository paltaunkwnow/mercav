"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "@/components/icons";
import type { BusinessEmployee, BusinessShift } from "@prisma/client";

interface ShiftWithEmployee extends BusinessShift {
  employee: { firstName: string; lastName: string };
}

interface ShiftsCalendarProps {
  slug: string;
  employees: BusinessEmployee[];
  shifts: ShiftWithEmployee[];
  canEdit: boolean;
  today: Date;
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Add days from previous month to fill first week
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  for (let d = new Date(startDate); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return days;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getShiftsForDate(
  shifts: ShiftWithEmployee[],
  date: Date,
  employeeId?: string
): ShiftWithEmployee[] {
  const dateStr = formatDate(date);
  return shifts.filter((s) => {
    const shiftDateStr = formatDate(s.date);
    return shiftDateStr === dateStr && (!employeeId || s.employeeId === employeeId);
  });
}

let isDeleting = false;

function deleteShift(shiftId: string, slug: string) {
  if (isDeleting) return; // Prevenir múltiples clicks
  if (confirm("¿Estás seguro de que quieres eliminar este turno?")) {
    isDeleting = true;
    fetch(`/api/business/${slug}/shifts/${shiftId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.reload();
        } else {
          alert("Error al eliminar el turno: " + (data.error || "desconocido"));
          isDeleting = false;
        }
      })
      .catch((err) => {
        alert("Error: " + err.message);
        isDeleting = false;
      });
  }
}

export function ShiftsCalendar({
  slug,
  employees,
  shifts,
  canEdit,
  today,
}: ShiftsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(today));

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const monthLabel = currentDate.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2 hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2 hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Próximo mes"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="space-y-2">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2">
              {dayLabels.map((label) => (
                <div
                  key={label}
                  className="text-center text-xs font-semibold text-[var(--text-secondary)] py-2"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {week.map((date, dateIndex) => {
                const isCurrentMonth =
                  date.getMonth() === currentDate.getMonth();
                const isToday =
                  formatDate(date) === formatDate(today);
                const dateShifts = getShiftsForDate(shifts, date);

                return (
                  <div
                    key={dateIndex}
                    className={`rounded-lg border min-h-[120px] p-2 transition-colors ${
                      isCurrentMonth
                        ? "bg-[var(--bg-primary)] border-[var(--border)]"
                        : "bg-[var(--bg-secondary)] border-[var(--border-muted)]"
                    } ${
                      isToday ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    {/* Date Number */}
                    <div className={`text-xs font-semibold mb-2 ${
                      isCurrentMonth
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)]"
                    }`}>
                      {date.getDate()}
                    </div>

                    {/* Shifts for this day */}
                    <div className="space-y-1 text-[10px]">
                      {dateShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="rounded bg-blue-100 dark:bg-blue-900 p-1 text-blue-900 dark:text-blue-100 flex items-start justify-between gap-1"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              {shift.employee.lastName}
                            </div>
                            <div className="text-xs opacity-80">
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => deleteShift(shift.id, slug)}
                              className="flex-shrink-0 hover:opacity-70 transition-opacity"
                              aria-label="Eliminar turno"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Shifts Table View */}
      {shifts.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Resumen de Turnos</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">
                  Empleado
                </th>
                <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">
                  Fecha
                </th>
                <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">
                  Hora
                </th>
                <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">
                  Tipo
                </th>
                {canEdit && (
                  <th className="text-left py-2 px-3 font-semibold text-[var(--text-secondary)]">
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-[var(--border-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="py-2 px-3">
                    {shift.employee.lastName} {shift.employee.firstName}
                  </td>
                  <td className="py-2 px-3">{formatDate(shift.date)}</td>
                  <td className="py-2 px-3">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="py-2 px-3 text-xs">
                    <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-1 text-blue-900 dark:text-blue-100">
                      {shift.shiftType}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-2 px-3">
                      <button
                        onClick={() => deleteShift(shift.id, slug)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        aria-label="Eliminar turno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
