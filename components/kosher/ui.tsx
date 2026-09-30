import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-xl border border-border bg-bg-tertiary px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] hover:border-gold/30 focus:border-gold/50 focus:ring-2 focus:ring-gold/15";

export const cardClass = "rounded-[1.75rem] border border-border bg-bg-secondary p-6";

export const primaryButton =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gold px-5 text-sm font-semibold text-black transition-opacity disabled:opacity-40";

export const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border px-5 text-sm font-semibold text-[var(--text-primary)] hover:border-gold/50 disabled:opacity-40";

export function PageIntro({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-techelet">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">{title}</h1>
        {children && <div className="mt-3 text-[var(--text-secondary)]">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** City switcher as plain links, so it works in server pages and keeps the choice in the URL. */
export function CityPills({ cities, current, basePath, extra = "" }: { cities: { slug: string; city: string }[]; current: string; basePath: string; extra?: string }) {
  return (
    <nav aria-label="Ciudad" className="-mx-4 mb-8 px-4 md:mx-0 md:px-0">
      <ul className="scrollbar-hide flex gap-2 overflow-x-auto">
        {cities.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`${basePath}?ciudad=${c.slug}${extra}`}
              aria-current={c.slug === current ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
                c.slug === current ? "bg-gold text-black" : "border border-border text-[var(--text-secondary)] hover:border-gold/40 hover:text-[var(--text-primary)]",
              )}
            >
              {c.city}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BackLink({ href = "/kosher/comunidad", children = "Comunidad" }: { href?: string; children?: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex h-9 items-center rounded-full text-sm font-medium text-techelet hover:underline">
      ← {children}
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-[1.75rem] border border-dashed border-border px-6 py-12 text-center text-sm text-[var(--text-secondary)]">{children}</p>;
}

export function SignInCard({ callbackUrl, children }: { callbackUrl: string; children: ReactNode }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-[var(--text-secondary)]">{children}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className={primaryButton}>
          Iniciar sesión
        </Link>
        <Link href="/register" className={secondaryButton}>
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "gold" | "techelet" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold",
        tone === "gold" && "bg-gold/12 text-gold ring-1 ring-inset ring-gold/30",
        tone === "techelet" && "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/30",
        tone === "warn" && "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30",
        tone === "muted" && "bg-bg-tertiary text-[var(--text-secondary)]",
      )}
    >
      {children}
    </span>
  );
}
