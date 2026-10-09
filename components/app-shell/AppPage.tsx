import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "@/components/icons";
import { Container } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

/**
 * Página interna de app.mercav.lat. Deja el aire para el header flotante arriba y la barra de
 * apartados abajo en el celular, y pone un encabezado compacto de app (no el hero de marketing).
 */
export function AppPage({
  title,
  kicker,
  lead,
  actions,
  back,
  tabs,
  children,
  width = "default",
  className,
}: {
  title: ReactNode;
  kicker?: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  /** Navegación secundaria del apartado (por ejemplo, las pestañas de Business). */
  tabs?: ReactNode;
  children: ReactNode;
  width?: "default" | "wide" | "narrow";
  className?: string;
}) {
  return (
    <div className={cn("w-full pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32", className)}>
      <Container width={width}>
        <header className="flex flex-col gap-4">
          {back ? (
            <Link
              href={back.href}
              className="mv-focus -ml-1 inline-flex w-fit items-center gap-1 rounded-full py-1 pl-1 pr-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {back.label}
            </Link>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              {kicker ? <p className="mv-kicker">{kicker}</p> : null}
              <h1 className="font-display text-[1.9rem] font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-[2.4rem]">
                {title}
              </h1>
              {lead ? <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">{lead}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
          </div>
          {tabs ? <div className="-mx-1 overflow-x-auto px-1 pb-1">{tabs}</div> : null}
        </header>
        <div className="mt-8">{children}</div>
      </Container>
    </div>
  );
}

/** Pestañas segmentadas de un apartado, estilo app. Cada item es un link. */
export function AppTabs({
  items,
  active,
}: {
  items: { href: string; label: string; key: string }[];
  active: string;
}) {
  return (
    <nav aria-label="Secciones" className="inline-flex min-w-max items-center gap-1 rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-1">
      {items.map((item) => {
        const on = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "mv-focus inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold transition-colors",
              on ? "bg-gold text-[var(--mv-on-gold)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
// creado por pato dev y askforvini
