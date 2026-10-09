import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { FOUNDERS } from "@/lib/data/team";
import { cn } from "@/lib/utils";

/**
 * El equipo como renglones del cartel: el nombre en letra de afiche y el cargo al lado. Vinicius Salazar va primero
 * y marcado como fundador. Es la única prueba que muestra el sitio (Quiénes somos, Pitch e Inversores).
 */
export function FounderRoll({ size = "md", className, label = "Equipo de Mercav" }: { size?: "md" | "lg"; className?: string; label?: string }) {
  const nameSize = size === "lg" ? "text-[clamp(2.25rem,1.3rem+3.6vw,4.75rem)]" : "text-[clamp(1.85rem,1.5rem+1.2vw,2.5rem)]";
  const rowCls = cn("flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2", size === "lg" ? "py-5 md:py-7" : "py-4");

  return (
    <ul aria-label={label} className={cn("border-t-2 border-[var(--c-line)]", className)}>
      {FOUNDERS.map((f) => {
        const row = (
          <>
            <span className="flex min-w-0 flex-col gap-1">
              <span className={cn("c-display leading-[0.92] transition-colors duration-150", nameSize, f.lead && "c-text-yellow", f.profile && "group-hover:text-[var(--c-yellow-text)]")}>
                {f.name}
              </span>
              {f.note ? <span className="text-[0.95rem] text-[var(--c-soft)]">{f.note}</span> : null}
            </span>
            <span className="c-label flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[1rem] text-[var(--c-muted)]">
              {f.role}
              {f.profile ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--c-text)]">
                  Ver perfil
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
            </span>
          </>
        );
        return (
          <li key={f.name} className="border-b-2 border-[var(--c-line)]">
            {f.profile ? (
              <Link href={f.profile} className={cn("group rounded-[2px]", rowCls)}>
                {row}
              </Link>
            ) : (
              <div className={rowCls}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
// creado por pato dev y askforvini
