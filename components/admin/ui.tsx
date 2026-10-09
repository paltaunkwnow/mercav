import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "@/components/icons";
import { forwardRef } from "react";
import { AlertCircle, Loader2 } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * Admin console primitives. Presentational only (no hooks), so they render from
 * server components and from client tabs alike. Built on the MERCAV SYSTEM classes.
 */

type Icon = LucideIcon;

export type Tone = "neutral" | "gold" | "success" | "danger" | "info";

const toneChip: Record<Tone, string> = {
  neutral: "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
  gold: "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold",
  success: "border-green-500/25 bg-green-500/10 text-green-400",
  danger: "border-red-500/25 bg-red-500/10 text-red-400",
  info: "border-blue-500/25 bg-blue-500/10 text-blue-400",
};

export const fmt = {
  date: (v: string | Date | null | undefined) =>
    v ? new Date(v).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  dateTime: (v: string | Date | null | undefined) =>
    v
      ? new Date(v).toLocaleString("es-BO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—",
  money: (v: number | string | null | undefined, currency = "USD") =>
    `$${Number(v || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`,
  number: (v: number) => v.toLocaleString("es-BO"),
};

/** Section surface inside the console. Plain panel, never glass. */
export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  as?: "section" | "div";
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <Tag aria-labelledby={title ? headingId : undefined} className={cn("mv-panel overflow-hidden rounded-[1.5rem]", className)}>
      {title || actions ? (
        <div className="flex flex-col gap-3 border-b border-[var(--mv-hairline)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="min-w-0">
            {title ? (
              <h2 id={headingId} className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName ?? "p-5 md:p-6"}>{children}</div>
    </Tag>
  );
}

/** Real figure from the database. `value` should already be formatted. */
export function Metric({
  label,
  value,
  hint,
  icon: IconCmp,
  tone = "neutral",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: Icon;
  tone?: "neutral" | "gold" | "danger";
}) {
  return (
    <div className="mv-panel flex min-w-0 flex-col gap-3 rounded-[1.25rem] p-5">
      <dt className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <span className="truncate">{label}</span>
        {IconCmp ? (
          <IconCmp
            aria-hidden
            className={cn("h-4 w-4 shrink-0", tone === "gold" ? "text-gold" : tone === "danger" ? "text-red-400" : "text-[var(--text-tertiary)]")}
          />
        ) : null}
      </dt>
      <dd className="flex flex-col gap-1">
        <span className="mv-data truncate text-2xl font-medium tracking-tight text-[var(--text-primary)] md:text-[1.75rem]">{value}</span>
        {hint ? <span className="text-xs text-[var(--text-tertiary)]">{hint}</span> : null}
      </dd>
    </div>
  );
}

export function StatusBadge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold",
        toneChip[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ icon: IconCmp, title, description, action }: { icon?: Icon; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-12 text-center">
      {IconCmp ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mv-panel-hover)] text-[var(--text-tertiary)]">
          <IconCmp className="h-5 w-5" aria-hidden />
        </span>
      ) : null}
      <p className="font-semibold text-[var(--text-primary)]">{title}</p>
      {description ? <p className="max-w-sm text-sm text-[var(--text-secondary)]">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Cargando…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-3 py-14 text-sm text-[var(--text-secondary)]", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
      {label}
    </div>
  );
}

export function InlineAlert({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-[0.875rem] border px-4 py-3 text-sm",
        tone === "danger" && "border-red-500/25 bg-red-500/10 text-red-400",
        tone === "success" && "border-green-500/25 bg-green-500/10 text-green-400",
        tone === "info" && "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

const iconTone = {
  neutral: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--mv-panel-hover)] border-[var(--mv-hairline-strong)]",
  success: "text-green-400 hover:bg-green-500/10 border-green-500/25",
  danger: "text-red-400 hover:bg-red-500/10 border-red-500/25",
  gold: "text-gold hover:bg-[var(--mv-gold-wash)] border-[var(--color-border-gold)]",
  info: "text-blue-400 hover:bg-blue-500/10 border-blue-500/25",
} as const;

/** Square icon action. `label` is required: it becomes aria-label and tooltip. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: keyof typeof iconTone; loading?: boolean; icon: Icon }
>(function IconButton({ label, tone = "neutral", loading, icon: IconCmp, className, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn(
        "mv-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-transparent transition-[background-color,color,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        iconTone[tone],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <IconCmp className="h-4 w-4" aria-hidden />}
    </button>
  );
});

/** Small text action for dense rows, with tone. */
export function RowButton({
  tone = "neutral",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof iconTone }) {
  return (
    <button
      type="button"
      className={cn(
        "mv-focus inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        iconTone[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: ReactNode; htmlFor: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-[var(--text-tertiary)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Avatar({ name, src, size = "md" }: { name?: string | null; src?: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)] font-semibold text-[var(--text-secondary)]",
        dim,
      )}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : (name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

/* Dense data tables: the wrapper scrolls, the header sticks to it. */
export const table = {
  wrap: "relative max-h-[70vh] overflow-auto overscroll-contain",
  table: "w-full border-separate border-spacing-0 text-left text-sm [&_tbody_tr:last-child_td]:border-b-0",
  th: "sticky top-0 z-[1] whitespace-nowrap border-b border-[var(--mv-hairline-strong)] bg-bg-secondary px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] first:pl-5 last:pr-5",
  td: "border-b border-[var(--mv-hairline)] px-4 py-3 align-top text-[var(--text-secondary)] first:pl-5 last:pr-5",
  tr: "transition-colors duration-150 hover:bg-[var(--mv-panel-hover)]",
};

/** Mobile card list item used where tables collapse below md. */
export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={cn("flex flex-col gap-3 border-b border-[var(--mv-hairline)] px-5 py-4 last:border-b-0", className)}>{children}</li>;
}

export function KeyValue({ label, children, mono }: { label: ReactNode; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-[var(--text-tertiary)]">{label}</dt>
      <dd className={cn("min-w-0 truncate text-right text-[var(--text-primary)]", mono && "mv-data text-[0.8125rem]")}>{children}</dd>
    </div>
  );
}
// creado por pato dev y askforvini
