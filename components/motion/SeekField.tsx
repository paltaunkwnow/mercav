"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

export function SeekField({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Buscar",
  shut = 40,
  openWidth = 280,
  defaultOpen = false,
  anchor = "center",
  className = "",
  persistent = false,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  shut?: number;
  openWidth?: number;
  defaultOpen?: boolean;
  anchor?: "center" | "end";
  className?: string;
  persistent?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLFormElement>(null);
  const [internal, setInternal] = useState(value ?? "");
  const [open, setOpen] = useState(defaultOpen);
  const width = useMotionValue(defaultOpen ? openWidth : shut);
  const scale = useMotionValue(1);
  const fieldOpacity = useTransform(width, [shut, shut + 36], [0, 1]);
  const lens = Math.round(shut * 0.44);
  const inset = (shut - lens) / 2;
  const text = value ?? internal;
  const targetWidth = () => Math.min(openWidth, Math.max(shut + 80, (typeof window === "undefined" ? openWidth : window.innerWidth) - 48));

  useEffect(() => {
    if (defaultOpen) width.set(targetWidth());
  }, [defaultOpen, openWidth]);

  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (persistent) return;
      if (!rootRef.current?.contains(event.target as Node) && !text.trim()) close();
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, text]);

  function setText(next: string) {
    setInternal(next);
    onValueChange?.(next);
  }

  function openField() {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    animate(scale, 0.93, {
      duration: 0.08,
      onComplete: () => animate(scale, 1, { type: "spring", stiffness: 520, damping: 28 }),
    });
    animate(width, targetWidth(), { type: "spring", stiffness: 340, damping: 30 });
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function close() {
    setOpen(false);
    animate(width, shut, { type: "spring", stiffness: 380, damping: 32 });
  }

  return (
    <motion.form
      ref={rootRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (!open) {
          openField();
          return;
        }
        if (text.trim()) onSubmit(text.trim());
      }}
      style={{ width, scale, height: shut }}
      className={`relative overflow-hidden rounded-full ${anchor === "end" ? "ml-auto origin-right" : "origin-center"} ${className}`}
    >
      <div className="liquid-glass liquid-glass-clear relative h-full overflow-hidden rounded-full">
        <svg
          viewBox="0 0 18 18"
          aria-hidden
          className="pointer-events-none absolute text-[var(--text-primary)]/70"
          style={{ left: inset, top: "50%", width: lens, height: lens, marginTop: -lens / 2 }}
        >
          <circle cx="7.6" cy="7.6" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M11.6 11.6 L15.4 15.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <motion.input
          ref={inputRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{ opacity: fieldOpacity, left: inset + lens + 10 }}
          className="absolute inset-y-0 right-3 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              if (!text) close();
              else setText("");
            }
          }}
          tabIndex={open ? 0 : -1}
        />
        <button
          type="button"
          aria-label="Abrir búsqueda"
          className="absolute inset-0 rounded-[inherit]"
          style={{ pointerEvents: open ? "none" : "auto" }}
          onClick={openField}
        />
      </div>
    </motion.form>
  );
}
