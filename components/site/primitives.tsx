import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/site/Reveal";

export { Reveal };

type Tone = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const toneClass: Record<Tone, string> = {
  primary: "mv-btn-primary",
  secondary: "mv-btn-secondary",
  ghost: "mv-btn-ghost",
};
const sizeClass: Record<Size, string> = { sm: "mv-btn-sm", md: "", lg: "mv-btn-lg" };

export function buttonClass(tone: Tone = "primary", size: Size = "md", className?: string) {
  return cn("mv-btn", toneClass[tone], sizeClass[size], className);
}

/** Link styled as a Mercav action. One primary per view. */
export function ButtonLink({
  tone = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { tone?: Tone; size?: Size }) {
  return <Link {...props} className={buttonClass(tone, size, className)} />;
}

export function Container({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "wide" | "narrow";
}) {
  return (
    <div className={cn("mv-container", width === "wide" && "mv-container-wide", width === "narrow" && "mv-container-narrow", className)}>
      {children}
    </div>
  );
}

/** Vertical rhythm for page sections. `tone="raised"` hands off with the brand blend. */
export function Section({
  children,
  className,
  tone = "base",
  tight,
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  tone?: "base" | "raised";
  tight?: boolean;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "mv-section w-full",
        tight && "mv-section-tight",
        tone === "raised" ? "blend-from-primary blend-to-primary bg-bg-secondary" : "bg-bg-primary",
        className,
      )}
    >
      <div className="relative z-[2]">{children}</div>
    </section>
  );
}

/** Heading block for a section: optional kicker, title, lead. Left-aligned by default. */
export function SectionHeading({
  id,
  kicker,
  title,
  lead,
  align = "start",
  action,
  className,
  as: Heading = "h2",
}: {
  id?: string;
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  const center = align === "center";
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6",
        center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-4", center && "items-center")}>
        {kicker ? <p className="mv-kicker">{kicker}</p> : null}
        <Heading id={id} className={cn(Heading === "h1" ? "mv-h1" : "mv-h2", "max-w-3xl")}>
          {title}
        </Heading>
        {lead ? <p className={cn("mv-lead", center && "mx-auto")}>{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}

/** Standard hero for interior pages (listings, info, legal, account). Pages with a product story build their own. */
export function PageHero({
  kicker,
  title,
  lead,
  actions,
  aside,
  children,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative w-full overflow-hidden pb-10 pt-28 md:pb-14 md:pt-36", className)}>
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <div className={cn("grid gap-10", aside && "lg:grid-cols-[1.2fr_0.8fr] lg:items-end")}>
          <div className="flex flex-col gap-5">
            {kicker ? <p className="mv-kicker">{kicker}</p> : null}
            <h1 className="mv-h1 max-w-4xl">{title}</h1>
            {lead ? <p className="mv-lead">{lead}</p> : null}
            {actions ? <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
        {children ? <div className="mt-10">{children}</div> : null}
      </Container>
    </header>
  );
}

export function Panel({
  children,
  className,
  interactive,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "li" | "section";
}) {
  return <Tag className={cn("mv-panel", interactive && "mv-panel-interactive", className)}>{children}</Tag>;
}

/** Liquid Glass surface. Use for floating UI, hero showcases and the one highlighted block per section. */
export function GlassPanel({
  children,
  className,
  lens,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  lens?: boolean;
  as?: "div" | "article" | "section" | "aside";
}) {
  return <Tag className={cn("liquid-glass rounded-[1.75rem]", lens && "liquid-glass-lens", className)}>{children}</Tag>;
}

/** Final call to action. One action, one sentence. */
export function CTABand({
  title,
  lead,
  action,
  note,
}: {
  title: ReactNode;
  lead?: ReactNode;
  action: ReactNode;
  note?: ReactNode;
}) {
  return (
    <Section>
      <Container>
        <Reveal>
          <div className="liquid-glass relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-10 md:rounded-[2.5rem] md:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-3xl rounded-full bg-gold/15 blur-[90px]" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="mv-h2">{title}</h2>
              {lead ? <p className="mv-lead mx-auto">{lead}</p> : null}
              <div className="mt-3 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">{action}</div>
              {note ? <p className="text-xs text-[var(--text-tertiary)]">{note}</p> : null}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Small factual figure. Only for real numbers; render nothing when the number is unknown. */
export function Fact({ value, label, className }: { value: ReactNode; label: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse gap-1", className)}>
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums md:text-4xl">{value}</dd>
    </div>
  );
}
// creado por pato dev y askforvini
