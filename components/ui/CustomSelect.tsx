"use client";

import { useState, useRef, useEffect, useId, type KeyboardEvent } from "react";
import { ChevronDown, Check } from "@/components/icons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Seleccionar", label, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    requestAnimationFrame(() => listRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlight, isOpen]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(highlight);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setIsOpen(false);
      if (e.key === "Escape") buttonRef.current?.focus();
    }
  }

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <span id={labelId} className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </span>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-labelledby={label ? `${labelId} ${id}-value` : undefined}
          onClick={() => setIsOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          className={`mv-input flex items-center justify-between gap-3 text-left ${isOpen ? "border-[var(--color-border-gold)]" : ""}`}
        >
          <span id={`${id}-value`} className={`min-w-0 truncate text-[15px] ${selectedOption ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-gold" : "text-[var(--text-tertiary)]"}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: "top center" }}
              className="mv-menu absolute left-0 right-0 z-[500] mt-2 overflow-hidden rounded-[1.25rem] p-1.5"
            >
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                tabIndex={-1}
                aria-labelledby={label ? labelId : undefined}
                aria-activedescendant={`${id}-opt-${highlight}`}
                onKeyDown={onListKey}
                className="scrollbar-hide max-h-64 overflow-y-auto outline-none"
              >
                {options.map((option, index) => {
                  const selected = value === option.value;
                  const active = index === highlight;
                  return (
                    <li
                      key={option.value}
                      id={`${id}-opt-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => choose(index)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-[15px] transition-colors duration-150 ${
                        selected ? "font-semibold text-gold" : "text-[var(--text-primary)]"
                      } ${active ? "bg-[var(--mv-panel-hover)]" : ""}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {selected && <Check aria-hidden className="h-4 w-4 shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
