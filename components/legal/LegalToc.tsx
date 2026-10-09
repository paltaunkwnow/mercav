"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export type LegalTocItem = { id: string; num: string | null; label: string };

/**
 * Índice de un documento legal del cartel: lista con reglas, fija al costado en escritorio y plegable en el teléfono.
 * La sección que se está leyendo lleva la tinta amarilla, el color del estado de navegación en todo el sitio.
 */
export function LegalToc({ items }: { items: LegalTocItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const sheet = useRef<HTMLDetailsElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const ids = items.map((item) => item.id).join(" ");

  useEffect(() => {
    const sections = ids
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Una sección pasa a ser la actual cuando su borde superior cruza un quinto de la pantalla, debajo de la barra.
      const line = (parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0) + window.innerHeight * 0.2;
      let current: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top > line) break;
        current = section.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  // Si el índice de escritorio tiene scroll propio, la sección actual queda siempre a la vista.
  useEffect(() => {
    const box = rail.current;
    if (!box || !active || box.scrollHeight <= box.clientHeight) return;
    const link = box.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!link) return;
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top - 8;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8;
  }, [active]);

  const pick = (id: string) => {
    setActive(id);
    // Se cierra antes de que el navegador salte a la sección, así el salto se calcula sin la lista abierta.
    if (sheet.current) sheet.current.open = false;
  };

  const list = (inSheet: boolean) => (
    <ol className={cn(!inSheet && "border-t-2 border-[var(--c-line)]")}>
      {items.map((item) => {
        const on = item.id === active;
        return (
          <li key={item.id} className={cn("border-b-2 border-[var(--c-line)]", inSheet && "last:border-b-0")}>
            <a
              href={`#${item.id}`}
              aria-current={on ? "location" : undefined}
              onClick={() => pick(item.id)}
              className={cn(
                "flex min-h-11 items-baseline gap-3 rounded-[2px] px-2 py-2.5 text-[0.9375rem] leading-snug transition-colors duration-150",
                on ? "bg-[var(--c-yellow)] font-semibold text-[var(--c-on-ink)]" : "text-[var(--c-soft)] hover:text-[var(--c-text)]",
              )}
            >
              {item.num ? <span className={cn("c-num w-10 shrink-0", !on && "text-[var(--c-muted)]")}>{item.num}</span> : null}
              <span className="min-w-0">{item.label}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-label="Índice del documento" className="w-full max-w-[40rem] print:hidden lg:sticky lg:top-[calc(var(--c-nav-h)+2rem)] lg:max-w-none lg:self-start">
      <details ref={sheet} className="group border-y-2 border-[var(--c-line)] lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <span className="c-label !text-[1.3rem]">Índice</span>
          <span className="flex items-center gap-2 text-[0.9375rem] text-[var(--c-muted)]">
            <span className="c-num">{items.length} secciones</span>
            <ChevronDown className="h-5 w-5 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </span>
        </summary>
        <div className="border-t-2 border-[var(--c-line)] pb-2">{list(true)}</div>
      </details>

      <div ref={rail} className="c-scroll relative hidden lg:-m-2 lg:block lg:max-h-[calc(100svh-var(--c-nav-h)-3rem)] lg:overflow-y-auto lg:p-2">
        <p className="c-label !text-[1.3rem]">En este documento</p>
        <div className="mt-4">{list(false)}</div>
      </div>
    </nav>
  );
}
// creado por pato dev y askforvini
