"use client";

import Link from "next/link";
import { Search, Bell, Menu, User, Rss, LogOut, Settings, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname?.includes('/pos') || pathname?.includes('/admin')) return null;

  return (
    <header className="fixed top-0 z-[100] w-full border-b border-border bg-bg-primary/80 backdrop-blur-xl transition-all duration-500 section-transition">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="MERCAV" className="h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
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
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-300 ${
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
              <Link href="/feed" className="text-sm font-medium text-gold hover:text-gold-light transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gold/5">
                <Rss className="h-3.5 w-3.5" />
                Feed
              </Link>
            )}
            <Link href="/inversores" className="text-sm font-medium text-gold/80 hover:text-gold transition-colors px-3 py-2 rounded-lg hover:bg-gold/5">Inversores</Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/buscar" className="hidden md:flex items-center gap-2 w-52 h-9 px-3 rounded-xl bg-bg-tertiary/50 border border-border text-sm text-gray-400 hover:border-gold/30 hover:text-white transition-all duration-300 backdrop-blur-sm">
            <Search className="h-4 w-4 text-gray-500" />
            <span>Buscar en Mercav...</span>
          </Link>

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
                <Button asChild variant="ghost" className="hidden md:flex text-gray-300 hover:text-white text-sm rounded-xl">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild className="hidden md:flex bg-gold text-black hover:bg-gold-light rounded-xl h-9 px-5 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-gold/20 hover:scale-105">
                  <Link href="/register">Empezar gratis</Link>
                </Button>
              </>
            )}
            <Button asChild variant="ghost" size="icon" className="md:hidden text-gray-400 rounded-xl">
              <Link href="/buscar"><Search className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
