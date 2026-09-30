"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { MoonStar } from "lucide-react";
import { Toaster } from "sonner";
import { useKosherViewer } from "@/components/kosher/KosherViewer";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/kosher", label: "Inicio" },
  { href: "/kosher/mapa", label: "Mapa" },
  { href: "/kosher/calendario", label: "Calendario" },
  { href: "/kosher/comunidad", label: "Comunidad" },
  { href: "/kosher/viaje", label: "Viaje" },
  { href: "/kosher/chat", label: "Chat" },
  { href: "/kosher/perfil", label: "Mi perfil" },
];

export const kosherFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

export function KosherWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-display font-semibold tracking-tight text-[var(--text-primary)]">
        Mercav <span className="text-gold">Kosher</span>
      </span>
      <span lang="he" dir="rtl" className="font-display text-sm text-techelet">
        מקום
      </span>
    </span>
  );
}

export function KosherShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const viewer = useKosherViewer();
  const fullBleed = pathname === "/kosher/mapa";
  const items = viewer.isModerator ? [...NAV, { href: "/kosher/moderacion", label: "Moderación" }] : NAV;

  return (
    <div className={cn("relative w-full bg-bg-primary", fullBleed ? "h-[100dvh] overflow-hidden" : "min-h-screen pb-28")}>
      {!fullBleed && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
          <div className="absolute left-1/2 top-[-160px] h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-techelet/[0.07] blur-[120px]" />
          <div className="absolute left-[15%] top-[-60px] h-[260px] w-[420px] rounded-full bg-gold/[0.05] blur-[110px]" />
        </div>
      )}

      <div className={cn("relative z-10", fullBleed ? "h-full" : "pt-24 md:pt-28")}>
        <div className={cn(fullBleed ? "absolute inset-x-3 top-[5.25rem] z-20" : "container mx-auto px-4 md:px-6")}>
          <div className={cn("mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between", fullBleed && "hidden")}>
            <Link href="/kosher" className={cn("rounded-lg", kosherFocus)} aria-label="Mercav Kosher, inicio">
              <KosherWordmark className="text-lg" />
            </Link>
            <nav aria-label="Secciones de Mercav Kosher" className="-mx-4 w-[calc(100%+2rem)] px-4 md:mx-0 md:w-auto md:px-0">
              <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
                {items.map((item) => {
                  const active = item.href === "/kosher" ? pathname === "/kosher" : pathname?.startsWith(item.href);
                  return (
                    <li key={item.href} className="relative shrink-0">
                      {active && (
                        <motion.span
                          layoutId="kosher-subnav"
                          className="absolute inset-0 rounded-full bg-gold/10 ring-1 ring-gold/25"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
                          kosherFocus,
                          active ? "text-gold" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {viewer.shabbatLocked && !fullBleed && (
            <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-techelet/30 bg-techelet-dim px-4 py-3 text-sm text-[var(--text-primary)]">
              <MoonStar className="h-4 w-4 shrink-0 text-techelet" aria-hidden />
              Shabat shalom. Tu modo Shabat está activo: podés leer todo y volver a escribir después de Havdalá.
            </div>
          )}
        </div>

        <div className={cn(fullBleed ? "h-full" : "container mx-auto px-4 md:px-6")}>{children}</div>
      </div>
      <Toaster
        position="top-center"
        offset={88}
        toastOptions={{
          className: "liquid-glass !rounded-2xl !border-[var(--lg-stroke)] !text-[var(--text-primary)] !shadow-none",
          style: { background: "var(--lg-fill-regular)" },
        }}
      />
    </div>
  );
}
