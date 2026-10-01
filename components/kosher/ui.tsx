import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Inbox } from "lucide-react";
import { buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

/** Text input / select. Height comes from `mv-input` (48px); textareas add `h-auto`. */
export const fieldClass = "mv-input";

/** Standard surface for Kosher content blocks. */
export const cardClass = "mv-panel p-6 md:p-7";

export const primaryButton = buttonClass("primary", "sm");

export const secondaryButton = buttonClass("secondary", "sm");

/** Field label shared by every Kosher form. */
export const labelClass = "mb-2 block text-sm font-medium text-[var(--text-primary)]";

/** Interior page header: techelet kicker, one h1, lead and optional actions. */
export function PageIntro({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-3xl flex-col gap-4">
        {eyebrow && <p className="mv-kicker !text-techelet">{eyebrow}</p>}
        <h1 className="mv-h1">{title}</h1>
        {children && <div className="mv-lead">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>}
    </header>
  );
}

/** City switcher as plain links, so it works in server pages and keeps the choice in the URL. */
export function CityPills({ cities, current, basePath, extra = "" }: { cities: { slug: string; city: string }[]; current: string; basePath: string; extra?: string }) {
  return (
    <nav aria-label="Ciudad" className="-mx-4 mb-10 px-4 sm:mx-0 sm:px-0">
      <ul className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
        {cities.map((c) => {
          const active = c.slug === current;
          return (
            <li key={c.slug} className="shrink-0">
              <Link
                href={`${basePath}?ciudad=${c.slug}${extra}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mv-focus inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                  active
                    ? "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/40"
                    : "border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-techelet/40 hover:text-[var(--text-primary)]",
                )}
              >
                {c.city}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BackLink({ href = "/kosher/comunidad", children = "Comunidad" }: { href?: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="mv-focus -ml-2 mb-6 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}

export function EmptyState({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex flex-col items-center rounded-[1.5rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-techelet-dim text-techelet">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      {title && <p className="mv-h3 mt-5">{title}</p>}
      <div className={cn("mx-auto max-w-md text-sm leading-relaxed text-[var(--text-secondary)]", title ? "mt-2" : "mt-5")}>{children}</div>
    </div>
  );
}

export function SignInCard({ callbackUrl, children }: { callbackUrl: string; children: ReactNode }) {
  return (
    <div className={cardClass}>
      <p className="mv-h3">Entrá con tu cuenta Mercav</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
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
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
        tone === "gold" && "bg-[var(--mv-gold-wash)] text-gold ring-1 ring-inset ring-gold/30",
        tone === "techelet" && "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/30",
        tone === "warn" && "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30 [.light_&]:text-amber-700",
        tone === "muted" && "bg-[var(--mv-panel)] text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--mv-hairline-strong)]",
      )}
    >
      {children}
    </span>
  );
}
