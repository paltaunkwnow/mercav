"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { sendJson } from "@/lib/business/client";

const CATEGORIES = [
  { value: "SALARIOS", label: "Salarios" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OPERACION", label: "Operación" },
  { value: "OTROS", label: "Otros" },
];

export function AddExpenseForm({ slug, currency }: { slug: string; currency: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "OTROS",
    amount: "",
    description: "",
    receipt: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setBusy(false);
      return setError("El monto debe ser mayor a 0");
    }

    if (!formData.description.trim()) {
      setBusy(false);
      return setError("La descripción es requerida");
    }

    const res = await sendJson(`/api/business/${slug}/expenses`, "POST", {
      date: new Date(formData.date).toISOString(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      receipt: formData.receipt || undefined,
    });

    setBusy(false);

    if (!res.ok) {
      return setError(res.error);
    }

    setSuccess(true);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      category: "OTROS",
      amount: "",
      description: "",
      receipt: "",
    });

    setTimeout(() => {
      router.push(`/business/${slug}/gastos`);
      router.refresh();
    }, 500);
  }

  return (
    <form onSubmit={handleSubmit} className="mv-panel grid gap-4 p-5 sm:grid-cols-2">
      <h2 className="font-display text-base font-semibold text-[var(--text-primary)] sm:col-span-2">
        Registrar nuevo gasto
      </h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exp-date" className="text-sm font-semibold text-[var(--text-primary)]">
          Fecha *
        </label>
        <input
          id="exp-date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="mv-input h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exp-category" className="text-sm font-semibold text-[var(--text-primary)]">
          Categoría *
        </label>
        <select
          id="exp-category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mv-input h-11"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exp-amount" className="text-sm font-semibold text-[var(--text-primary)]">
          Monto ({currency}) *
        </label>
        <input
          id="exp-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          required
          className="mv-input h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exp-receipt" className="text-sm font-semibold text-[var(--text-primary)]">
          Comprobante (URL)
        </label>
        <input
          id="exp-receipt"
          name="receipt"
          type="url"
          value={formData.receipt}
          onChange={handleChange}
          placeholder="https://..."
          className="mv-input h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="exp-description" className="text-sm font-semibold text-[var(--text-primary)]">
          Descripción *
        </label>
        <textarea
          id="exp-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="¿Para qué es este gasto?"
          required
          rows={4}
          className="mv-input"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500 sm:col-span-2">
          {error}
        </p>
      ) : null}

      {success ? (
        <p role="status" className="flex items-center gap-2 text-sm text-green-500 sm:col-span-2">
          <Check className="h-4 w-4" aria-hidden />
          Gasto registrado correctamente
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || success}
        className={buttonClass("primary", "md", "sm:col-span-2")}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : success ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : null}
        {busy ? "Guardando..." : success ? "Registrado" : "Registrar gasto"}
      </button>
    </form>
  );
}
// creado por pato dev y askforvini
