"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Inbox, LogIn, PlugZap, RotateCw } from "lucide-react";
import { buttonClass } from "@/components/site/primitives";

function StateIcon({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "error" }) {
  const toneClass =
    tone === "gold"
      ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold"
      : tone === "error"
        ? "border-red-400/30 bg-red-500/[0.06] text-red-300 [.light_&]:text-red-700"
        : "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] text-[var(--text-secondary)]";
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${toneClass}`}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div role="status" className="mv-panel flex flex-col items-center rounded-[1.75rem] px-6 py-12 text-center md:py-14">
      <StateIcon>{icon ?? <Inbox className="h-5 w-5" aria-hidden />}</StateIcon>
      <h2 className="mv-h3 mt-5">{title}</h2>
      {description ? <p className="mv-body mx-auto mt-2 max-w-md">{description}</p> : null}
      {action ? <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Cargando datos…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
        {label}
      </p>
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="mv-panel rounded-[1.5rem] p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--mv-panel-hover)] motion-reduce:animate-none" />
            <div className="mt-4 h-4 w-3/4 animate-pulse rounded-full bg-[var(--mv-panel-hover)] motion-reduce:animate-none" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-[var(--mv-panel-hover)] motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mv-panel flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-start md:p-6">
      <StateIcon tone="error">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </StateIcon>
      <div className="min-w-0 flex-1">
        <h2 className="mv-h3 text-lg">No se pudieron cargar los datos</h2>
        <p className="mv-body mt-1">{message}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className={buttonClass("secondary", "sm", "mt-4 w-full sm:w-auto")}>
            <RotateCw className="h-4 w-4" aria-hidden />
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function DisabledState({
  title = "Función no configurada",
  description = "Mercav Pwn no tiene esta integración activa en este entorno.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div role="status" className="mv-panel flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-start md:p-6">
      <StateIcon>
        <PlugZap className="h-5 w-5" aria-hidden />
      </StateIcon>
      <div className="min-w-0">
        <h2 className="mv-h3 text-lg">{title}</h2>
        <p className="mv-body mt-1">{description}</p>
      </div>
    </div>
  );
}

export function UnauthorizedState({ callbackPath, description }: { callbackPath: string; description?: string }) {
  const href = `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
  return (
    <div role="status" className="liquid-glass-clear relative overflow-hidden rounded-[1.75rem] border border-[var(--lg-stroke)] p-6 md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <StateIcon tone="gold">
            <LogIn className="h-5 w-5" aria-hidden />
          </StateIcon>
          <div className="min-w-0">
            <h2 className="mv-h3">Iniciá sesión para continuar</h2>
            <p className="mv-body mt-1 max-w-lg">{description ?? "Esta sección usa los objetivos y las alertas de tu cuenta."}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
          <Link href={href} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
            Iniciar sesión
          </Link>
          <Link href="/register" className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
