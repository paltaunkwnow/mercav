"use client";

import { useId } from "react";
import { toast } from "sonner";
import { Copy, Plus, X } from "@/components/icons";
import { DAY_KEYS, DAY_NAMES, WEEK_ORDER, type DayKey, type HoursPeriod } from "@/lib/kosher/hours";
import { MAX_PERIODS, crossesMidnight, type HoursDraft } from "@/components/kosher/manage/details";
import { cn } from "@/lib/utils";

const DEFAULT_PERIOD: HoursPeriod = { open: "09:00", close: "18:00" };

const linkButton =
  "mv-focus inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-techelet transition-colors hover:text-[var(--text-primary)] disabled:opacity-50";

/** Interruptor chico, con el mismo gesto que el de modo Shabat. */
function DaySwitch({ on, label, onToggle, disabled }: { on: boolean; label: string; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "mv-focus relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
        on ? "bg-techelet" : "bg-[var(--mv-panel-hover)] ring-1 ring-inset ring-[var(--mv-hairline-strong)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none",
          on && "translate-x-5",
        )}
      />
    </button>
  );
}

/**
 * Horario semanal: cada día cerrado o con 1 a 4 turnos. Un turno que cierra antes de abrir pasa la medianoche.
 * Controlado: el borrador vive en el formulario que lo usa (Administrar o Sugerir).
 */
export function HoursEditor({
  value,
  onChange,
  problems = {},
  disabled,
}: {
  value: HoursDraft;
  onChange: (next: HoursDraft) => void;
  problems?: Partial<Record<DayKey, string>>;
  disabled?: boolean;
}) {
  const base = useId();
  const setDay = (day: DayKey, periods: HoursPeriod[]) => onChange({ ...value, [day]: periods });

  function toggle(day: DayKey) {
    if (value[day].length) return setDay(day, []);
    // Al abrir un día se propone el horario del día abierto más cercano antes que él.
    const index = WEEK_ORDER.indexOf(day);
    const before = [...WEEK_ORDER.slice(0, index)].reverse().concat(WEEK_ORDER.slice(index + 1));
    const template = before.map((d) => value[d]).find((p) => p.length) ?? [DEFAULT_PERIOD];
    setDay(day, template.map((p) => ({ ...p })));
  }

  function copyToAll(day: DayKey) {
    const periods = value[day];
    onChange(Object.fromEntries(DAY_KEYS.map((d) => [d, periods.map((p) => ({ ...p }))])) as HoursDraft);
    toast.success(`Copiamos el horario del ${DAY_NAMES[day].toLowerCase()} a todos los días.`);
  }

  function setPeriod(day: DayKey, index: number, patch: Partial<HoursPeriod>) {
    setDay(
      day,
      value[day].map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  return (
    <ul className="divide-y divide-[var(--mv-hairline)]" aria-label="Horario semanal">
      {WEEK_ORDER.map((day) => {
        const periods = value[day];
        const open = periods.length > 0;
        const name = DAY_NAMES[day];
        const lower = name.toLowerCase();
        const problemId = `${base}-${day}-problem`;
        const problem = problems[day];
        return (
          <li key={day} className="py-4 first:pt-0 last:pb-0">
            <div className="flex min-h-10 items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{name}</span>
              <span className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)]" aria-hidden>
                  {open ? "Abierto" : "Cerrado"}
                </span>
                <DaySwitch on={open} label={`Abre el ${lower}`} onToggle={() => toggle(day)} disabled={disabled} />
              </span>
            </div>

            {open && (
              <div className="mt-3 space-y-3">
                {periods.map((p, i) => {
                  const turn = periods.length > 1 ? `, turno ${i + 1}` : "";
                  const describedBy = problem ? problemId : undefined;
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <input
                        type="time"
                        step={60}
                        required
                        disabled={disabled}
                        aria-label={`Abre el ${lower}${turn}`}
                        aria-invalid={problem ? true : undefined}
                        aria-describedby={describedBy}
                        value={p.open}
                        onChange={(e) => setPeriod(day, i, { open: e.target.value })}
                        className="mv-input mv-data min-w-0 flex-1 px-3 sm:max-w-[9rem]"
                      />
                      <span className="text-sm text-[var(--text-secondary)]" aria-hidden>
                        a
                      </span>
                      <input
                        type="time"
                        step={60}
                        required
                        disabled={disabled}
                        aria-label={`Cierra el ${lower}${turn}`}
                        aria-invalid={problem ? true : undefined}
                        aria-describedby={describedBy}
                        value={p.close}
                        onChange={(e) => setPeriod(day, i, { close: e.target.value })}
                        className="mv-input mv-data min-w-0 flex-1 px-3 sm:max-w-[9rem]"
                      />
                      {periods.length > 1 && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setDay(day, periods.filter((_, j) => j !== i))}
                          aria-label={`Quitar el turno ${i + 1} del ${lower}`}
                          className="mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      {p.open === "00:00" && p.close === "00:00" ? (
                        <p className="w-full text-xs text-[var(--text-secondary)]">Abierto las 24 horas.</p>
                      ) : crossesMidnight(p) ? (
                        <p className="w-full text-xs text-[var(--text-secondary)]">Cierra el día siguiente.</p>
                      ) : null}
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-x-5">
                  {periods.length < MAX_PERIODS && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setDay(day, [...periods, { open: "", close: "" }])}
                      className={linkButton}
                    >
                      <Plus className="h-4 w-4" aria-hidden /> Agregar turno<span className="sr-only"> el {lower}</span>
                    </button>
                  )}
                  <button type="button" disabled={disabled} onClick={() => copyToAll(day)} className={linkButton}>
                    <Copy className="h-4 w-4" aria-hidden /> Copiar a todos los días<span className="sr-only"> (horario del {lower})</span>
                  </button>
                </div>
              </div>
            )}

            {problem && (
              <p id={problemId} className="mt-2 text-sm font-medium text-red-500 [.light_&]:text-red-700">
                {problem}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
// creado por pato dev y askforvini
