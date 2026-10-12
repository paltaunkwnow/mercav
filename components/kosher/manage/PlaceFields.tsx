"use client";

import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { Check } from "@/components/icons";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { fieldClass, labelClass } from "@/components/kosher/ui";
import { KOSHER_SERVICES, STATUS, STATUS_HINT, priceLabel, type KosherServiceKey } from "@/lib/kosher/labels";
import { PRICE_HINT } from "@/components/kosher/manage/details";
import { cn } from "@/lib/utils";

const optional = <span className="font-normal text-[var(--text-tertiary)]"> · opcional</span>;

const chip =
  "inline-flex h-10 cursor-pointer select-none items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200 " +
  "border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)] " +
  "peer-checked:border-transparent peer-checked:bg-[var(--mv-gold-wash)] peer-checked:text-gold peer-checked:ring-1 peer-checked:ring-inset peer-checked:ring-[var(--color-border-gold)] " +
  "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

/**
 * Nivel de kashrut con su explicación debajo. `current` es el nivel que tiene hoy la ficha: si no está entre
 * las opciones (por ejemplo "Certificado"), se muestra igual pero no se puede volver a elegir.
 */
export function StatusSelect({
  id,
  type,
  value,
  options,
  current,
  onChange,
  disabled,
  note,
}: {
  id: string;
  type: KosherPlaceType;
  value: KosherStatus;
  options: readonly KosherStatus[];
  current?: KosherStatus;
  onChange: (status: KosherStatus) => void;
  disabled?: boolean;
  note?: React.ReactNode;
}) {
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        Nivel de kashrut
      </label>
      <select
        id={id}
        className={cn(fieldClass, "disabled:opacity-60")}
        value={value}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(e) => onChange(e.target.value as KosherStatus)}
      >
        {current && !options.includes(current) && (
          <option value={current} disabled>
            {STATUS[current]} (actual)
          </option>
        )}
        {options.map((s) => (
          <option key={s} value={s}>
            {STATUS[s]}
          </option>
        ))}
      </select>
      <div id={hintId} aria-live="polite" className="mt-3 flex flex-col items-start gap-2">
        <StatusBadge status={value} type={type} />
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{STATUS_HINT[value]}</p>
        {note && <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">{note}</p>}
      </div>
    </div>
  );
}

/** $ a $$$$, o sin dato. Radios nativos: flechas del teclado y lector de pantalla sin trabajo extra. */
export function PricePicker({ name, value, onChange, disabled }: { name: string; value: number | null; onChange: (level: number | null) => void; disabled?: boolean }) {
  const levels = [null, 1, 2, 3, 4] as const;
  return (
    <fieldset disabled={disabled}>
      <legend className={labelClass}>Precio{optional}</legend>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <label key={level ?? "none"}>
            <input type="radio" name={name} className="peer sr-only" checked={value === level} onChange={() => onChange(level)} />
            <span className={cn(chip, level && "mv-data min-w-[3.25rem] justify-center")}>
              {level ? priceLabel(level) : "Sin dato"}
              {level && <span className="sr-only"> · {PRICE_HINT[level]}</span>}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--text-secondary)]" aria-hidden>
        {value ? PRICE_HINT[value as 1 | 2 | 3 | 4] : "Para comparar con otros lugares de la ciudad."}
      </p>
    </fieldset>
  );
}

export function ServicesPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly KosherServiceKey[];
  value: readonly string[];
  onChange: (services: KosherServiceKey[]) => void;
  disabled?: boolean;
}) {
  const toggle = (key: KosherServiceKey) =>
    onChange(value.includes(key) ? options.filter((k) => k !== key && value.includes(k)) : options.filter((k) => k === key || value.includes(k)));
  return (
    <fieldset disabled={disabled}>
      <legend className={labelClass}>Servicios{optional}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => {
          const on = value.includes(key);
          return (
            <label key={key}>
              <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(key)} />
              <span className={chip}>
                {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                {KOSHER_SERVICES[key]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
// creado por pato dev y askforvini
