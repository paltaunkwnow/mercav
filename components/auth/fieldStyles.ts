import { focusRing } from "@/components/pwn/format";

/** Auth forms — soft fields (dark + light), aligned with Mercav Pwn inputs. */
const authFieldBase = [
  "h-12 w-full rounded-xl border text-sm",
  "border-border bg-bg-tertiary text-[var(--text-primary)]",
  "placeholder:text-[var(--text-tertiary)]",
  "transition-[border-color,box-shadow] hover:border-gold/30",
  "focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15",
  focusRing,
].join(" ");

export const authFieldClass = `${authFieldBase} pl-11 pr-4`;

export const authFieldClassPlain = `${authFieldBase} px-4`;

export const authFieldClassTrailing = `${authFieldBase} pl-11 pr-11`;

export const authLabelClass = "block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]";

export const authLabelClassSpaced = `${authLabelClass} mb-2`;

export const authCardClass =
  "relative overflow-hidden rounded-3xl border border-border bg-bg-secondary/80 p-8 shadow-lg md:p-10";
// creado por pato dev y askforvini
