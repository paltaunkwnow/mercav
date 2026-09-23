"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { focusRing } from "@/components/pwn/format";

const NAV = [
  { href: "/pwn", label: "Resumen" },
  { href: "/pwn/exposure", label: "Exposición" },
  { href: "/pwn/breaches", label: "Filtraciones" },
  { href: "/pwn/vulnerabilities", label: "Vulnerabilidades" },
  { href: "/pwn/organizations", label: "Organizaciones" },
  { href: "/pwn/monitor", label: "Monitoreo" },
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

  return (
    <div className="relative min-h-screen w-full bg-bg-primary pb-28">
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
            </div>
            <p className="font-display text-sm tracking-wide text-white-soft">Detect. Investigate. Protect.</p>
          </div>

          <nav aria-label="Secciones de Mercav Pwn" className="-mx-4 mb-8 px-4 md:mx-0 md:px-0">
            <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
              {NAV.map((item) => {
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

          {children}
        </div>
      </div>
    </div>
  );
}
