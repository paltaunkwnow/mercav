"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number | string;
  status: "PENDING" | "COMPLETED" | "PAID";
  dueDate?: string | Date;
  completedAt?: string | Date;
  approvedAt?: string | Date;
  released?: boolean;
}

interface MilestoneCardProps {
  milestone: Milestone;
  isClient: boolean;
  isProvider: boolean;
  serviceId: string;
  onApprovalSuccess?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-blue-500/10", text: "text-blue-600", label: "Pendiente" },
  COMPLETED: { bg: "bg-yellow-500/10", text: "text-yellow-600", label: "Completado" },
  PAID: { bg: "bg-green-500/10", text: "text-green-600", label: "Pagado" },
};

const fmtMoney = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "—";
};

const fmtDate = (d: string | Date | undefined) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "medium" });
};

export default function MilestoneCard({
  milestone,
  isClient,
  isProvider,
  serviceId,
  onApprovalSuccess,
}: MilestoneCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const statusInfo = statusColors[milestone.status] || statusColors.PENDING;
  const canApprove =
    isClient &&
    milestone.status === "COMPLETED" &&
    !milestone.released &&
    !success;
  const canComplete =
    isProvider &&
    milestone.status === "PENDING" &&
    !success;

  const handleComplete = async () => {
    setIsCompleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/services/${serviceId}/milestone/${milestone.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Error al completar el hito. Intenta de nuevo más tarde."
        );
        return;
      }

      setSuccess(true);
      if (onApprovalSuccess) {
        onApprovalSuccess();
      }
    } catch (err) {
      console.error("Error completing milestone:", err);
      setError("Error de conexión. Intenta de nuevo más tarde.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/services/${serviceId}/milestone/${milestone.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Error al aprobar el hito. Intenta de nuevo más tarde."
        );
        return;
      }

      setSuccess(true);
      if (onApprovalSuccess) {
        onApprovalSuccess();
      }
    } catch (err) {
      console.error("Error approving milestone:", err);
      setError("Error de conexión. Intenta de nuevo más tarde.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {milestone.title}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
            >
              {statusInfo.label}
            </span>
          </div>
          {milestone.description && (
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              {milestone.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            ${fmtMoney(milestone.amount)}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">USD</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
        {milestone.dueDate && (
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Clock className="h-4 w-4" aria-hidden />
            <span>Vence: {fmtDate(milestone.dueDate)}</span>
          </div>
        )}
        {milestone.completedAt && (
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <span>Completado: {fmtDate(milestone.completedAt)}</span>
          </div>
        )}
        {milestone.approvedAt && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <span>Aprobado: {fmtDate(milestone.approvedAt)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          ¡Hito aprobado! Los fondos han sido liberados al freelancer.
        </div>
      )}

      {canApprove && (
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className={buttonClass("primary", "lg", "w-full")}
        >
          {isApproving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Liberar fondos
            </>
          )}
        </button>
      )}

      {canComplete && (
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className={buttonClass("primary", "lg", "w-full")}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Marcar como completado
            </>
          )}
        </button>
      )}

      {isProvider && milestone.status === "PENDING" && !canComplete && (
        <div className="text-xs text-[var(--text-tertiary)] italic">
          Este hito está completado. Esperando aprobación del cliente.
        </div>
      )}

      {isClient && milestone.status === "PENDING" && (
        <div className="text-xs text-[var(--text-tertiary)] italic">
          Esperando que el freelancer marque este hito como completado.
        </div>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
