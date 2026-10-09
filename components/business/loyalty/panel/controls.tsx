"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Campo numérico que deja escribir libre y recién confirma valores dentro del rango. */
export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  className,
  describedBy,
  label,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  className?: string;
  describedBy?: string;
  /** Si no hay <label> visible. */
  label?: string;
}) {
  const [text, setText] = useState(String(value));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(String(value));
    }
  }, [value]);

  const parse = (raw: string) => {
    if (raw.trim() === "") return null;
    const n = Math.round(Number(raw));
    return Number.isFinite(n) ? n : null;
  };

  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={text}
      disabled={disabled}
      aria-label={label}
      aria-describedby={describedBy}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = parse(e.target.value);
        if (n !== null && n >= min && n <= max) {
          last.current = n;
          onChange(n);
        }
      }}
      onBlur={() => {
        const n = parse(text);
        const clamped = n === null ? value : Math.min(max, Math.max(min, n));
        setText(String(clamped));
        if (clamped !== value) {
          last.current = clamped;
          onChange(clamped);
        }
      }}
      className={cn("mv-input h-11 tabular-nums disabled:opacity-60", className)}
    />
  );
}

/** Interruptor accesible (role="switch"). */
export function Switch({
  id,
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", disabled && "opacity-60")}>
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs leading-snug text-[var(--text-secondary)]">{hint}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "mv-focus relative h-7 w-12 shrink-0 rounded-full border transition-colors motion-reduce:transition-none",
          checked ? "border-transparent bg-gold" : "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

/** Opciones excluyentes en píldoras (radios nativos: flechas del teclado incluidas). */
export function Segmented<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  disabled,
  hint,
}: {
  name: string;
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  hint?: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">{legend}</legend>
      <div className={cn("inline-flex w-fit flex-wrap gap-1 rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-1", disabled && "opacity-60")}>
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className="inline-flex h-9 cursor-pointer items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] peer-checked:bg-gold peer-checked:text-[var(--mv-on-gold)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg-primary)] motion-reduce:transition-none">
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="text-xs leading-snug text-[var(--text-secondary)]">{hint}</p> : null}
    </fieldset>
  );
}

/** Clase de una tarjeta de opción (radio o checkbox con `peer sr-only` justo antes). */
export const optionCard =
  "flex h-full cursor-pointer rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] transition-colors hover:bg-[var(--mv-panel-hover)] peer-checked:border-[var(--color-border-gold)] peer-checked:bg-[var(--mv-gold-wash)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50 motion-reduce:transition-none";

/** Bloque con título dentro de un formulario. */
export function Section({ title, description, children, className, id }: { title: string; description?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("mv-panel flex scroll-mt-28 flex-col gap-5 p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-1">
        <h2 id={id ? `${id}-title` : undefined} className="font-display text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {description ? <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Contador de caracteres para campos con tope. */
export function CharCount({ value, max, id }: { value: string; max: number; id?: string }) {
  const left = max - value.length;
  return (
    <span id={id} className={cn("text-xs tabular-nums", left < 0 ? "text-red-500" : left <= 10 ? "text-amber-500" : "text-[var(--text-tertiary)]")}>
      {value.length}/{max}
    </span>
  );
}

/** Copia texto al portapapeles (con alternativa para navegadores viejos). */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const done = document.execCommand("copy");
      area.remove();
      return done;
    } catch {
      return false;
    }
  }
}
// creado por pato dev y askforvini
