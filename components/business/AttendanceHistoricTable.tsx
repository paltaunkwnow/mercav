"use client";

import { useMemo, useState } from "react";
import { Search, Download } from "@/components/icons";

interface AttendanceRecord {
  id: string;
  date: Date | string;
  checkInTime: Date | string;
  checkOutTime: Date | string | null;
  notes?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
  };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

function formatDate(date: Date | string) {
  if (typeof date === "string") date = new Date(date);
  return date.toLocaleDateString("es-ES", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTime(date: Date | string) {
  if (typeof date === "string") date = new Date(date);
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function calculateHours(checkIn: Date | string, checkOut: Date | string | null) {
  if (!checkOut) return "-";
  if (typeof checkIn === "string") checkIn = new Date(checkIn);
  if (typeof checkOut === "string") checkOut = new Date(checkOut);
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function AttendanceHistoricTable({
  records,
  employees,
  workspaceSlug,
}: {
  records: AttendanceRecord[];
  employees: Employee[];
  workspaceSlug: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchesQuery =
        !q ||
        `${r.employee.firstName} ${r.employee.lastName} ${r.employee.position ?? ""}`.toLowerCase().includes(q);

      const matchesEmployee = !selectedEmployeeId || r.employee.id === selectedEmployeeId;

      const recordDate = typeof r.date === "string" ? new Date(r.date) : r.date;
      const matchesStartDate = !startDate || recordDate >= new Date(startDate);
      const matchesEndDate = !endDate || recordDate <= new Date(endDate);

      return matchesQuery && matchesEmployee && matchesStartDate && matchesEndDate;
    });
  }, [records, query, selectedEmployeeId, startDate, endDate]);

  // Calcular total de horas
  const totalHours = useMemo(() => {
    let total = 0;
    shown.forEach((r) => {
      if (r.checkOutTime) {
        const checkIn = typeof r.checkInTime === "string" ? new Date(r.checkInTime) : r.checkInTime;
        const checkOut = typeof r.checkOutTime === "string" ? new Date(r.checkOutTime) : r.checkOutTime;
        total += checkOut.getTime() - checkIn.getTime();
      }
    });
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [shown]);

  function exportCSV() {
    const csv = [
      ["Fecha", "Empleado", "Cargo", "Entrada", "Salida", "Horas", "Notas"],
      ...shown.map((r) => [
        formatDate(r.date),
        `${r.employee.lastName} ${r.employee.firstName}`,
        r.employee.position || "",
        formatTime(r.checkInTime),
        r.checkOutTime ? formatTime(r.checkOutTime) : "-",
        calculateHours(r.checkInTime, r.checkOutTime),
        r.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistencia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="search-historic" className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
            <input
              id="search-historic"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o cargo"
              className="mv-input h-9 w-full pl-9 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="employee-filter" className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            Empleado
          </label>
          <select
            id="employee-filter"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="mv-input h-9 w-full text-sm"
          >
            <option value="">Todos</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.lastName} {emp.firstName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start-date" className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            Desde
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mv-input h-9 w-full text-sm"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            Hasta
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mv-input h-9 w-full text-sm"
          />
        </div>
      </div>

      {/* Resumen y botón de exportar */}
      {shown.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold text-[var(--text-primary)]">{shown.length}</span>
            <span className="text-[var(--text-secondary)]"> registros · </span>
            <span className="font-semibold text-[var(--text-primary)]">{totalHours}</span>
            <span className="text-[var(--text-secondary)]"> totales</span>
          </div>
          <button
            onClick={exportCSV}
            className="mv-button mv-button--secondary flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar CSV
          </button>
        </div>
      )}

      {/* Tabla */}
      {shown.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--mv-hairline)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Empleado</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Entrada</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Salida</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Horas</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((record) => (
                <tr key={record.id} className="border-b border-[var(--mv-hairline)] last:border-b-0 hover:bg-[var(--mv-panel-hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{formatDate(record.date)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {record.employee.lastName} {record.employee.firstName}
                      </div>
                      {record.employee.position && (
                        <div className="text-xs text-[var(--text-secondary)]">{record.employee.position}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[var(--text-primary)]">
                    {formatTime(record.checkInTime)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[var(--text-primary)]">
                    {record.checkOutTime ? formatTime(record.checkOutTime) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--text-secondary)]">
                    {calculateHours(record.checkInTime, record.checkOutTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--text-secondary)]">
          {records.length === 0
            ? "Sin registros de asistencia"
            : "No hay registros que coincidan con los filtros aplicados"}
        </p>
      )}
    </div>
  );
}
