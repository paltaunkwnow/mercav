import type { ReactNode } from "react";
import { PageIntro } from "@/components/privacy/blocks";
import { cn } from "@/lib/utils";

/*
 * Páginas de lectura de Mercav Privacy (pagos, envíos, garantía, términos, privacidad): el titular arriba y cada
 * tema en su renglón, con el título a la izquierda y el texto con renglón cómodo a la derecha.
 */

export function DocPage({ id, title, lead, children }: { id: string; title: ReactNode; lead?: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageIntro id={id} title={title} lead={lead} />
      <div className="c-container pb-20 md:pb-28">
        <div className="border-b-2 border-[var(--c-line)]">{children}</div>
      </div>
    </>
  );
}

export function DocSection({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 border-t-2 border-[var(--c-line)] py-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-12 md:py-10", className)}>
      <h2 className="c-h3">{title}</h2>
      <div className="c-read min-w-0">{children}</div>
    </section>
  );
}
// creado por pato dev y askforvini
