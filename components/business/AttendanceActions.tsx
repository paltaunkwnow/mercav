"use client";

import { useState } from "react";
import { LogIn, LogOut } from "@/components/icons";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkOutTime: string | null;
}

export function AttendanceActions({
  workspaceSlug,
  employees,
  todayRecords,
}: {
  workspaceSlug: string;
  employees: Employee[];
  todayRecords: AttendanceRecord[];
}) {
  const router = useRouter();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Encontrar si el empleado seleccionado tiene check-in sin check-out
  const selectedRecord = selectedEmployeeId
    ? todayRecords.find((r) => r.employeeId === selectedEmployeeId && !r.checkOutTime)
    : null;

  const canCheckIn = selectedEmployeeId && !selectedRecord;
  const canCheckOut = selectedEmployeeId && selectedRecord;

  async function handleCheckIn() {
    if (!canCheckIn) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/business/${workspaceSlug}/attendance/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selectedEmployeeId,
            notes: notes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al registrar entrada");
        return;
      }

      setSuccess("Entrada registrada exitosamente");
      setSelectedEmployeeId("");
      setNotes("");
      router.refresh();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!canCheckOut) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/business/${workspaceSlug}/attendance/check-out`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selectedEmployeeId,
            notes: notes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al registrar salida");
        return;
      }

      setSuccess("Salida registrada exitosamente");
      setSelectedEmployeeId("");
      setNotes("");
      router.refresh();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="employee-select" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          Seleccionar empleado
        </label>
        <select
          id="employee-select"
          value={selectedEmployeeId}
          onChange={(e) => {
            setSelectedEmployeeId(e.target.value);
            setNotes("");
            setError("");
          }}
          className="mv-input w-full"
        >
          <option value="">-- Selecciona un empleado --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.lastName} {emp.firstName} {emp.position ? `(${emp.position})` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployeeId && (
        <>
          <div>
            <label htmlFor="notes-input" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Notas (opcional)
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Llego tarde, marcación manual..."
              className="mv-input w-full resize-none"
              rows={2}
            />
          </div>

          {selectedRecord ? (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              Empleado con entrada sin salida registrada. Puedes registrar la salida.
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
              Empleado disponible para registrar entrada.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={!canCheckIn || isLoading}
              className="mv-button mv-button--primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Fichar Entrada
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!canCheckOut || isLoading}
              className="mv-button mv-button--secondary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Fichar Salida
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          {success}
        </div>
      )}
    </div>
  );
}
