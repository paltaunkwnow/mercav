"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Rss,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  LogOut,
  Edit3,
  ChevronDown,
  Menu,
  X,
  Megaphone,
  MonitorPlay,
  Briefcase,
  Wrench,
  Shield,
  Store,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SeekField } from "@/components/motion/SeekField";
import { StarOfDavid } from "@/components/site/StarOfDavid";

export const PRODUCTS = [
  { href: "/anuncios", label: "Ads", desc: "Vallas, pantallas y vidrieras para alquilar", icon: Megaphone },
  { href: "/servicios", label: "Services", desc: "Talento digital con pago por hitos", icon: MonitorPlay },
  { href: "/empleos", label: "Jobs", desc: "Vacantes y postulaciones", icon: Briefcase },
  { href: "/herramientas", label: "Tools", desc: "Calculadoras, contratos e IA", icon: Wrench },
  { href: "/dashboard/pos", label: "POS", desc: "Caja e inventario para cualquier rubro", icon: Store },
  { href: "/pwn", label: "Pwn", desc: "Exposición, filtraciones y alertas", icon: Shield },
  { href: "/kosher", label: "Kosher", desc: "Atlas, stock y kehilot", icon: StarOfDavid },
] as const;

const COMPANY = [
  { href: "/precios", label: "Precios" },
  { href: "/por-que-mercav", label: "Por qué Mercav" },
  { href: "/inversores", label: "Inversores" },
];

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
  const router = useRouter();
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
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
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
        className="mv-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[var(--mv-hairline-strong)] px-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-gold/50"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-gold/15 text-gold">
          <User className="h-3.5 w-3.5" aria-hidden />
        </span>
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
                    router.push(item.href);
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
              onClick={() => signOut({ callbackUrl: "/" })}
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

function ProductsMenu({ pathname }: { pathname: string | null }) {
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
    const width = Math.min(576, window.innerWidth - 32);
    setPos({ top: r.bottom + 18, left: Math.max(16, Math.min(r.left - 8, window.innerWidth - width - 16)) });
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

  const active = PRODUCTS.some((p) => pathname === p.href || pathname?.startsWith(`${p.href}/`));

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
        className={`mv-focus inline-flex h-9 items-center gap-1 rounded-full px-3 text-[13.5px] font-semibold transition-colors ${
          active || open ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
      >
        Productos
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            className="mv-pop mv-menu fixed z-[160] w-[min(36rem,calc(100vw-2rem))] rounded-[1.5rem] p-2"
            style={{ top: pos.top, left: pos.left, transformOrigin: "top left" }}
          >
            <ul className="grid grid-cols-2 gap-1">
              {PRODUCTS.map(({ href, label, desc, icon: Icon }) => {
                const on = pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={on ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className="group flex items-start gap-3 rounded-2xl p-3 outline-none transition-colors hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-border-gold)]"
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] ${on ? "bg-gold text-[var(--mv-on-gold)]" : "bg-gold/10 text-gold"}`}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">Mercav {label}</span>
                        <span className="block text-xs leading-snug text-[var(--text-secondary)]">{desc}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
        <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[var(--text-tertiary)]">Productos</p>
        <ul className="grid gap-0.5">
          {PRODUCTS.map(({ href, label, desc, icon: Icon }) => (
            <li key={href}>
              <Link href={href} onClick={onClose} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 outline-none hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{label}</span>
                  <span className="block truncate text-xs text-[var(--text-secondary)]">{desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mv-divider my-3" />
        <ul className="grid gap-0.5">
          {[...(signedIn ? [{ href: "/feed", label: "Feed" }] : []), ...COMPANY, { href: "/nosotros", label: "Quiénes somos" }].map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onClose} className="block rounded-2xl px-3 py-2.5 text-[15px] font-medium text-[var(--text-primary)] outline-none hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)]">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        {!signedIn && (
          <div className="mt-3 grid grid-cols-2 gap-2 p-1">
            <Link href="/login" onClick={onClose} className="mv-btn mv-btn-secondary">
              Iniciar sesión
            </Link>
            <Link href="/register" onClick={onClose} className="mv-btn mv-btn-primary">
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
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

  if (/^\/(dashboard\/pos|admin)(\/|$)/.test(pathname ?? "") || pathname === "/1337") return null;

  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];

  return (
    <>
      <header
        data-scrolled={scrolled}
        className="liquid-glass liquid-glass-lens fixed z-[100] mx-auto max-w-[76rem] rounded-full transition-[box-shadow,transform] duration-300 left-[max(0.75rem,env(safe-area-inset-left,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] data-[scrolled=true]:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
      >
        <div className="flex h-14 min-w-0 items-center gap-2 pl-2.5 pr-2 sm:h-16 sm:gap-3 sm:pl-4 sm:pr-3">
          <Link href="/" className="mv-focus flex shrink-0 items-center gap-2 rounded-full pr-1" aria-label="Mercav, inicio">
            <img src="/images/logo.png" alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" width={36} height={36} />
            <span className="hidden font-display text-[17px] font-semibold tracking-tight text-[var(--text-primary)] sm:inline">Mercav</span>
          </Link>

          <nav className="ml-2 hidden min-w-0 items-center gap-0.5 lg:flex" aria-label="Principal">
            <ProductsMenu pathname={pathname} />
            {[...(session ? [{ href: "/feed", label: "Feed" }] : []), ...COMPANY].map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`mv-focus inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold transition-colors ${
                    isActive ? "bg-gold/10 text-gold" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item.href === "/feed" && <Rss className="h-3.5 w-3.5" aria-hidden />}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <SeekField
              value={search}
              onValueChange={setSearch}
              onSubmit={(query) => router.push(`/buscar?q=${encodeURIComponent(query)}`)}
              placeholder="Buscar"
              shut={36}
              openWidth={156}
              defaultOpen
              persistent
              anchor="end"
              className="hidden shrink-0 xl:block"
            />
            <SeekField
              value={search}
              onValueChange={setSearch}
              onSubmit={(query) => router.push(`/buscar?q=${encodeURIComponent(query)}`)}
              placeholder="Buscar"
              shut={36}
              openWidth={168}
              anchor="end"
              className="shrink-0 xl:hidden"
            />

            <ThemeToggle />

            {session ? (
              <>
                <NotificationBell />
                {roles.includes("ADMIN") && (
                  <Link
                    href="/admin/dashboard"
                    aria-label="Administración"
                    title="Administración"
                    className="mv-focus hidden h-9 w-9 place-items-center rounded-full text-gold transition-colors hover:bg-gold/10 sm:grid"
                  >
                    <ShieldAlert className="h-[18px] w-[18px]" aria-hidden />
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  aria-label="Panel"
                  title="Panel"
                  className="mv-focus hidden h-9 w-9 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] md:grid"
                >
                  <LayoutDashboard className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <ProfileMenu name={session.user?.name} email={session.user?.email} />
              </>
            ) : (
              <>
                <Link href="/login" className="mv-btn mv-btn-ghost mv-btn-sm hidden md:inline-flex">
                  Iniciar sesión
                </Link>
                <Link href="/register" className="mv-btn mv-btn-primary mv-btn-sm hidden sm:inline-flex">
                  Crear cuenta
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              className="mv-focus grid h-9 w-9 place-items-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--mv-panel-hover)] lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} signedIn={!!session} />
    </>
  );
}
// creado por pato dev y askforvini
