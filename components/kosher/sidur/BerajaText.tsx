import type { SidurEntry } from "@/lib/kosher/sidur";
import { cn } from "@/lib/utils";
import { hebrewSerif } from "./hebrew-font";

/** El texto de una berajá: hebreo con nikud, transliteración y traducción, parte por parte. */
export function BerajaText({ entry, size = "md" }: { entry: SidurEntry; size?: "md" | "lg" }) {
  return (
    <div className={cn("flex flex-col", size === "lg" ? "gap-8" : "gap-6")}>
      {entry.parts.map((part, i) => (
        <div key={i} className="flex flex-col">
          {part.label && <p className="mb-2 text-sm font-semibold text-[var(--mv-gold-ink)]">{part.label}</p>}
          <p
            lang="he"
            dir="rtl"
            className={cn(
              hebrewSerif.className,
              "text-[var(--text-primary)] [text-wrap:pretty]",
              size === "lg" ? "text-[1.75rem] leading-[1.95] md:text-[2rem]" : "text-[1.5rem] leading-[1.9]",
            )}
          >
            {part.he}
          </p>
          <p className={cn("mt-3 italic text-[var(--text-primary)]", size === "lg" ? "text-[1.05rem] leading-relaxed" : "text-[0.95rem] leading-relaxed")}>{part.tr}</p>
          <p className={cn("mt-2 text-[var(--text-secondary)]", size === "lg" ? "text-base leading-relaxed" : "text-sm leading-relaxed")}>{part.es}</p>
        </div>
      ))}
    </div>
  );
}
// creado por pato dev y askforvini
