"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, MessageSquare, User, Rss, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.includes('/pos') || pathname?.includes('/admin')) return null;

  const navItems = [
    { icon: Home, label: "Inicio", href: "/" },
    { icon: Rss, label: "Feed", href: "/feed" },
    { icon: PlusSquare, label: "Publicar", href: "/publicar" },
    { icon: MessageSquare, label: "Mensajes", href: "/mensajes" },
    { icon: User, label: "Perfil", href: "/perfil" },
    { icon: Shield, label: "Pwn", href: "/pwn" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/90 backdrop-blur-xl border-t border-border pb-safe section-transition">
      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 relative",
                isActive ? "text-gold" : "text-gray-400 hover:text-gray-300"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-full" />
              )}
              <Icon className={cn(
                "h-5 w-5 transition-all duration-300",
                isActive && "fill-gold/20 scale-110 drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
              )} />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300",
                isActive && "font-bold text-gold"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
