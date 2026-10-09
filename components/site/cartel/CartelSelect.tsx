"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export type CartelOption = { value: string; label: string };

/**
 * Selector del cartel: reemplaza al <select> nativo (que cada navegador pinta a su manera y en Safari deja el
 * texto oscuro sobre fondo oscuro). Botón + lista con teclado completo: flechas, Inicio/Fin, Enter, Escape y
 * búsqueda por letra. La lista nace del botón con un resorte sin rebote. El color de acento sale de --select-ink.
 */
export function CartelSelect({
  value,
  options,
  onChange,
  label,
  icon,
  className,
}: {
  value: string;
  options: CartelOption[];
  onChange: (value: string) => void;
  /** Nombre accesible del control. */
  label: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    requestAnimationFrame(() => list.current?.focus());
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open, options, value]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(i: number) {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    button.current?.focus();
  }

  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(options.length - 1);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
      return;
    } else if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const i = options.findIndex((o, j) => j > active && o.label.toLowerCase().startsWith(k));
      const j = i >= 0 ? i : options.findIndex((o) => o.label.toLowerCase().startsWith(k));
      if (j >= 0) setActive(j);
      return;
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${current?.label ?? ""}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "group inline-flex min-h-[2.5rem] items-center gap-2 rounded-full py-1.5 pl-3 pr-2.5 text-[0.95rem] font-semibold text-[var(--c-text)] transition-[box-shadow,background-color] duration-150",
          "bg-[color-mix(in_srgb,var(--select-ink,var(--c-yellow))_14%,transparent)] shadow-[inset_0_0_0_1.5px_var(--select-ink,var(--c-yellow))]",
          "hover:bg-[color-mix(in_srgb,var(--select-ink,var(--c-yellow))_24%,transparent)]",
        )}
      >
        {icon ? <span className="text-[var(--select-ink,var(--c-yellow))]">{icon}</span> : null}
        <span>{current?.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--select-ink,var(--c-yellow))] transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-opt-${active}`}
            onKeyDown={onListKey}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4, filter: "blur(3px)" }}
            transition={reduce ? { duration: 0.12 } : { type: "spring", bounce: 0, duration: 0.3 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 min-w-[13rem] overflow-y-auto rounded-[1.1rem] bg-[#0b0a09] p-1.5 text-[#fffdf8] shadow-[0_0_0_1px_rgba(255,253,248,0.12),0_24px_48px_-18px_rgba(0,0,0,0.75)] outline-none [scrollbar-width:thin]"
          >
            {options.map((o, i) => {
              const selected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-[0.75rem] px-3 py-2 text-[0.95rem] transition-colors duration-100",
                    i === active && "bg-[rgba(255,253,248,0.08)]",
                    selected && "font-semibold text-[var(--select-ink,var(--c-yellow))]",
                  )}
                >
                  {o.label}
                  {selected ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
// creado por pato dev y askforvini
