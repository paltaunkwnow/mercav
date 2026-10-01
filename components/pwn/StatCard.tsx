import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { formatCount } from "@/components/pwn/format";

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: number | null;
  hint?: string;
  icon?: ReactNode;
  href?: string;
}) {
  const known = value !== null && value !== undefined;
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
          {icon ? <span className="text-gold">{icon}</span> : null}
          {label}
        </h3>
        {href ? (
          <ArrowUpRight
            className="h-4 w-4 text-[var(--text-tertiary)] transition-colors duration-200 group-hover:text-gold"
            aria-hidden
          />
        ) : null}
      </div>
      <p
        className={`mt-4 font-display text-4xl font-semibold tracking-tight tabular-nums ${known ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}
        aria-label={known ? undefined : "sin dato"}
      >
        {known ? formatCount(value) : "—"}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="mv-panel mv-panel-interactive mv-focus group block rounded-[1.5rem] p-5">
        {body}
      </Link>
    );
  }
  return <article className="mv-panel rounded-[1.5rem] p-5">{body}</article>;
}
// creado por pato dev y askforvini
