import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldCheck, Target } from "@/components/icons";

/**
 * Compact page header for every section inside the Pwn shell.
 * The shell already clears the floating header, so this one carries no top padding.
 * Sin kicker: el título va solo (mv-kicker queda para etiquetas dentro de una tarjeta).
 */
export function PwnPageHeader({
  title,
  lead,
  actions,
  children,
  id,
}: {
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <header className="flex flex-col gap-6 pt-2 md:flex-row md:items-end md:justify-between md:gap-10">
      <div className="flex min-w-0 max-w-3xl flex-col gap-3">
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
  title,
  lead,
  action,
  className,
  tabIndex,
}: {
  id?: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** -1 para poder mover el foco al encabezado (por ejemplo, al llegar resultados). */
  tabIndex?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 id={id} tabIndex={tabIndex} className="mv-h3 text-[clamp(1.35rem,1.15rem+0.8vw,1.85rem)] outline-none">
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
        "rounded-[0.875rem] border px-4 py-3 text-sm",
        tone === "ok" && "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]",
        tone === "error" &&
          "border-[color-mix(in_srgb,var(--p-alert)_45%,transparent)] bg-[var(--p-alert-wash)] text-[var(--text-primary)]",
        tone === "neutral" && "border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
      )}
    >
      {children}
    </p>
  );
}

/** Field-level error text, kept consistent across Pwn forms. */
export const pwnErrorTextClass = "text-sm text-[var(--p-alert)]";

export type VerdictTone = "clean" | "exposed" | "idle";

/**
 * El veredicto en una línea, como la pantalla de Pwn del celular de la portada:
 * verde cuando está limpio, magenta cuando hay exposición, neutro si todavía no hay nada que mirar.
 */
export function VerdictTile({
  tone,
  title,
  detail,
  action,
  id,
}: {
  tone: VerdictTone;
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  const Icon = tone === "clean" ? ShieldCheck : tone === "exposed" ? AlertTriangle : Target;
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col gap-3 rounded-[1.25rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        tone === "clean" && "bg-gold text-[var(--mv-on-gold)]",
        tone === "exposed" && "bg-[var(--p-alert)] text-[var(--mv-on-gold)]",
        tone === "idle" && "mv-panel text-[var(--text-primary)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug tracking-[-0.01em]">{title}</p>
          {detail ? (
            <p className={cn("mt-0.5 text-sm", tone === "idle" ? "text-[var(--text-secondary)]" : "opacity-90")}>{detail}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
// creado por pato dev y askforvini
