import { ArrowUpRight } from "lucide-react";
import { focusRing } from "@/components/pwn/format";

export function SourceBadge({ source, href }: { source?: string | null; href?: string | null }) {
  const name = source?.trim() || "Fuente no indicada";
  const className = `inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] px-2.5 text-[11px] font-medium leading-none text-[var(--text-secondary)] ${focusRing}`;
  const content = (
    <>
      <span aria-hidden className="text-[var(--text-tertiary)]">Fuente</span>
      <span className="sr-only">Fuente: </span>
      <span className="truncate font-semibold text-[var(--text-primary)]">{name}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${className} transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-gold`}
      >
        {content}
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
        <span className="sr-only"> (abre en otra pestaña)</span>
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}
// creado por pato dev y askforvini
