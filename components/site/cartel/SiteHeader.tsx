"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutGrid, Menu, Moon, Sun, X } from "@/components/icons";
import { HostLink } from "@/components/layout/HostContext";
import { useTheme } from "@/components/ui/ThemeProvider";
import { APP_HOME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

/** Las tres apps llevan a su cartel en la portada. */
const APPS = [
  { href: "/#pilar-business", label: "Business" },
  { href: "/#pilar-pwn", label: "Pwn" },
  { href: "/#pilar-kosher", label: "Kosher" },
  { href: "/news", label: "News" },
];

const LINKS = [
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/pitch", label: "Pitch" },
  { href: "/inversores", label: "Inversores" },
];

/** Resorte sin rebote para la entrada y salida del menú (Apple: response 0.4, damping 1). */
const SHEET_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="grid h-10 w-10 place-items-center rounded-[2px] text-[var(--c-text)] transition-colors hover:text-[var(--c-yellow-text)]"
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/images/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      <span className="c-display text-[1.75rem] tracking-[0.02em]">Mercav</span>
    </span>
  );
}

/** Header del sitio público (mercav.lat), en el mundo del cartel. */
export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const signedIn = !!session?.user;

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="cartel c-nav fixed inset-x-0 top-0 z-[100] pt-[env(safe-area-inset-top,0px)]">
        <div className="c-container flex h-[var(--c-nav-h)] items-center gap-4">
          <Link href="/" aria-label="Mercav, inicio" className="shrink-0 rounded-[2px]">
            <Wordmark />
          </Link>

          <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 lg:flex xl:ml-6">
            {APPS.map((l) => (
              <Link key={l.href} href={l.href} className="c-label rounded-[2px] px-2.5 py-2 text-[1.15rem] text-[var(--c-soft)] transition-colors hover:text-[var(--c-text)]">
                {l.label}
              </Link>
            ))}
            <span aria-hidden className="mx-2 h-5 w-[2px] bg-[var(--c-line-strong)]" />
            {LINKS.map((l, i) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "c-label rounded-[2px] px-2.5 py-2 text-[1.15rem] underline-offset-[0.35em] transition-colors",
                    i > 0 && "hidden xl:inline-flex",
                    active ? "underline decoration-[var(--c-yellow)] decoration-[3px]" : "text-[var(--c-soft)] hover:text-[var(--c-text)]",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <ThemeSwitch />
            {status === "unauthenticated" ? (
              <HostLink href="/login" className="c-label hidden rounded-[2px] px-2 py-2 text-[1.15rem] text-[var(--c-soft)] transition-colors hover:text-[var(--c-text)] md:inline-flex">
                Entrar
              </HostLink>
            ) : null}
            {status === "loading" ? (
              <span aria-hidden className="hidden h-10 w-44 sm:block" />
            ) : signedIn ? (
              <HostLink href={APP_HOME} className="c-btn c-btn-sm hidden sm:inline-flex">
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Abrir la app
              </HostLink>
            ) : (
              <HostLink href="/register" className="c-btn c-btn-sm hidden sm:inline-flex">
                Creá tu cuenta
                <ArrowRight className="h-4 w-4" aria-hidden />
              </HostLink>
            )}
            <button
              ref={menuButton}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={open}
              aria-controls="site-menu"
              className="grid h-10 w-10 place-items-center rounded-[2px] text-[var(--c-text)] lg:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <SiteMenu open={open} signedIn={signedIn} onClose={() => { setOpen(false); menuButton.current?.focus(); }} />
    </>
  );
}

/** Menú del celular: un cartel negro que baja desde el header y vuelve por el mismo camino. */
function SiteMenu({ open, signedIn, onClose }: { open: boolean; signedIn: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>("a, button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("a, button")?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="site-menu"
          id="site-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="cartel c-night fixed inset-0 z-[150] flex flex-col overflow-y-auto pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
          transition={reduce ? { duration: 0.15 } : SHEET_SPRING}
        >
          <div className="c-container flex h-[var(--c-nav-h)] shrink-0 items-center justify-between">
            <Link href="/" onClick={onClose} aria-label="Mercav, inicio" className="rounded-[2px]">
              <Wordmark />
            </Link>
            <button type="button" onClick={onClose} aria-label="Cerrar menú" className="grid h-10 w-10 place-items-center rounded-[2px]">
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav aria-label="Principal" className="c-container flex flex-1 flex-col justify-center gap-1 py-8">
            {[{ href: "/", label: "Inicio" }, ...APPS.map((a) => ({ ...a, label: `Mercav ${a.label}` })), ...LINKS].map((l) => (
              <Link key={l.href} href={l.href} onClick={onClose} className="c-display rounded-[2px] py-0.5 text-[clamp(2.4rem,11vw,4.2rem)] transition-colors hover:text-[var(--c-yellow-text)]">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="c-container flex flex-col gap-4 border-t-2 border-[var(--c-line)] py-8">
            {signedIn ? (
              <HostLink href={APP_HOME} onClick={onClose} className="c-btn c-btn-lg">
                <LayoutGrid className="h-5 w-5" aria-hidden />
                Abrir la app
              </HostLink>
            ) : (
              <>
                <HostLink href="/register" onClick={onClose} className="c-btn c-btn-lg">
                  Creá tu cuenta gratis
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </HostLink>
                <HostLink href="/login" onClick={onClose} className="c-btn c-btn-ghost c-btn-lg">
                  Entrar
                </HostLink>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
// creado por pato dev y askforvini
