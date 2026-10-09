"use client";

import { useId, type ReactNode } from "react";
import { Plus } from "@/components/icons";
import { cn } from "@/lib/utils";

/** One accessible disclosure row. Parent owns the open state. */
export function FaqItem({
  question,
  answer,
  open,
  onToggle,
  headingLevel = "h3",
}: {
  question: ReactNode;
  answer: ReactNode;
  open: boolean;
  onToggle: () => void;
  headingLevel?: "h2" | "h3";
}) {
  const id = useId();
  const btnId = `${id}-q`;
  const panelId = `${id}-a`;
  const Heading = headingLevel;
  const collapsedProps = open ? {} : ({ inert: "" } as Record<string, string>);

  return (
    <li className={cn("rounded-[1.25rem] border transition-colors duration-200", open ? "border-[var(--color-border-gold)] bg-[var(--mv-panel)]" : "border-[var(--mv-hairline)] hover:border-[var(--mv-hairline-strong)]")}>
      <Heading className="m-0">
        <button
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="mv-focus flex min-h-14 w-full items-start justify-between gap-4 rounded-[1.25rem] px-5 py-4 text-left md:px-6"
        >
          <span className="pt-0.5 text-[1rem] font-semibold leading-snug text-[var(--text-primary)]">{question}</span>
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-[transform,border-color,color] duration-200 [transition-timing-function:var(--ease-out)]",
              open ? "rotate-45 border-[var(--color-border-gold)] text-gold" : "border-[var(--mv-hairline-strong)] text-[var(--text-tertiary)]",
            )}
          >
            <Plus className="h-4 w-4" />
          </span>
        </button>
      </Heading>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        aria-hidden={!open}
        {...collapsedProps}
        className={cn("grid transition-[grid-template-rows] duration-[250ms] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="overflow-hidden">
          <p className="max-w-[68ch] px-5 pb-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] md:px-6">{answer}</p>
        </div>
      </div>
    </li>
  );
}

/** Search box shared by both FAQ pages. */
export function FaqSearch({
  value,
  onChange,
  placeholder,
  resultCount,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  resultCount?: number;
}) {
  const id = useId();
  return (
    <div role="search" className="w-full">
      <label htmlFor={id} className="sr-only">
        Buscar en las preguntas frecuentes
      </label>
      <div className="relative">
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={id}
          type="search"
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mv-input h-14 rounded-full pl-12 pr-5"
        />
      </div>
      <p className="mt-3 min-h-5 text-sm text-[var(--text-tertiary)]" aria-live="polite">
        {typeof resultCount === "number" && value.trim() ? (resultCount === 1 ? "1 resultado" : `${resultCount} resultados`) : ""}
      </p>
    </div>
  );
}
// creado por pato dev y askforvini
