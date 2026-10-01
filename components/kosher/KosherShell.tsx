"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
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

/** Pages that lay out their own full-width sections (they bring their own containers). */
const BARE = new Set(["/kosher", "/kosher/terminos"]);

export const kosherFocus = "mv-focus outline-none";

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
  const reduce = useReducedMotion();
  const fullBleed = pathname === "/kosher/mapa";
  const bare = BARE.has(pathname ?? "");
  const items = viewer.isModerator ? [...NAV, { href: "/kosher/moderacion", label: "Moderación" }] : NAV;

  const toaster = (
    <Toaster
      position="top-center"
      offset={88}
      toastOptions={{
        className: "liquid-glass !rounded-2xl !border-[var(--lg-stroke)] !text-[var(--text-primary)] !shadow-none",
        style: { background: "var(--lg-fill-regular)" },
      }}
    />
  );

  if (fullBleed) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-bg-primary">
        <div className="relative z-10 h-full">{children}</div>
        {toaster}
      </div>
    );
  }

  return (
    <div className="relative w-full bg-bg-primary pb-16 md:pb-24">
      {/* One ambient light for the whole Kosher area, tinted techelet. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[min(900px,140vw)] -translate-x-1/2 rounded-full bg-techelet/[0.08] blur-[110px]" />
      </div>

      <div className="relative z-10 pt-24 md:pt-28">
        <div className="mv-container">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/kosher" className={cn("-ml-1 self-start rounded-lg px-1 py-1", kosherFocus)} aria-label="Mercav Kosher, inicio">
              <KosherWordmark className="text-lg" />
            </Link>
            <nav aria-label="Secciones de Mercav Kosher" className="-mx-4 px-4 sm:mx-0 sm:px-0">
              <ul className="liquid-glass scrollbar-hide flex w-max max-w-full gap-0.5 overflow-x-auto rounded-full p-1">
                {items.map((item) => {
                  const active = item.href === "/kosher" ? pathname === "/kosher" : pathname?.startsWith(item.href);
                  return (
                    <li key={item.href} className="relative shrink-0">
                      {active && (
                        <motion.span
                          layoutId="kosher-subnav"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-techelet-dim ring-1 ring-inset ring-techelet/35"
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                        />
                      )}
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                          kosherFocus,
                          active ? "text-techelet" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
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

          {viewer.shabbatLocked && (
            <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-techelet/30 bg-techelet-dim px-4 py-3 text-sm text-[var(--text-primary)]">
              <MoonStar className="mt-0.5 h-4 w-4 shrink-0 text-techelet" aria-hidden />
              <span>Shabat shalom. Tu modo Shabat está activo: podés leer todo y volver a escribir después de Havdalá.</span>
            </div>
          )}
        </div>

        {bare ? children : <div className="mv-container mt-10 md:mt-14">{children}</div>}
      </div>
      {toaster}
    </div>
  );
}
