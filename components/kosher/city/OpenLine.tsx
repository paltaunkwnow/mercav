import { cn } from "@/lib/utils";

export type OpenInfo = { open: boolean | null; text: string };

/** "Abierto · cierra 23:00" con un punto. El texto dice el estado; el color solo acompaña. Sirve en servidor y en cliente. */
export function OpenLine({ info, className }: { info: OpenInfo; className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        info.open ? "text-[#5ff09a] [.light_&]:text-[#00773f]" : "text-[var(--text-secondary)]",
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", info.open ? "bg-current" : "bg-[var(--text-tertiary)]")} />
      {info.text}
    </span>
  );
}
// creado por pato dev y askforvini
