"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, FileText, Loader2, Lock, RefreshCw, Trash2, Unlock } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import type { PayrollLineView } from "@/lib/business/payroll-view";
import { toPayslipLine } from "@/lib/business/payslip-line";
import type { LineInputs } from "@/lib/business/payroll-service";
import { formatMoney } from "@/lib/geo/latam";
import { periodLabel } from "@/lib/business/format";
import { sendJson } from "@/lib/business/client";
import { downloadPayslip } from "./payslip";
import { Notice } from "./ui";
import { cn } from "@/lib/utils";

type Workspace = { slug: string; name: string; legalName: string | null; nit: string | null; country: string; currency: string };

const FIELDS: { key: keyof LineInputs; label: string; short: string; step: string; max: number; money?: boolean; hint?: string }[] = [
  { key: "daysWorked", label: "Días pagados", short: "Días", step: "1", max: 30 },
  { key: "overtimeHours", label: "Horas extra", short: "H. extra", step: "0.5", max: 400 },
  { key: "sundayHolidayDays", label: "Domingos o feriados trabajados", short: "Dom./fer.", step: "0.5", max: 31 },
  { key: "otherBonuses", label: "Otros bonos", short: "Bonos", step: "0.01", max: 1_000_000, money: true },
  { key: "advances", label: "Anticipos", short: "Anticipos", step: "0.01", max: 1_000_000, money: true },
  { key: "otherDeductions", label: "Otros descuentos", short: "Otros desc.", step: "0.01", max: 1_000_000, money: true },
  { key: "rcivaCredit", label: "Facturas del Form. 110 (total)", short: "Facturas", step: "0.01", max: 1_000_000, money: true, hint: "RC-IVA: se descuenta el 13 % de este total" },
];

function Breakdown({ line, money }: { line: PayrollLineView; money: (v: number) => string }) {
  const r = line.result;
  const rows: [string, number, boolean?][] = [
    ["Haber básico", r.earned.basic],
    [`Bono de antigüedad (${Math.round(r.seniorityRate * 100)} %, ${r.serviceYears} años)`, r.earned.seniority],
    ["Horas extra", r.earned.overtime],
    ["Dominicales y feriados", r.earned.sundayHoliday],
    ["Otros bonos", r.earned.otherBonuses],
    ["Total ganado", r.earned.total, true],
    ["Gestora: vejez 10 %", -r.deductions.gestora.vejez],
    ["Gestora: riesgo común 1,71 %", -r.deductions.gestora.riesgoComun],
    ["Gestora: comisión 0,5 %", -r.deductions.gestora.comision],
    ["Gestora: aporte solidario 0,5 %", -r.deductions.gestora.solidario],
    ["Aporte Nacional Solidario", -r.deductions.ans],
    ["RC-IVA retenido", -r.deductions.rciva.retained],
    ["Anticipos", -r.deductions.advances],
    ["Otros descuentos", -r.deductions.otherDeductions],
    ["Líquido pagable", r.netPay, true],
  ];
  const employer: [string, number, boolean?][] = [
    ["CNS 10 %", r.employer.cns],
    ["Riesgo profesional 1,71 %", r.employer.riesgoProfesional],
    ["Aporte Patronal Solidario 3,5 %", r.employer.patronalSolidario],
    ["Pro vivienda 2 %", r.employer.vivienda],
    ["Provisión aguinaldo", r.provisions.aguinaldo],
    ["Provisión indemnización", r.provisions.indemnizacion],
    ["Costo empresa", r.employerCost, true],
  ];
  const list = (items: [string, number, boolean?][]) => (
    <dl className="divide-y divide-[var(--mv-hairline)]">
      {items.map(([label, value, strong]) => (
        <div key={label} className="flex items-baseline justify-between gap-3 py-1.5">
          <dt className={cn("text-xs", strong ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{label}</dt>
          <dd className={cn("text-xs tabular-nums", strong ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{money(value)}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <div className="grid gap-4 border-t border-[var(--mv-hairline)] pt-3 sm:grid-cols-2">
      <div>
        <p className="pb-1 text-xs font-semibold text-[var(--text-tertiary)]">Trabajador</p>
        {list(rows)}
        {r.deductions.rciva.saldoAFavor > 0 ? <p className="pt-2 text-xs text-[var(--text-secondary)]">Saldo a favor del dependiente (RC-IVA): {money(r.deductions.rciva.saldoAFavor)}</p> : null}
      </div>
      <div>
        <p className="pb-1 text-xs font-semibold text-[var(--text-tertiary)]">Empresa</p>
        {list(employer)}
      </div>
    </div>
  );
}

function LineCard({
  line,
  editable,
  money,
  onSave,
  onPayslip,
}: {
  line: PayrollLineView;
  editable: boolean;
  money: (v: number) => string;
  onSave: (id: string, inputs: LineInputs) => Promise<string | null>;
  onPayslip: (line: PayrollLineView) => void;
}) {
  const [draft, setDraft] = useState<Record<keyof LineInputs, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f.key, String(line.inputs[f.key])])) as Record<keyof LineInputs, string>,
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si la fila cambia desde afuera (por ejemplo "Actualizar desde legajos"), se refleja en los campos.
  // El campo que la persona está editando no se pisa.
  useEffect(() => {
    // Con un guardado en curso o en cola, lo que hay en pantalla es más nuevo que `line`.
    if (inFlight.current || queued.current) return;
    const focused = typeof document !== "undefined" ? document.activeElement?.id : undefined;
    setDraft((d) => {
      const differs = FIELDS.some((f) => Number(d[f.key] || 0) !== line.inputs[f.key]);
      if (!differs) return d;
      return Object.fromEntries(
        FIELDS.map((f) => [f.key, focused === `${line.id}-${f.key}` ? d[f.key] : String(line.inputs[f.key])]),
      ) as Record<keyof LineInputs, string>;
    });
  }, [line.id, line.inputs]);

  // Un guardado a la vez por fila: si se edita mientras guarda, se manda lo último al terminar.
  const inFlight = useRef(false);
  const queued = useRef<LineInputs | null>(null);
  const lastSent = useRef<LineInputs>(line.inputs);
  useEffect(() => {
    if (!inFlight.current) lastSent.current = line.inputs;
  }, [line.inputs]);

  const flush = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    while (queued.current) {
      const next = queued.current;
      queued.current = null;
      lastSent.current = next;
      const message = await onSave(line.id, next);
      setError(message);
    }
    inFlight.current = false;
    setSaving(false);
  };

  const commit = () => {
    const next = Object.fromEntries(FIELDS.map((f) => [f.key, Number(draft[f.key] || 0)])) as LineInputs;
    const base = queued.current ?? lastSent.current;
    if (!FIELDS.some((f) => next[f.key] !== base[f.key])) return;
    queued.current = next;
    void flush();
  };

  const e = line.employee;
  return (
    <li className="mv-panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
            {e.lastName} {e.firstName}
          </p>
          <p className="truncate text-xs text-[var(--text-secondary)]">
            {[e.position, e.sensitive ? `Haber ${money(e.sensitive.baseSalary)}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5 text-right sm:gap-4">
          <div>
            <p className="text-[11px] text-[var(--text-tertiary)]">Ganado</p>
            <p className="text-sm tabular-nums text-[var(--text-primary)]">{money(line.result.earned.total)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-tertiary)]">Descuentos</p>
            <p className="text-sm tabular-nums text-[var(--text-primary)]">{money(line.result.deductions.total)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-tertiary)]">Líquido</p>
            <p className="text-base font-semibold tabular-nums text-gold">{money(line.result.netPay)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {FIELDS.map((f) => {
          const id = `${line.id}-${f.key}`;
          return (
            <div key={f.key} className="flex flex-col gap-1">
              <label htmlFor={id} className="truncate text-[11px] font-semibold text-[var(--text-tertiary)]" title={f.hint ?? f.label}>
                {f.short}
                <span className="sr-only"> ({f.label})</span>
              </label>
              <input
                id={id}
                type="number"
                inputMode="decimal"
                min={0}
                max={f.max}
                step={f.step}
                disabled={!editable}
                aria-busy={saving || undefined}
                value={draft[f.key]}
                onChange={(ev) => setDraft((d) => ({ ...d, [f.key]: ev.target.value }))}
                onFocus={(ev) => ev.currentTarget.select()}
                onBlur={commit}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") (ev.target as HTMLInputElement).blur();
                }}
                className="mv-input h-9 px-2.5 text-right text-sm tabular-nums disabled:opacity-60"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mv-focus inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
          Detalle
        </button>
        <button type="button" onClick={() => onPayslip(line)} className="mv-focus inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Boleta PDF
        </button>
        {saving ? <span className="text-xs text-[var(--text-tertiary)]">Calculando…</span> : null}
        {line.result.netCapped ? <span className="text-xs text-amber-500">Los descuentos superan lo ganado.</span> : null}
        {error ? (
          <span role="alert" className="text-xs text-red-500">
            {error}
          </span>
        ) : null}
      </div>
      {open ? <Breakdown line={line} money={money} /> : null}
    </li>
  );
}

export function PayrollEditor({
  workspace,
  run,
  initialLines,
  perms,
  verify,
}: {
  workspace: Workspace;
  run: { id: string; year: number; month: number; status: "DRAFT" | "CLOSED"; smn: number };
  initialLines: PayrollLineView[];
  perms: { edit: boolean; close: boolean; reopen: boolean; export: boolean };
  verify: string[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState(initialLines);
  useEffect(() => setLines(initialLines), [initialLines]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const money = (v: number) => formatMoney(v, workspace.country, workspace.currency);
  const editable = run.status === "DRAFT" && perms.edit;

  const totals = useMemo(() => {
    const sum = (pick: (l: PayrollLineView) => number) => Math.round(lines.reduce((acc, l) => acc + pick(l), 0) * 100) / 100;
    return {
      earned: sum((l) => l.result.earned.total),
      deductions: sum((l) => l.result.deductions.total),
      net: sum((l) => l.result.netPay),
      cost: sum((l) => l.result.employerCost),
    };
  }, [lines]);

  const saveLine = async (id: string, inputs: LineInputs) => {
    const res = await sendJson<PayrollLineView>(`/api/business/${workspace.slug}/payroll/${run.id}/lines/${id}`, "PATCH", inputs);
    if (!res.ok) return res.error;
    setLines((ls) => ls.map((l) => (l.id === id ? res.data! : l)));
    return null;
  };

  const act = async (action: "close" | "reopen" | "sync") => {
    if (action === "close" && !window.confirm("¿Cerrar la planilla? Ya no se podrá editar.")) return;
    setBusy(action);
    setError(null);
    const res = await sendJson(`/api/business/${workspace.slug}/payroll/${run.id}`, "PATCH", { action });
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm("¿Borrar este borrador? No se puede deshacer.")) return;
    setBusy("delete");
    const res = await sendJson(`/api/business/${workspace.slug}/payroll/${run.id}`, "DELETE");
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.push(`/business/${workspace.slug}/planillas`);
    router.refresh();
  };

  const payslip = (line: PayrollLineView) =>
    void downloadPayslip({ line: toPayslipLine(line), year: run.year, month: run.month, workspace, draft: run.status === "DRAFT" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("mv-chip", run.status === "CLOSED" && "mv-chip-gold")}>{run.status === "CLOSED" ? "Cerrada" : "Borrador"}</span>
        <span className="text-xs text-[var(--text-secondary)]">Salario mínimo usado: {money(run.smn)}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {perms.export ? (
            <a href={`/api/business/${workspace.slug}/payroll/${run.id}/export`} className={buttonClass("secondary", "sm")}>
              <Download className="h-4 w-4" aria-hidden />
              Exportar Excel
            </a>
          ) : null}
          {editable ? (
            <button type="button" onClick={() => act("sync")} disabled={!!busy} className={buttonClass("ghost", "sm")}>
              {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              Actualizar desde legajos
            </button>
          ) : null}
          {run.status === "DRAFT" && perms.close ? (
            <button type="button" onClick={() => act("close")} disabled={!!busy} className={buttonClass("primary", "sm")}>
              {busy === "close" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
              Cerrar planilla
            </button>
          ) : null}
          {run.status === "CLOSED" && perms.reopen ? (
            <button type="button" onClick={() => act("reopen")} disabled={!!busy} className={buttonClass("ghost", "sm")}>
              {busy === "reopen" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Unlock className="h-4 w-4" aria-hidden />}
              Reabrir
            </button>
          ) : null}
        </div>
      </div>

      <Notice tone="warn">
        <strong className="font-semibold">Pre-planilla.</strong> Los cálculos usan los parámetros {run.year} de la normativa boliviana y los tiene que revisar tu contador antes de pagar o declarar.
        {verify.length ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold">Qué conviene confirmar ({verify.length})</summary>
            <ul className="mt-1 list-disc pl-5 text-xs">
              {verify.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </Notice>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total ganado", totals.earned],
          ["Descuentos", totals.deductions],
          ["Líquido pagable", totals.net],
          ["Costo empresa", totals.cost],
        ].map(([label, value]) => (
          <div key={label as string} className="mv-panel p-4">
            <p className="text-xs font-semibold text-[var(--text-tertiary)]">{label}</p>
            <p className="font-display text-xl font-semibold tabular-nums text-[var(--text-primary)]">{money(value as number)}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {lines.length ? (
        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <LineCard key={line.id} line={line} editable={editable} money={money} onSave={saveLine} onPayslip={payslip} />
          ))}
        </ul>
      ) : (
        <p className="mv-panel p-5 text-sm text-[var(--text-secondary)]">No hay trabajadores en esta planilla. Cargá trabajadores y tocá “Actualizar desde legajos”.</p>
      )}

      {run.status === "DRAFT" && perms.edit ? (
        <button type="button" onClick={remove} disabled={!!busy} className="mv-focus inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10">
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Borrar borrador
        </button>
      ) : null}
      <p className="text-xs text-[var(--text-tertiary)]">{periodLabel(run.year, run.month)} · {workspace.legalName || workspace.name}</p>
    </div>
  );
}
// creado por pato dev y askforvini
