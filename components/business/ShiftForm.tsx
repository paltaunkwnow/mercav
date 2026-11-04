"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check } from "@/components/icons";

interface ShiftFormProps {
  slug: string;
  employees: Array<{ id: string; name: string }>;
  mode: "create" | "edit";
  initialData?: {
    id: string;
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    shiftType: string;
    notes?: string;
  };
}

export function ShiftForm({
  slug,
  employees,
  mode,
  initialData,
}: ShiftFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || "",
    date: initialData?.date || "",
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    shiftType: initialData?.shiftType || "OTRO",
    notes: initialData?.notes || "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!formData.employeeId) {
      setError("Selecciona un empleado");
      return;
    }
    if (!formData.date) {
      setError("Selecciona una fecha");
      return;
    }
    if (!formData.startTime) {
      setError("Ingresa la hora de inicio");
      return;
    }
    if (!formData.endTime) {
      setError("Ingresa la hora de fin");
      return;
    }

    startTransition(async () => {
      try {
        const method = mode === "create" ? "POST" : "PUT";
        const url =
          mode === "create"
            ? `/api/business/${slug}/shifts`
            : `/api/business/${slug}/shifts/${initialData?.id}`;

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Error al guardar el turno");
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push(`/business/${slug}/turnos`);
        }, 1000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error desconocido"
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/business/${slug}/turnos`}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20 p-4 flex gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Turno guardado exitosamente
            </p>
          </div>
        )}

        {/* Employee Selection */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            Empleado *
          </label>
          <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecciona un empleado...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            Fecha *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Hora Inicio *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              disabled={isPending}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Hora Fin *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              disabled={isPending}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Shift Type */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            Tipo de Turno
          </label>
          <select
            name="shiftType"
            value={formData.shiftType}
            onChange={handleChange}
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="MATUTINO">Matutino</option>
            <option value="VESPERTINO">Vespertino</option>
            <option value="NOCTURNO">Nocturno</option>
            <option value="COMPLETO">Completo</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
            Notas
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={isPending}
            maxLength={500}
            rows={3}
            placeholder="Observaciones o notas sobre el turno..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {formData.notes.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 transition-colors disabled:cursor-not-allowed"
          >
            {isPending ? "Guardando..." : mode === "create" ? "Crear Turno" : "Actualizar Turno"}
          </button>
          <Link
            href={`/business/${slug}/turnos`}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold py-2 px-6 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
// creado por pato dev y askforvini
