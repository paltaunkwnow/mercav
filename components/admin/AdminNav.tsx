"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_GROUPS, ADMIN_TABS } from "./tabs";

const href = (id: string) => `/admin/dashboard?tab=${id}`;

/** Desktop rail. Plain links with aria-current, so Tab / Enter / middle-click all work. */
export function AdminSidebarNav({ active }: { active: string }) {
  return (
    <nav aria-label="Secciones de la consola" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6">
      {ADMIN_GROUPS.map((group) => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold text-[var(--text-tertiary)]">{group}</p>
          <ul className="flex flex-col gap-0.5">
            {ADMIN_TABS.filter((tab) => tab.group === group).map(({ id, label, icon: Icon }) => {
              const current = id === active;
              return (
                <li key={id}>
                  <Link
                    href={href(id)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "mv-focus group relative flex h-10 items-center gap-3 rounded-[0.875rem] px-3 text-sm font-medium transition-colors duration-150",
                      current
                        ? "bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    {current ? <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gold" /> : null}
                    <Icon aria-hidden className={cn("h-4 w-4 shrink-0", current ? "text-gold" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]")} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Mobile / tablet: horizontal tab strip inside the floating bar. The active tab is scrolled into view. */
export function AdminMobileNav({ active }: { active: string }) {
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // Center the active tab in the strip without scrolling the page.
    const el = activeRef.current;
    const list = el?.closest("ul");
    if (!el || !list) return;
    const a = el.getBoundingClientRect();
    const b = list.getBoundingClientRect();
    list.scrollLeft += a.left - b.left - (b.width - a.width) / 2;
  }, [active]);

  return (
    <nav aria-label="Secciones de la consola" className="lg:hidden">
      <ul className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => {
          const current = id === active;
          return (
            <li key={id} className="shrink-0">
              <Link
                ref={current ? activeRef : undefined}
                href={href(id)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "mv-focus flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                  current
                    ? "bg-gold text-[var(--mv-on-gold)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BackToSite({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "mv-focus inline-flex h-10 items-center gap-2 rounded-full text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]",
        compact ? "w-10 justify-center" : "px-3",
      )}
      aria-label={compact ? "Volver al sitio" : undefined}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {compact ? null : "Volver al sitio"}
    </Link>
  );
}
// Sistema Mercav Admin - creado por pato dev y askforvini
