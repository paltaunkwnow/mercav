"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Visible label + mv-input. `hint` and `trailing` are optional; `labelAction` sits to the right of the label. */
export function AuthField({
  id,
  label,
  hint,
  labelAction,
  trailing,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: ReactNode;
  labelAction?: ReactNode;
  trailing?: ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          {...input}
          id={id}
          aria-describedby={cn(hintId, input["aria-describedby"]) || undefined}
          className={cn("mv-input", trailing ? "pr-12" : undefined, className)}
        />
        {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
      </div>
      {hint ? (
        <div id={hintId} className="mt-2 text-xs text-[var(--text-secondary)]">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/** Password input with an accessible show/hide toggle. */
export function PasswordField({
  id,
  label = "Contraseña",
  labelAction,
  hint,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label?: string;
  labelAction?: ReactNode;
  hint?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthField
      id={id}
      label={label}
      labelAction={labelAction}
      hint={hint}
      type={visible ? "text" : "password"}
      spellCheck={false}
      autoCapitalize="none"
      {...input}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          aria-controls={id}
          className="mv-focus grid h-10 w-10 place-items-center rounded-[0.7rem] text-[var(--text-tertiary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      }
    />
  );
}

/** Inline status message. Errors are announced (role="alert"); success uses role="status". */
export function FormAlert({ tone = "error", children, id }: { tone?: "error" | "success"; children: ReactNode; id?: string }) {
  const error = tone === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div
      id={id}
      role={error ? "alert" : "status"}
      className={cn(
        "mv-fade flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-relaxed",
        error ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-green-500/30 bg-green-500/10 text-green-400",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

/** Primary submit with a stable width while loading. */
export function SubmitButton({
  loading,
  loadingLabel,
  children,
  disabled,
}: {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button type="submit" disabled={loading || disabled} aria-busy={loading} className="mv-btn mv-btn-primary mv-btn-lg w-full">
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-[var(--mv-hairline-strong)]" />
      <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      <span className="h-px flex-1 bg-[var(--mv-hairline-strong)]" />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
// creado por pato dev y askforvini
