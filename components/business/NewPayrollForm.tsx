"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { MONTH_NAMES } from "@/lib/business/format";
import { sendJson } from "@/lib/business/client";

export function NewPayrollForm({ slug, defaultYear, defaultMonth, years }: { slug: string; defaultYear: number; defaultMonth: number; years: number[] }) {
  const router = useRouter();
  const [year, setYear] = useState(years.includes(defaultYear) ? defaultYear : years[years.length - 1]);
  const [month, setMonth] = useState(defaultMonth);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await sendJson<{ id: string }>(`/api/business/${slug}/payroll`, "POST", { year, month });
    setBusy(false);
    if (!res.ok) {
      const existing = (res.data as { id?: string } | undefined)?.id;
      if (existing) return router.push(`/business/${slug}/planillas/${existing}`);
      return setError(res.error);
    }
    router.push(`/business/${slug}/planillas/${res.data!.id}`);
    router.refresh();
  }

  return (
    <div className="mv-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="pr-month" className="text-sm font-semibold text-[var(--text-primary)]">
            Mes
          </label>
          <select id="pr-month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="mv-input h-11">
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-28 flex-col gap-1.5">
          <label htmlFor="pr-year" className="text-sm font-semibold text-[var(--text-primary)]">
            Año
          </label>
          <select id="pr-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="mv-input h-11">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" onClick={create} disabled={busy} className={buttonClass("primary", "md")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        Nueva planilla
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-500 sm:basis-full">
          {error}
        </p>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
