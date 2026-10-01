"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { pwnFetch, readForumSync } from "@/components/pwn/api";
import { PWN_FEEDS_UPDATED, PWN_NOTIFICATIONS_UPDATED } from "@/components/pwn/events";
import { focusRing } from "@/components/pwn/format";
import { formatLeakNotice } from "@/lib/pwn/new-leak-notice";
import { FORUM_SYNC_INTERVAL_MS } from "@/lib/pwn/forum-sync-policy";
import { isAdmin } from "@/lib/pwn/permissions";

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
    let timer: number | undefined;

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
    timer = window.setInterval(() => void tick(), FORUM_SYNC_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onNotice]);

  return null;
}

const NAV = [
  { href: "/pwn", label: "Resumen" },
  { href: "/pwn/exposure", label: "Exposición" },
  { href: "/pwn/breaches", label: "Filtraciones" },
  { href: "/pwn/vulnerabilities", label: "Vulnerabilidades" },
  { href: "/pwn/signals", label: "Señales" },
  { href: "/pwn/actors", label: "Autores" },
  { href: "/pwn/organizations", label: "Organizaciones" },
  { href: "/pwn/alerts", label: "Alertas" },
  { href: "/pwn/reports", label: "Informes" },
  { href: "/pwn/sources", label: "Fuentes" },
];

export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PwnShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  const roles = Array.isArray((session?.user as { roles?: unknown } | undefined)?.roles)
    ? ((session?.user as { roles: string[] }).roles)
    : [];
  const navItems = isAdmin(roles)
    ? NAV.flatMap((item) =>
        item.href === "/pwn/exposure" ? [item, { href: "/pwn/autorizaciones", label: "Autorizaciones" }] : [item],
      )
    : NAV;

  const onNotice = useCallback((next: { title: string; body: string }) => {
    setNotice(next);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 10_000);
    return () => window.clearTimeout(id);
  }, [notice]);

  return (
    <div className="relative min-h-screen w-full bg-bg-primary pb-28">
      <PwnPresencePatrol onNotice={onNotice} />
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute left-1/2 top-0 h-[420px] w-full -translate-x-1/2 bg-gold/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 pt-24 md:pt-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold">Mercav Pwn</p>
              <p className="mt-1 text-sm text-gray-400">Cyber Intelligence & Exposure Monitoring</p>
              <Link href="/pwn/terminos" className={`mt-2 inline-block text-xs text-gray-500 underline-offset-4 hover:text-gold hover:underline ${focusRing}`}>
                Términos de uso de Pwn
              </Link>
            </div>
            <p className="font-display text-sm tracking-wide text-white-soft">Detect. Investigate. Protect.</p>
          </div>

          <nav aria-label="Secciones de Mercav Pwn" className="-mx-4 mb-8 px-4 md:mx-0 md:px-0">
            <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = item.href === "/pwn" ? pathname === "/pwn" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium transition-colors ${focusRing} ${
                        active ? "bg-gold/10 text-gold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-white">{notice.title}</p>
                <p className="mt-1 text-sm text-gray-300">{notice.body}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/pwn/signals?kind=LEAKS"
                  className={`text-sm font-semibold text-gold underline-offset-4 hover:underline ${focusRing}`}
                >
                  Ver señales
                </Link>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className={`text-sm text-gray-400 hover:text-white ${focusRing}`}
                >
                  Cerrar
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
