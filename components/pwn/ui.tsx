import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact page header for every section inside the Pwn shell.
 * The shell already clears the floating header, so this one carries no top padding.
 */
export function PwnPageHeader({
  kicker,
  title,
  lead,
  actions,
  children,
  id,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <header className="flex flex-col gap-6 pt-2 md:flex-row md:items-end md:justify-between md:gap-10">
      <div className="flex min-w-0 max-w-3xl flex-col gap-3">
        {kicker ? <p className="mv-kicker">{kicker}</p> : null}
        <h1 id={id} className="font-display text-[clamp(2rem,1.55rem+1.9vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--text-primary)] [text-wrap:balance]">
          {title}
        </h1>
        {lead ? <p className="mv-body max-w-2xl text-base">{lead}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{actions}</div> : null}
    </header>
  );
}

/** Heading for a block within a Pwn page (h2). */
export function PwnSectionHeading({
  id,
  kicker,
  title,
  lead,
  action,
  className,
}: {
  id?: string;
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {kicker ? <p className="mv-kicker">{kicker}</p> : null}
        <h2 id={id} className="mv-h3 text-[clamp(1.35rem,1.15rem+0.8vw,1.85rem)]">
          {title}
        </h2>
        {lead ? <p className="mv-body max-w-2xl">{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Label/value facts for a result card. Stacks on phones, grids from `sm`. */
export function MetaGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "mt-5 grid gap-x-6 gap-y-4 border-t border-[var(--mv-hairline)] pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function Meta({ label, children, mono, className }: { label: ReactNode; children: ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-[var(--text-tertiary)]">{label}</dt>
      <dd className={cn("mt-1 break-words text-[var(--text-primary)]", mono && "mv-data")}>{children}</dd>
    </div>
  );
}

/** Inline status message under a form or list (success or neutral). */
export function PwnNotice({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "error" | "neutral" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "ok" && "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]",
        tone === "error" && "border-red-400/30 bg-red-500/[0.06] text-red-200 [.light_&]:text-red-800",
        tone === "neutral" && "border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
      )}
    >
      {children}
    </p>
  );
}

/** Field-level error text, kept consistent across Pwn forms. */
export const pwnErrorTextClass = "text-sm text-red-300 [.light_&]:text-red-700";
// creado por pato dev y askforvini
