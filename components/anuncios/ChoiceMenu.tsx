"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Choice = string | { value: string; label: string };

/**
 * Single-choice popover (country, city, sort…). Owns only its open state;
 * the selected value lives in the caller. Keyboard: arrows move, Esc closes.
 */
export function ChoiceMenu({
  label,
  hideLabel,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder = "Elegí una opción",
  allLabel,
  disabled,
  disabledText,
  variant = "field",
  className,
}: {
  label: string;
  hideLabel?: boolean;
  icon?: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  placeholder?: string;
  /** Adds a first option with value "" (for "Todos los países"…). */
  allLabel?: string;
  disabled?: boolean;
  disabledText?: string;
  /** field = bordered input look; bare = for use inside a toolbar/glass bar. */
  variant?: "field" | "bare";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean }>({ top: 0, left: 0, width: 0, up: false });

  // The list is portalled to <body> with position: fixed so it never nests inside a glass bar.
  const place = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 300 && r.top > below;
    const width = Math.max(r.width, 224);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ top: up ? r.top - 8 : r.bottom + 8, left, width, up });
  };
  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  const items = [
    ...(allLabel !== undefined ? [{ value: "", label: allLabel }] : []),
    ...options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
  ];
  const current = items.find((o) => o.value === value);
  const shown = disabled && disabledText ? disabledText : current?.label || placeholder;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (root.current?.contains(t) || list.current?.contains(t)) return;
      setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    // Focus the selected option (or the first) when opening.
    const btns = list.current?.querySelectorAll<HTMLButtonElement>("button[data-opt]");
    const sel = list.current?.querySelector<HTMLButtonElement>('button[aria-selected="true"]');
    (sel ?? btns?.[0])?.focus({ preventScroll: false });
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    trigger.current?.focus();
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const btns = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button[data-opt]") ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      btns[Math.min(btns.length - 1, i + 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      btns[Math.max(0, i - 1)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      btns[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      btns[btns.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className={cn("relative min-w-0", className)}>
      <span id={`${id}-label`} className={hideLabel ? "sr-only" : "mb-2 block text-sm font-semibold text-[var(--text-primary)]"}>
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "mv-focus group flex h-12 w-full items-center gap-3 text-left text-[0.9375rem] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          variant === "field"
            ? "rounded-[0.875rem] border border-[var(--mv-hairline-strong)] bg-[color-mix(in_srgb,var(--color-bg-tertiary)_70%,transparent)] px-4 hover:border-[var(--color-border-gold)]"
            : "rounded-full px-4 hover:bg-[var(--mv-panel-hover)]",
          open && "border-[var(--color-border-gold)]",
        )}
      >
        {Icon ? <Icon className={cn("h-4 w-4 shrink-0 text-gold", variant === "bare" && "hidden sm:block")} aria-hidden /> : null}
        <span id={`${id}-value`} className={cn("min-w-0 flex-1 truncate", current && !disabled ?"text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
          {shown}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
        <ul
          ref={list}
          role="listbox"
          aria-labelledby={`${id}-label`}
          onKeyDown={onListKey}
          style={{
            left: pos.left,
            width: pos.width,
            ...(pos.up ? { bottom: window.innerHeight - pos.top, transformOrigin: "bottom center" } : { top: pos.top, transformOrigin: "top center" }),
          }}
          className="mv-pop mv-menu fixed z-[180] max-h-72 overflow-y-auto overscroll-contain rounded-2xl p-1.5 text-[var(--text-primary)]"
        >
          {items.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value || "__all"} role="presentation">
                <button
                  type="button"
                  data-opt
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(o.value)}
                  className={cn(
                    "flex min-h-[2.75rem] w-full items-center justify-between gap-3 rounded-xl px-3.5 text-left text-sm outline-none transition-colors duration-150",
                    selected
                      ? "bg-[var(--mv-gold-wash)] font-semibold text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] focus-visible:bg-[var(--mv-panel-hover)] focus-visible:text-[var(--text-primary)]",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
// creado por pato dev y askforvini
