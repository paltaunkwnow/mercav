"use client";

import Link from "next/link";
import { useAppPathname } from "@/components/layout/HostContext";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { MoonStar } from "@/components/icons";
import { Toaster } from "sonner";
import { useKosherViewer } from "@/components/kosher/KosherViewer";
import { cn } from "@/lib/utils";
import { StarOfDavid } from "@/components/site/StarOfDavid";

const NAV = [
  { href: "/kosher", label: "Inicio" },
  { href: "/kosher/mapa", label: "Mapa" },
  { href: "/kosher/calendario", label: "Calendario" },
  { href: "/kosher/festividades", label: "Festividades" },
  { href: "/kosher/sidur", label: "Sidur" },
  { href: "/kosher/kashrut", label: "Kashrut" },
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
    <span className={cn("inline-flex items-center gap-2", className)}>
      <StarOfDavid className="h-5 w-5 text-[var(--k-accent)]" />
      <span className="font-semibold tracking-[-0.012em] text-[var(--text-primary)]">
        Mercav <span className="text-[var(--k-accent)]">Kosher</span>
      </span>
      <span lang="he" dir="rtl" className="text-sm text-[var(--k-accent)]">
        מקום
      </span>
    </span>
  );
}

export function KosherShell({ children }: { children: ReactNode }) {
  // The route, not the browser path: kosher.mercav.lat/mapa renders /kosher/mapa.
  const pathname = useAppPathname();
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
      <div className="k-world k-page relative h-[100dvh] w-full overflow-hidden">
        <div className="relative z-10 h-full">{children}</div>
        {toaster}
      </div>
    );
  }

  return (
    <div className="k-world k-page relative w-full pb-28 md:pb-24">
      <div className="relative z-10 pt-24 md:pt-28">
        <div className="mv-container">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/kosher" className={cn("-ml-1 self-start rounded-lg px-1 py-1", kosherFocus)} aria-label="Mercav Kosher, inicio">
              <KosherWordmark className="text-lg" />
            </Link>
            <nav aria-label="Secciones de Mercav Kosher" className="-mx-4 px-4 sm:mx-0 sm:px-0">
              <ul className="scrollbar-hide flex w-max max-w-full gap-1.5 overflow-x-auto">
                {items.map((item) => {
                  const active = item.href === "/kosher" ? pathname === "/kosher" : pathname?.startsWith(item.href);
                  return (
                    <li key={item.href} className="relative shrink-0">
                      {active && (
                        <motion.span
                          layoutId="kosher-subnav"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-[var(--k-accent)]"
                          transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.35 }}
                        />
                      )}
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-10 items-center rounded-full px-4 text-[0.9rem] font-semibold transition-colors duration-200",
                          kosherFocus,
                          active ? "text-[var(--k-on-accent)]" : "bg-[var(--mv-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
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
            <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl bg-[var(--mv-panel)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1.5px_var(--k-accent)]">
              <MoonStar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--k-accent)]" aria-hidden />
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
