"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  User,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  LogOut,
  Edit3,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  LayoutGrid,
} from "@/components/icons";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { HostLink, useAppPathname, useHostKind, useHostNavigate } from "./HostContext";
import { SeekField } from "@/components/motion/SeekField";
import { APP_SECTION_GROUPS, activeSectionKey } from "@/lib/app/sections";
import { APP_HOME, isMarketingPath, type HostKind } from "@/lib/seo/site";
import { SiteHeader, ThemeSwitch, Wordmark } from "@/components/site/cartel/SiteHeader";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Accesos directos de la app en el header de escritorio. */
const APP_LINKS = [
  { href: APP_HOME, key: "inicio", label: "Inicio" },
  { href: "/business", key: "business", label: "Business" },
  { href: "/herramientas", key: "tools", label: "Tools" },
  { href: "/pwn", key: "pwn", label: "Pwn" },
  { href: "/calendario", key: "calendario", label: "Calendario" },
];

/** Hide the global chrome on pages that bring their own full-screen shell. */
export function hidesGlobalChrome(pathname: string | null) {
  const path = pathname ?? "";
  // La caja (personal o de una empresa en Business) va a pantalla completa, como una terminal.
  return /^\/(dashboard\/pos|admin)(\/|$)/.test(path) || /^\/business\/[^/]+\/caja(\/|$)/.test(path) || path === "/1337";
}

function useDismiss(open: boolean, close: (viaKeyboard?: boolean) => void, refs: React.RefObject<HTMLElement>[]) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (refs.some((r) => r.current?.contains(t))) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

function ProfileMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const navigate = useHostNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 12 });

  const updatePos = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) });
  };

  useDismiss(open, () => setOpen(false), [wrapRef, menuRef]);
  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  const items = [
    { href: "/perfil", label: "Mi perfil", icon: User },
    { href: "/perfil/editar", label: "Editar perfil", icon: Edit3 },
    { href: "/perfil/configuracion", label: "Configuración y ajustes", icon: Settings },
    { href: "/dashboard", label: "Mi panel", icon: LayoutDashboard },
  ];

  return (
    <div className="relative hidden md:block" ref={wrapRef}>
      <button
        type="button"
        aria-label="Ajustes del perfil"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          updatePos();
          setOpen((v) => !v);
        }}
        className="c-label inline-flex h-10 shrink-0 items-center gap-2 rounded-[2px] px-2.5 text-[1.1rem] text-[var(--c-text)] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-shadow hover:shadow-[inset_0_0_0_2px_currentColor]"
      >
        <User className="h-4 w-4 text-[var(--c-yellow-text)]" aria-hidden />
        <span className="hidden xl:inline">Mi perfil</span>
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Ajustes del perfil"
            className="mv-pop mv-menu fixed z-[200] w-[260px] rounded-2xl p-1.5 text-[var(--text-primary)]"
            style={{ top: pos.top, right: pos.right, transformOrigin: "top right" }}
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{name || "Cuenta"}</p>
              {email && <p className="truncate text-xs text-[var(--text-secondary)]">{email}</p>}
            </div>
            <div className="mv-divider my-1" />
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    navigate(item.href);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)]"
                >
                  <Icon className="h-4 w-4 text-gold" aria-hidden />
                  {item.label}
                </button>
              );
            })}
            <div className="mv-divider my-1" />
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-red-400 outline-none hover:bg-red-500/10 focus-visible:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

function SectionsMenu({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useDismiss(open, (viaKeyboard) => {
    setOpen(false);
    if (viaKeyboard) btnRef.current?.focus();
  }, [btnRef, panelRef]);
  useEffect(() => setOpen(false), [pathname]);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(640, window.innerWidth - 32);
    const bar = btnRef.current?.closest("header")?.getBoundingClientRect().bottom ?? r.bottom;
    setPos({ top: bar + 8, left: Math.max(16, Math.min(r.left - 8, window.innerWidth - width - 16)) });
  };
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [open]);

  const active = activeSectionKey(pathname);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          place();
          setOpen((v) => !v);
        }}
        className={cn(
          "c-label inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-2 text-[1.15rem] transition-colors",
          open ? "text-[var(--c-text)]" : "text-[var(--c-soft)] hover:text-[var(--c-text)]",
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Apartados
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            className="mv-pop mv-menu fixed z-[160] max-h-[calc(100dvh-7rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.5rem] p-2"
            style={{ top: pos.top, left: pos.left, transformOrigin: "top left" }}
          >
            {APP_SECTION_GROUPS.map((group) => (
              <div key={group.key} className="p-1">
                <p className="px-3 pb-1.5 pt-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{group.title}</p>
                <ul className="grid grid-cols-2 gap-1">
                  {group.sections.map(({ key, href, label, desc, icon: Icon }) => {
                    const on = active === key;
                    return (
                      <li key={key}>
                        <HostLink
                          href={href}
                          aria-current={on ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className="group flex items-start gap-3 rounded-2xl p-2.5 outline-none transition-colors hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-border-gold)]"
                        >
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] ${on ? "bg-gold text-[var(--mv-on-gold)]" : "bg-gold/10 text-gold"}`}>
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                            <span className="block text-xs leading-snug text-[var(--text-secondary)]">{desc}</span>
                          </span>
                        </HostLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function MobileMenu({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <button type="button" aria-label="Cerrar menú" onClick={onClose} className="mv-fade absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="mv-sheet mv-menu absolute inset-x-[max(0.75rem,env(safe-area-inset-left,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[1.75rem] p-3"
      >
        <div className="flex items-center justify-between px-2 pb-2 pt-1" role="presentation">
          <span className="font-display text-lg font-semibold text-[var(--text-primary)]">Mercav</span>
          <button type="button" onClick={onClose} className="mv-focus grid h-10 w-10 place-items-center rounded-full text-[var(--text-primary)]" aria-label="Cerrar menú">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <>
            {APP_SECTION_GROUPS.map((group) => (
              <div key={group.key}>
                <p className="px-3 pb-1.5 pt-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{group.title}</p>
                <ul className="grid gap-0.5">
                  {group.sections.map(({ key, href, label, desc, icon: Icon }) => (
                    <li key={key}>
                      <HostLink href={href} onClick={onClose} className="flex items-center gap-3 rounded-2xl px-3 py-2 outline-none hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)]">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{label}</span>
                          <span className="block truncate text-xs text-[var(--text-secondary)]">{desc}</span>
                        </span>
                      </HostLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!signedIn && (
              <div className="mt-3 grid grid-cols-2 gap-2 p-1">
                <HostLink href="/login" onClick={onClose} className="mv-btn mv-btn-secondary">
                  Iniciar sesión
                </HostLink>
                <HostLink href="/register" onClick={onClose} className="mv-btn mv-btn-primary">
                  Crear cuenta
                </HostLink>
              </div>
            )}
          </>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Public-site header (mercav.lat) or app header. The host decides in production; in dev (one origin for every
 * route) the path does. kosher.mercav.lat always gets the app header.
 */
export function isSiteChrome(hostKind: HostKind, pathname: string | null) {
  if (hostKind === "dev") return isMarketingPath(pathname ?? "/");
  return hostKind === "site";
}

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const appPath = useAppPathname();
  const hostKind = useHostKind();
  const navigate = useHostNavigate();
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  if (hidesGlobalChrome(pathname)) return null;

  // mercav.lat muestra el header del sitio público; app.mercav.lat y kosher.mercav.lat, el de la app.
  const site = isSiteChrome(hostKind, pathname);
  // mercav.lat tiene su propio header, en el mundo del cartel.
  if (site) return <SiteHeader />;
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const active = activeSectionKey(appPath);

  return (
    <>
      <header data-scrolled={scrolled} className="cartel c-nav fixed inset-x-0 top-0 z-[100] pt-[env(safe-area-inset-top,0px)]">
        <div className="c-container flex h-[var(--c-nav-h)] min-w-0 items-center gap-2 sm:gap-3">
          <HostLink href={APP_HOME} className="flex shrink-0 items-center rounded-[2px]" aria-label="Mercav, inicio de la app">
            <Wordmark />
          </HostLink>

          <nav className="ml-3 hidden min-w-0 items-center gap-0.5 lg:flex xl:ml-5" aria-label="Apartados">
            {APP_LINKS.map((item) => {
              const isActive = active === item.key;
              return (
                <HostLink
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "c-label whitespace-nowrap rounded-[2px] px-2.5 py-2 text-[1.15rem] underline-offset-[0.35em] transition-colors",
                    isActive ? "text-[var(--c-text)] underline decoration-[var(--c-yellow)] decoration-[3px]" : "text-[var(--c-soft)] hover:text-[var(--c-text)]",
                  )}
                >
                  {item.label}
                </HostLink>
              );
            })}
            <span aria-hidden className="mx-1.5 h-5 w-[2px] bg-[var(--c-line-strong)]" />
            <SectionsMenu pathname={appPath} />
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <SeekField
              value={search}
              onValueChange={setSearch}
              onSubmit={(query) => navigate(`/buscar?q=${encodeURIComponent(query)}`)}
              placeholder="Buscar"
              shut={40}
              openWidth={168}
              defaultOpen
              persistent
              anchor="end"
              className="hidden shrink-0 xl:block"
            />
            <SeekField
              value={search}
              onValueChange={setSearch}
              onSubmit={(query) => navigate(`/buscar?q=${encodeURIComponent(query)}`)}
              placeholder="Buscar"
              shut={40}
              openWidth={168}
              anchor="end"
              className="shrink-0 xl:hidden"
            />

            <ThemeSwitch />

            {session ? (
              <>
                <HostLink
                  href="/mensajes"
                  aria-label="Mensajes"
                  title="Mensajes"
                  className={cn(
                    "hidden h-10 w-10 place-items-center rounded-[2px] transition-colors sm:grid",
                    active === "mensajes" ? "text-[var(--c-yellow-text)]" : "text-[var(--c-text)] hover:text-[var(--c-yellow-text)]",
                  )}
                >
                  <MessageSquare className="h-5 w-5" aria-hidden />
                </HostLink>
                <NotificationBell />
                {roles.includes("ADMIN") && (
                  <HostLink
                    href="/admin/dashboard"
                    aria-label="Administración"
                    title="Administración"
                    className="hidden h-10 w-10 place-items-center rounded-[2px] text-[var(--c-yellow-text)] transition-colors hover:text-[var(--c-text)] sm:grid"
                  >
                    <ShieldAlert className="h-5 w-5" aria-hidden />
                  </HostLink>
                )}
                <ProfileMenu name={session.user?.name} email={session.user?.email} />
              </>
            ) : status === "loading" ? (
              // Mientras se lee la sesión no mostramos "Entrar" para no parpadear.
              <span className="hidden h-10 w-44 sm:block" aria-hidden />
            ) : (
              <>
                <Link href="/login" className="c-label hidden rounded-[2px] px-2 py-2 text-[1.15rem] text-[var(--c-soft)] transition-colors hover:text-[var(--c-text)] md:inline-flex">
                  Entrar
                </Link>
                <Link href="/register" className="c-btn c-btn-sm hidden sm:inline-flex">
                  Creá tu cuenta
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              className="grid h-10 w-10 place-items-center rounded-[2px] text-[var(--c-text)] lg:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} signedIn={!!session} />
    </>
  );
}
// creado por pato dev y askforvini
