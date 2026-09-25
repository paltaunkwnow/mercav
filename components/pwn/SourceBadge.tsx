import { focusRing } from "@/components/pwn/format";

export function SourceBadge({ source, href }: { source?: string | null; href?: string | null }) {
  const name = source?.trim() || "Fuente no indicada";
  const className = `inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-300 ${focusRing}`;
  const content = (
    <>
      <span className="sr-only">Fuente: </span>
      <span className="truncate">{name}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${className} hover:border-gold/40 hover:text-gold`}>
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}
// creado por pato dev y askforvini
