"use client";

import { usePathname } from "next/navigation";
import { HostLink } from "@/components/layout/HostContext";
import { privacyPath } from "@/components/privacy/site";
import { productBySlug } from "@/lib/privacy/catalog";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/billeteras-frias", label: "Billeteras frías", short: "Billeteras" },
  { to: "/celulares", label: "Celulares", short: "Celulares" },
  { to: "/instalacion", label: "Instalación", short: "Instalación" },
  { to: "/pagos", label: "Pagos", short: "Pagos" },
];

/** La ruta de la tienda sin el prefijo: en privacy.mercav.lat el navegador ya no lo muestra. */
function storePath(pathname: string | null) {
  const path = (pathname ?? "/").replace(/^\/privacy(?=\/|$)/, "") || "/";
  return path.replace(/\/+$/, "") || "/";
}

/** La sección a la que pertenece la página: la ficha de un producto cae en su categoría. */
function section(path: string) {
  const slug = path.match(/^\/producto\/([^/]+)/)?.[1];
  const product = slug ? productBySlug(slug) : null;
  return product ? `/${product.category}` : path;
}

/** Navegación de Mercav Privacy. En el teléfono va en su propio renglón, con los nombres cortos. */
export function PrivacyNav({ compact, className }: { compact?: boolean; className?: string }) {
  const current = storePath(usePathname());
  const within = section(current);
  return (
    <nav aria-label="Tienda" className={className}>
      <ul className={cn("flex items-center", compact ? "c-scroll gap-[clamp(0.75rem,4.5vw,1.25rem)] overflow-x-auto px-1 py-1 -mx-1" : "gap-1")}>
        {LINKS.map((l) => {
          const active = within === l.to;
          return (
            <li key={l.to}>
              <HostLink
                href={privacyPath(l.to)}
                aria-current={current === l.to ? "page" : undefined}
                className={cn(
                  "c-label inline-flex rounded-[2px] py-2 underline-offset-[0.35em] transition-colors duration-150",
                  compact ? "whitespace-nowrap text-[clamp(0.95rem,4.4vw,1.05rem)]" : "px-2.5 text-[1.15rem]",
                  active ? "text-[var(--c-text)] underline decoration-[3px]" : "text-[var(--c-soft)] hover:text-[var(--c-text)]",
                )}
              >
                {compact ? l.short : l.label}
              </HostLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
// creado por pato dev y askforvini
