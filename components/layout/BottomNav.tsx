"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppPathname, useHostKind } from "@/components/layout/HostContext";
import { Home, User, Map, MessagesSquare, Users, Plus } from "@/components/icons";
import { ModuleGlyph } from "@/components/icons/ModuleGlyph";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { cn } from "@/lib/utils";
import { activeSectionKey } from "@/lib/app/sections";
import { APP_HOME, hostHref } from "@/lib/seo/site";
import { hidesGlobalChrome, isSiteChrome } from "@/components/layout/Header";
import type { ReactNode } from "react";

type Item = { key: string; label: string; href: string; icon: ReactNode; create?: boolean };

/** La barra de la app en el celular, igual a la de los celulares de la portada: cuatro apartados y "Publicar" al centro. */
const APP_ITEMS: Item[] = [
  { key: "inicio", label: "Inicio", href: APP_HOME, icon: <Home className="h-[22px] w-[22px]" aria-hidden /> },
  { key: "business", label: "Business", href: "/business", icon: <ModuleGlyph name="business" size={22} /> },
  { key: "publicar", label: "Publicar", href: "/publicar", icon: <Plus className="h-6 w-6" aria-hidden />, create: true },
  { key: "calendario", label: "Calendario", href: "/calendario", icon: <ModuleGlyph name="calendario" size={22} /> },
  { key: "perfil", label: "Perfil", href: "/perfil", icon: <User className="h-[22px] w-[22px]" aria-hidden /> },
];

const KOSHER_ITEMS: Item[] = [
  { key: "kosher", label: "Kosher", href: "/kosher", icon: <StarOfDavid className="h-[22px] w-[22px]" /> },
  { key: "mapa", label: "Mapa", href: "/kosher/mapa", icon: <Map className="h-[22px] w-[22px]" aria-hidden /> },
  { key: "chat", label: "Chat", href: "/kosher/chat", icon: <MessagesSquare className="h-[22px] w-[22px]" aria-hidden /> },
  { key: "kehilot", label: "Kehilot", href: "/kosher/comunidades", icon: <Users className="h-[22px] w-[22px]" aria-hidden /> },
  { key: "perfil", label: "Perfil", href: "/kosher/perfil", icon: <User className="h-[22px] w-[22px]" aria-hidden /> },
];

export function BottomNav() {
  const pathname = usePathname();
  // On kosher.mercav.lat the browser path is /mapa while the route is /kosher/mapa.
  const appPath = useAppPathname();
  const hostKind = useHostKind();
  // El sitio público (mercav.lat) no lleva barra inferior: solo la app y Kosher.
  if (hidesGlobalChrome(pathname) || isSiteChrome(hostKind, pathname)) return null;

  const kosher = hostKind === "kosher" || appPath === "/kosher" || !!appPath?.startsWith("/kosher/");
  const items = kosher ? KOSHER_ITEMS : APP_ITEMS;
  const activeKey = kosher ? null : activeSectionKey(appPath);

  return (
    <nav
      aria-label={kosher ? "Mercav Kosher" : "Apartados de la app"}
      className={cn(
        "fixed z-50 md:hidden left-[max(0.75rem,env(safe-area-inset-left,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        kosher && "k-world",
      )}
    >
      <ul className="mx-auto flex h-[3.75rem] max-w-md items-center justify-around rounded-[1.25rem] bg-[var(--mv-panel)] px-1 shadow-[0_0_0_1px_var(--mv-hairline),0_18px_40px_-16px_rgba(0,0,0,0.55)]">
        {items.map((item) => {
          // Kosher items are same-host here (kosher.mercav.lat/mapa or /kosher/mapa in dev), so next/link is fine.
          const href = hostHref(item.href, hostKind);
          const isActive = kosher ? appPath === item.href || pathname === href : activeKey === item.key;
          return (
            <li key={item.key}>
              <Link
                href={href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "mv-icon-host grid place-items-center rounded-full transition-[color,scale] duration-150 active:scale-90",
                  item.create
                    ? "h-11 w-11 bg-gold text-[var(--mv-on-gold)]"
                    : cn(
                        "h-11 w-11",
                        isActive
                          ? kosher
                            ? "text-[var(--k-accent)]"
                            : "text-[var(--mv-gold-ink)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                      ),
                )}
              >
                {item.icon}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
// creado por pato dev y askforvini
