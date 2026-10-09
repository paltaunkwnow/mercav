import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, ImageOff, Pencil, Plus, Trash2, type LucideIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared pieces for the marketplace modules (Ads, Services, Jobs).    */
/* Server-safe: no hooks here. Interactive bits live in ChoiceMenu.    */
/* ------------------------------------------------------------------ */

export const SPACE_TYPE_LABEL: Record<string, string> = {
  VALLA: "Valla",
  PANTALLA: "Pantalla digital",
  LETRERO: "Letrero",
  VIDRIERA: "Vidriera",
  AUTO: "Transporte",
  REVISTA: "Revista",
  PACKAGING: "Packaging",
  OTRO: "Otro soporte",
};

export const SERVICE_CATEGORY_LABEL: Record<string, string> = {
  DESARROLLO_WEB: "Desarrollo web",
  DISENO: "Diseño",
  MARKETING: "Marketing digital",
  SEO: "SEO",
  REDACCION: "Redacción",
  VIDEO: "Video y animación",
  FOTOGRAFIA: "Fotografía",
  IA: "Inteligencia artificial",
  CONSULTORIA: "Consultoría",
  OTRO: "Otro",
};

export const EMPLOYMENT_LABEL: Record<string, string> = {
  TIEMPO_COMPLETO: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  FREELANCE: "Freelance",
  PASANTIA: "Pasantía",
};

export const WORK_MODE_LABEL: Record<string, string> = {
  PRESENCIAL: "Presencial",
  REMOTO: "Remoto",
  HIBRIDO: "Híbrido",
};

export const EXPERIENCE_LABEL: Record<string, string> = {
  SIN_EXPERIENCIA: "Sin experiencia",
  JUNIOR: "Junior",
  SEMI_SENIOR: "Semi senior",
  MID: "Semi senior",
  SENIOR: "Senior",
};

/** Readable label for an enum value, falling back to a cleaned-up version of the raw value. */
export function labelFor(map: Record<string, string>, value?: string | null) {
  if (!value) return "";
  return map[value] ?? value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Money for display. Returns null when there is no amount, so callers can say so instead of printing $0. */
export function formatMoney(value: unknown, currency?: string | null) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return null;
  const amount = n.toLocaleString("es", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
  const code = (currency || "USD").toUpperCase();
  return code === "USD" ? `US$ ${amount}` : `${code} ${amount}`;
}

/** Back link used at the top of detail and form pages. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mv-focus group inline-flex h-10 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
      {children}
    </Link>
  );
}

/** Fixed-ratio media frame. Without an image it says so instead of showing a stock photo. */
export function MediaFrame({
  src,
  alt,
  ratio = "aspect-[4/3]",
  className,
  icon: Icon = ImageOff,
  emptyLabel = "Sin fotos todavía",
  priority,
  children,
}: {
  src?: string | null;
  alt: string;
  ratio?: string;
  className?: string;
  icon?: LucideIcon;
  emptyLabel?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-bg-tertiary", ratio, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_top,var(--mv-gold-wash),transparent_70%)]">
          <div className="flex flex-col items-center gap-2 text-[var(--text-tertiary)]">
            <Icon className="h-6 w-6" aria-hidden />
            <span className="text-xs font-medium">{emptyLabel}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/** Empty / no-results state. One clear next step. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  secondary,
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mv-fade flex flex-col items-center rounded-[1.75rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-16 text-center md:py-20",
        className,
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mv-h3 mt-6 max-w-md">{title}</h3>
      <p className="mv-body mt-3 max-w-md">{body}</p>
      {action || secondary ? (
        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  );
}

/** Skeleton grid while a listing loads. Same footprint as the real cards to avoid layout shift. */
export function CardSkeletonGrid({ count = 6, variant = "media" }: { count?: number; variant?: "media" | "row" }) {
  return (
    <div
      role="status"
      aria-label="Cargando publicaciones"
      className={variant === "row" ? "flex flex-col gap-3" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}
    >
      {Array.from({ length: count }).map((_, i) =>
        variant === "row" ? (
          <div key={i} className="mv-panel flex animate-pulse items-center gap-4 p-5">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-[var(--mv-panel-hover)]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 rounded-full bg-[var(--mv-panel-hover)]" />
              <div className="h-3 w-1/3 rounded-full bg-[var(--mv-panel-hover)]" />
            </div>
          </div>
        ) : (
          <div key={i} className="mv-panel animate-pulse overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--mv-panel-hover)]" />
            <div className="flex flex-col gap-3 p-5">
              <div className="h-4 w-3/4 rounded-full bg-[var(--mv-panel-hover)]" />
              <div className="h-3 w-1/2 rounded-full bg-[var(--mv-panel-hover)]" />
              <div className="mt-3 h-5 w-1/3 rounded-full bg-[var(--mv-panel-hover)]" />
            </div>
          </div>
        ),
      )}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Full-page loading state for client pages that fetch before rendering. */
export function PageLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-bg-primary pt-24">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--mv-hairline-strong)] border-t-gold" aria-hidden />
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export const textareaClass = "mv-input h-auto min-h-[9rem] resize-y py-3 leading-relaxed";

/** A titled group of fields. Renders as a panel with a heading that labels the section. */
export function FormSection({
  id,
  title,
  description,
  step,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  step?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("mv-panel p-5 sm:p-7 md:p-8", className)}>
      <div className="mb-6 flex items-start gap-4">
        {step ? (
          <span className="mv-data grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-xs font-semibold text-gold">
            {step}
          </span>
        ) : null}
        <div className="flex flex-col gap-1">
          <h2 id={id} className="mv-h3">
            {title}
          </h2>
          {description ? <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p> : null}
        </div>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Label + control + help text. Pass the control's id as htmlFor; the hint gets `${htmlFor}-hint`. */
export function Field({
  label,
  htmlFor,
  hint,
  optional,
  required,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  optional?: boolean;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <LabelTag {...(htmlFor ? { htmlFor } : {})} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-[var(--text-primary)]">
        <span>
          {label}
          {required ? (
            <span className="ml-0.5 text-gold" aria-hidden>
              *
            </span>
          ) : null}
        </span>
        {optional ? <span className="text-xs font-medium text-[var(--text-tertiary)]">Opcional</span> : null}
      </LabelTag>
      {children}
      {hint ? (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs leading-relaxed text-[var(--text-tertiary)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Accessible on/off switch. Visual only; the caller owns the state. */
export function SwitchRow({
  id,
  checked,
  onChange,
  title,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--mv-hairline)] p-4">
      <div className="flex flex-col gap-1">
        <span id={`${id}-label`} className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </span>
        {description ? (
          <span id={`${id}-desc`} className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {description}
          </span>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={onChange}
        className={cn(
          "mv-focus relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200",
          checked ? "border-gold bg-gold" : "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200 [transition-timing-function:var(--ease-out)]",
            checked ? "translate-x-[1.4rem] bg-[var(--mv-on-gold)]" : "translate-x-1 bg-[var(--text-secondary)]",
          )}
        />
      </button>
    </div>
  );
}

/** Small key/value item for spec sheets and summaries. */
export function Spec({ icon: Icon, label, value, data }: { icon?: LucideIcon; label: ReactNode; value: ReactNode; data?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] text-[var(--text-secondary)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-[var(--text-tertiary)]">{label}</dt>
        <dd className={cn("text-sm font-semibold text-[var(--text-primary)]", data && "mv-data")}>{value}</dd>
      </div>
    </div>
  );
}

/** Confirmation shown after saving, while the page redirects. */
export function SavedOverlay({ title, body }: { title: ReactNode; body: ReactNode }) {
  return (
    <div className="mv-fade fixed inset-0 z-[2000] grid place-items-center bg-black/50 p-4">
      <div role="status" aria-live="polite" className="mv-menu mv-pop flex w-full max-w-md flex-col items-center gap-4 rounded-[1.75rem] p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mv-h3">{title}</h2>
        <p className="mv-body">{body}</p>
        <p className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--mv-hairline-strong)] border-t-gold" aria-hidden />
          Volviendo a tu lista…
        </p>
      </div>
    </div>
  );
}

/** Image URL list editor for edit forms. Presentation only; the caller owns the list. */
export function ImageListEditor({
  id,
  images,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  id: string;
  images: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Imágenes cargadas">
          {images.map((url, i) => (
            <li key={url + i} className="relative">
              <MediaFrame src={url} alt={`Imagen ${i + 1}`} ratio="aspect-[4/3]" className="rounded-2xl border border-[var(--mv-hairline)]" />
              {i === 0 ? <span className="mv-chip absolute left-2 top-2 border-white/15 bg-black/60 text-white">Principal</span> : null}
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label={`Quitar imagen ${i + 1}`}
                className="mv-focus absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/60 text-white transition-colors duration-200 hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-5 text-sm text-[var(--text-secondary)]">
          Todavía no hay imágenes. La primera que agregues será la principal.
        </p>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
          Agregar imagen por URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={id}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
            className="mv-input flex-1"
          />
          <button type="button" onClick={onAdd} className="mv-btn mv-btn-secondary w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Row for the "mis-*" management lists: what it is, its state, and the three actions. */
export function ManageItem({
  media,
  title,
  viewHref,
  editHref,
  onDelete,
  active,
  activeLabel,
  inactiveLabel,
  badge,
  meta,
  extra,
}: {
  media: ReactNode;
  title: string;
  viewHref: string;
  editHref: string;
  onDelete: () => void;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  badge?: ReactNode;
  meta: ReactNode[];
  extra?: ReactNode;
}) {
  return (
    <li className="mv-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
        <div className="w-24 shrink-0 overflow-hidden rounded-2xl sm:w-32">{media}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "mv-chip",
                active ? "border-emerald-500/30 text-emerald-500" : "text-[var(--text-tertiary)]",
              )}
            >
              <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-[var(--text-tertiary)]")} />
              {active ? activeLabel : inactiveLabel}
            </span>
            {badge}
          </div>
          <h2 className="truncate font-display text-base font-semibold tracking-tight text-[var(--text-primary)] sm:text-lg">
            <Link href={viewHref} className="mv-focus rounded-md hover:text-gold">
              {title}
            </Link>
          </h2>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] sm:text-sm">
            {meta.filter(Boolean).map((m, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {m}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--mv-hairline)] pt-3 sm:border-0 sm:pt-0">
        {extra}
        <Link href={viewHref} target="_blank" title="Ver publicación" className="mv-btn mv-btn-ghost mv-btn-sm flex-1 px-3 sm:flex-none">
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span className="sm:sr-only">Ver</span>
        </Link>
        <Link href={editHref} title="Editar" className="mv-btn mv-btn-ghost mv-btn-sm flex-1 px-3 sm:flex-none">
          <Pencil className="h-4 w-4" aria-hidden />
          <span className="sm:sr-only">Editar</span>
        </Link>
        <button type="button" onClick={onDelete} title="Eliminar" className="mv-btn mv-btn-ghost mv-btn-sm flex-1 px-3 text-red-500 sm:flex-none">
          <Trash2 className="h-4 w-4" aria-hidden />
          <span className="sm:sr-only">Eliminar</span>
        </button>
      </div>
    </li>
  );
}

// creado por pato dev y askforvini
