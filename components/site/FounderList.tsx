import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { FOUNDERS } from "@/lib/data/team";
import { cn } from "@/lib/utils";

/** The Mercav team as a grouped inset list. Content layer: standard panel, never glass. */
export function FounderList({ className, label = "Equipo" }: { className?: string; label?: string }) {
  return (
    <div className={className}>
      <p className="mb-3 px-1 text-sm font-semibold text-[var(--text-secondary)]">{label}</p>
      <ul className="mv-panel overflow-hidden rounded-[1.5rem]">
        {FOUNDERS.map((f, i) => {
          const body = (
            <>
              <span
                aria-hidden
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] font-display text-[0.9375rem] font-semibold text-[var(--text-primary)]"
              >
                {f.initials}
              </span>
              <span className={cn("flex min-w-0 flex-1 items-center gap-3 py-4 pr-5", i > 0 && "border-t border-[var(--mv-hairline)]")}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold text-[var(--text-primary)]">{f.name}</span>
                  <span className="block text-sm text-[var(--text-secondary)]">{f.role}</span>
                </span>
                {f.profile ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-sm text-[var(--text-tertiary)]">
                    Perfil <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                ) : null}
              </span>
            </>
          );
          return (
            <li key={f.name}>
              {f.profile ? (
                <Link
                  href={f.profile}
                  className="mv-focus flex items-center gap-4 pl-5 transition-colors duration-150 hover:bg-[var(--mv-panel-hover)] active:bg-[var(--mv-panel-hover)]"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-4 pl-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
// creado por pato dev y askforvini
