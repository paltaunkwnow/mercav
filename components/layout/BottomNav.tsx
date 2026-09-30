"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, MessageSquare, User, Rss, Shield, Map, MessagesSquare, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MERCAV_ITEMS = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: Rss, label: "Feed", href: "/feed" },
  { icon: PlusSquare, label: "Publicar", href: "/publicar" },
  { icon: MessageSquare, label: "Mensajes", href: "/mensajes" },
  { icon: User, label: "Perfil", href: "/perfil" },
  { icon: Shield, label: "Pwn", href: "/pwn" },
];

const KOSHER_ITEMS = [
  { icon: Star, label: "Kosher", href: "/kosher" },
  { icon: Map, label: "Mapa", href: "/kosher/mapa" },
  { icon: MessagesSquare, label: "Chat", href: "/kosher/chat" },
  { icon: Users, label: "Kehilot", href: "/kosher/comunidades" },
  { icon: User, label: "Perfil", href: "/kosher/perfil" },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.includes("/pos") || pathname?.includes("/admin")) return null;

  const kosher = pathname === "/kosher" || pathname?.startsWith("/kosher/");
  const navItems = kosher ? KOSHER_ITEMS : MERCAV_ITEMS;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="liquid-glass liquid-glass-lens pointer-events-auto flex max-w-full items-center gap-1 rounded-full px-1.5 py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center justify-center rounded-full transition-colors",
                isActive ? "px-3 text-black" : "w-11 text-[var(--text-primary)]/75"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={kosher ? "kosher-icon-bar" : "mercav-icon-bar"}
                  className="absolute inset-0 rounded-full bg-gold"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative z-10 h-5 w-5" />
              {isActive && (
                <span className="relative z-10 ml-1.5 text-[11px] font-semibold">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
// creado por pato dev y askforvini
