"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, User, Rss, LayoutDashboard, ShieldAlert, Settings, LogOut, Edit3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SeekField } from "@/components/motion/SeekField";

function ProfileMenu({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 12 });

  const updatePos = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 10,
      right: Math.max(12, window.innerWidth - r.right),
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onDown);
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onDown);
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
        className="inline-flex h-9 shrink-0 items-center rounded-xl border border-gold/40 bg-bg-tertiary/50 px-3 text-sm font-medium text-gold outline-none transition-all hover:border-gold hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold"
      >
        <User className="mr-1.5 h-4 w-4" />
        Mi Perfil
        <ChevronDown className={`ml-1 h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Ajustes del perfil"
            className="fixed z-[200] w-[252px] rounded-2xl border border-white/10 bg-bg-secondary p-1.5 text-[var(--text-primary)] shadow-2xl"
            style={{ top: pos.top, right: pos.right }}
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{name || "Cuenta"}</p>
              {email && <p className="truncate text-xs font-normal text-[var(--text-secondary)]">{email}</p>}
            </div>
            <div className="my-1 h-px bg-white/10" />
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
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/8"
                >
                  <Icon className="h-4 w-4 text-gold" />
                  {item.label}
                </button>
              );
            })}
            <div className="my-1 h-px bg-white/10" />
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  if (pathname?.includes('/pos') || pathname?.includes('/admin')) return null;

  return (
    <header className="liquid-glass liquid-glass-lens fixed top-3 left-3 right-3 z-[100] mx-auto max-w-7xl rounded-full transition-all duration-500 section-transition">
      <div className="container mx-auto flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold" aria-label="Mercav, inicio">
          <img src="/images/logo.png" alt="" className="h-9 w-9 object-contain" width={36} height={36} />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex" aria-label="Secciones">
          {[
            { href: "/anuncios", label: "Anuncios" },
            { href: "/servicios", label: "Servicios" },
            { href: "/empleos", label: "Empleos" },
            { href: "/herramientas", label: "Tools" },
            { href: "/pwn", label: "Pwn" },
            { href: "/kosher", label: "Kosher" },
            ...(session ? [{ href: "/feed", label: "Feed", icon: Rss }] : []),
            { href: "/inversores", label: "Inversores" },
          ].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = "icon" in item ? item.icon : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-semibold tracking-tight transition-colors duration-300 xl:px-2.5 ${
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-[var(--text-primary)]/78 hover:bg-white/8 hover:text-[var(--text-primary)]"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
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
            className="hidden shrink-0 md:block"
          />

          {/* Theme Toggle */}
          <ThemeToggle />

          <div className="flex items-center gap-1.5">
            {session ? (
              <>
                <NotificationBell />
                {(session.user as any).roles?.includes("ADMIN") && (
                  <Button asChild variant="ghost" size="icon" className="text-gold hover:text-gold-light hover:bg-gold/5 rounded-xl" title="Admin Dashboard">
                    <Link href="/admin/dashboard">
                      <ShieldAlert className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="icon" className="hidden md:flex text-gray-400 hover:text-gold hover:bg-gold/5 rounded-xl">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                </Button>
                <ProfileMenu name={session.user?.name} email={session.user?.email} />
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button asChild variant="ghost" className="hidden shrink-0 rounded-xl text-sm font-semibold text-[var(--text-primary)]/80 hover:bg-white/8 hover:text-[var(--text-primary)] md:inline-flex">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild className="hidden h-9 shrink-0 rounded-xl bg-gold px-3 text-sm font-semibold text-black transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20 sm:inline-flex xl:px-5">
                  <Link href="/register">Empezar gratis</Link>
                </Button>
              </>
            )}
            <SeekField
              value={search}
              onValueChange={setSearch}
              onSubmit={(query) => router.push(`/buscar?q=${encodeURIComponent(query)}`)}
              placeholder="Buscar"
              shut={36}
              openWidth={168}
              anchor="end"
              className="shrink-0 md:hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
// creado por pato dev y askforvini
