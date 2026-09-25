"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, User, Rss, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SeekField } from "@/components/motion/SeekField";

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

        <nav className="scrollbar-hide hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex" aria-label="Secciones">
            {[
              { href: "/anuncios", label: "Anuncios" },
              { href: "/servicios", label: "Servicios" },
              { href: "/empleos", label: "Empleos" },
              { href: "/herramientas", label: "Tools" },
              { href: "/pwn", label: "Pwn" },
            ].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-all duration-300 xl:px-3 ${
                    isActive 
                      ? 'text-gold bg-gold/5' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {session && (
              <Link href="/feed" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/5 hover:text-gold-light xl:px-3">
                <Rss className="h-3.5 w-3.5" />
                Feed
              </Link>
            )}
            <Link href="/inversores" className="shrink-0 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-gold/80 transition-colors hover:bg-gold/5 hover:text-gold xl:px-3">Inversores</Link>
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
                <Button asChild className="hidden md:flex bg-bg-tertiary/50 border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold transition-all rounded-xl h-9 px-4 text-sm font-medium backdrop-blur-sm">
                  <Link href="/perfil">
                    <User className="h-4 w-4 mr-1.5" />
                    Mi Perfil
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button asChild variant="ghost" className="hidden shrink-0 rounded-xl text-sm text-gray-300 hover:text-white md:inline-flex">
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
// creado por Patodev y Invertilo
