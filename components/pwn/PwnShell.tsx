"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, ShieldCheck, X } from "@/components/icons";
import { pwnFetch, readForumSync } from "@/components/pwn/api";
import { PWN_FEEDS_UPDATED, PWN_NOTIFICATIONS_UPDATED } from "@/components/pwn/events";
import { focusRing } from "@/components/pwn/format";
import { formatLeakNotice } from "@/lib/pwn/new-leak-notice";
import { FORUM_SYNC_INTERVAL_MS } from "@/lib/pwn/forum-sync-policy";
import { usePwnSession } from "@/components/pwn/session";

export { PWN_FEEDS_UPDATED, PWN_NOTIFICATIONS_UPDATED };

const WATERMARK_KEY = "mercav-pwn-signal-watermark";
let presenceBusy = false;

export function usePwnFeedRefresh(onRefresh: () => void) {
  useEffect(() => {
    const handler = () => onRefresh();
    window.addEventListener(PWN_FEEDS_UPDATED, handler);
    return () => window.removeEventListener(PWN_FEEDS_UPDATED, handler);
  }, [onRefresh]);
}

function readWatermark(): string | null {
  try {
    return window.localStorage.getItem(WATERMARK_KEY);
  } catch {
    return null;
  }
}

function writeWatermark(value: string) {
  try {
    window.localStorage.setItem(WATERMARK_KEY, value);
  } catch {
    /* private mode */
  }
}

function PwnPresencePatrol({
  onNotice,
}: {
  onNotice: (notice: { title: string; body: string }) => void;
}) {
  useEffect(() => {
    let stopped = false;
    let lastAttempt = 0;

    async function tick() {
      if (stopped || presenceBusy) return;
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (lastAttempt > 0 && now - lastAttempt < FORUM_SYNC_INTERVAL_MS - 5_000) return;
      presenceBusy = true;
      lastAttempt = now;
      const since = readWatermark();
      const params = new URLSearchParams();
      if (since) params.set("since", since);
      const query = params.toString();
      const response = await pwnFetch(`/api/pwn/forum-signals${query ? `?${query}` : ""}`, { method: "POST" });
      presenceBusy = false;
      if (stopped) return;
      if (!response.ok && (response.reason === "unauthorized" || response.reason === "disabled")) {
        stopped = true;
        return;
      }
      if (!response.ok) return;
      const parsed = readForumSync(response.data);
      if (parsed?.skipReason === "in_flight") return;
      if (parsed && parsed.freshCount > 0) {
        const copy = formatLeakNotice({ count: parsed.freshCount, samples: parsed.freshSamples });
        if (copy) onNotice(copy);
      }
      writeWatermark(new Date().toISOString());
      window.dispatchEvent(new Event(PWN_FEEDS_UPDATED));
      if (parsed?.notified) window.dispatchEvent(new Event(PWN_NOTIFICATIONS_UPDATED));
    }

    void tick();
    const timer = window.setInterval(() => void tick(), FORUM_SYNC_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onNotice]);

  return null;
}

// Fuentes y Autorizaciones son de administración: no se muestran a nadie más (la API igual lo exige).
const NAV: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/pwn", label: "Resumen" },
  { href: "/pwn/exposure", label: "Exposición" },
  { href: "/pwn/autorizaciones", label: "Autorizaciones", adminOnly: true },
  { href: "/pwn/breaches", label: "Filtraciones" },
  { href: "/pwn/vulnerabilities", label: "Vulnerabilidades" },
  { href: "/pwn/signals", label: "Señales" },
  { href: "/pwn/actors", label: "Autores" },
  { href: "/pwn/organizations", label: "Organizaciones" },
  { href: "/pwn/alerts", label: "Alertas" },
  { href: "/pwn/reports", label: "Informes" },
  { href: "/pwn/sources", label: "Fuentes", adminOnly: true },
];

export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PwnShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, isAdmin } = usePwnSession();
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);

  const onNotice = useCallback((next: { title: string; body: string }) => {
    setNotice(next);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 10_000);
    return () => window.clearTimeout(id);
  }, [notice]);

  // Keep the active tab in view on narrow screens without moving the page.
  const railRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!rail || !active) return;
    const left = active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [pathname, navItems.length]);

  return (
    <div className="p-world p-page relative min-h-screen w-full pb-28">
      {/* El patrullaje solo corre con sesión: sin ella, el POST respondía 401 en cada página. */}
      {status === "authenticated" ? <PwnPresencePatrol onNotice={onNotice} /> : null}

      <div className="relative z-10 pt-24 md:pt-28">
        <div className="mv-container">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-2 font-semibold tracking-[-0.012em] text-[var(--text-primary)]">
                <ShieldCheck className="h-5 w-5 text-gold" aria-hidden />
                Mercav <span className="text-gold">Pwn</span>
              </span>
              <span className="text-sm text-[var(--text-secondary)]">Ciberinteligencia defensiva: exposición, filtraciones y alertas.</span>
            </p>
            <Link
              href="/pwn/terminos"
              className={`inline-flex min-h-11 items-center self-start text-xs text-[var(--text-tertiary)] underline-offset-4 transition-colors hover:text-gold hover:underline sm:self-auto ${focusRing} rounded`}
            >
              Términos de uso de Pwn
            </Link>
          </div>
        </div>

        <nav
          aria-label="Secciones de Mercav Pwn"
          className="sticky top-[calc(var(--c-nav-h)+env(safe-area-inset-top,0px))] z-40 mt-4 bg-[var(--color-bg-primary)] py-2"
        >
          <div className="mv-container">
            <div className="relative">
              <ul
                ref={railRef}
                className="scrollbar-hide flex gap-1.5 overflow-x-auto scroll-smooth [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] lg:flex-wrap lg:overflow-visible lg:[mask-image:none]"
              >
                {navItems.map((item) => {
                  const active = item.href === "/pwn" ? pathname === "/pwn" : pathname === item.href || (pathname ?? "").startsWith(`${item.href}/`);
                  return (
                    <li key={item.href} className="shrink-0 last:pr-6 lg:last:pr-0">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex h-11 items-center justify-center whitespace-nowrap rounded-[0.875rem] px-4 text-[0.9rem] font-semibold outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:shadow-[0_0_0_2px_var(--color-bg-primary),0_0_0_4px_var(--color-gold)] ${
                          active
                            ? "bg-gold text-[var(--mv-on-gold)]"
                            : "bg-[var(--mv-panel)] text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </nav>

        <div className="mv-container mt-8 md:mt-10">
          {notice ? (
            <div
              role="status"
              aria-live="polite"
              className="mv-pop mb-8 flex flex-col gap-4 rounded-[1.25rem] bg-[var(--mv-panel)] p-4 shadow-[inset_0_0_0_1.5px_var(--p-alert)] sm:flex-row sm:items-center sm:justify-between md:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.875rem] bg-[var(--p-alert-wash)] text-[var(--p-alert)]">
                  <BellRing className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{notice.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{notice.body}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <Link href="/pwn/signals?kind=LEAKS" className="mv-btn mv-btn-primary flex-1 sm:flex-none">
                  Ver señales
                </Link>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Cerrar aviso"
                  className="mv-btn mv-btn-ghost h-11 w-11 px-0"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
