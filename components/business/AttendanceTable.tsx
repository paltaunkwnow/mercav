"use client";

import { useMemo, useState } from "react";
import { Search } from "@/components/icons";

interface AttendanceRecord {
  id: string;
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

export function AttendanceTable({
  records,
  workspaceSlug,
  readonly = false,
}: {
  records: AttendanceRecord[];
  workspaceSlug: string;
  readonly?: boolean;
}) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(
      (r) =>
        !q ||
        `${r.employee.firstName} ${r.employee.lastName} ${r.employee.position ?? ""}`.toLowerCase().includes(q)
    );
  }, [records, query]);

  return (
    <div className="flex flex-col gap-4 p-5">
      {records.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
          <label htmlFor="att-search" className="sr-only">
            Buscar empleado
          </label>
          <input
            id="att-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o cargo"
            className="mv-input h-10 w-full pl-9 text-sm"
          />
        </div>
      )}

      {shown.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--mv-hairline)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">Empleado</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Entrada</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Salida</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Horas</th>
                {!readonly && <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)]">Notas</th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((record) => (
                <tr key={record.id} className="border-b border-[var(--mv-hairline)] last:border-b-0 hover:bg-[var(--mv-panel-hover)]">
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
                  {!readonly && (
                    <td className="px-4 py-3 text-center">
                      {record.notes ? (
                        <span className="text-xs text-[var(--text-secondary)]">{record.notes}</span>
                      ) : (
                        <span className="text-xs text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--text-secondary)]">
          {query ? "No hay coincidencias." : "Sin registros de asistencia"}
        </p>
      )}
    </div>
  );
}
