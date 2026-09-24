"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { focusRing, pwnFieldClassLg, pwnFormLabelClass } from "@/components/pwn/format";

export function SearchForm({
  id,
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  type = "search",
  hint,
  error,
  disabled,
  autoComplete,
  name,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitLabel: string;
  type?: "text" | "email" | "password" | "search";
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  autoComplete?: string;
  name?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      autoComplete={type === "password" ? "off" : undefined}
      className="space-y-3"
    >
      <label htmlFor={id} className={pwnFormLabelClass}>
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete ?? (type === "password" ? "new-password" : "off")}
          autoCapitalize={type === "password" ? "off" : undefined}
          autoCorrect={type === "password" ? "off" : undefined}
          spellCheck={type === "password" ? false : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={pwnFieldClassLg}
        />
        <Button
          type="submit"
          disabled={disabled}
          className={`h-12 shrink-0 rounded-xl bg-gold px-6 font-semibold text-black hover:bg-gold-light ${focusRing}`}
        >
          {submitLabel}
        </Button>
      </div>
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-gray-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className={pwnFormLabelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
