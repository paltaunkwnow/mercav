import { ArrowUpRight } from "@/components/icons";
import { parseAlertBody } from "@/lib/pwn/alert-body";
import { focusRing } from "@/components/pwn/format";

/** Cuerpo de una alerta con sus saltos de línea, la recomendación como lista y los enlaces que se pueden abrir. */
export function AlertBody({ body, compact = false }: { body: string | null; compact?: boolean }) {
  const view = parseAlertBody(body);
  if (!view.paragraphs.length && !view.steps.length && !view.links.length) return null;
  return (
    <div className={compact ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
      {view.paragraphs.map((line, index) => (
        <p key={`${index}-${line.slice(0, 24)}`} className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {line}
        </p>
      ))}
      {view.steps.length ? (
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">Qué hacer</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:text-gold">
            {view.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {view.links.length ? (
        <ul className="flex flex-wrap gap-2">
          {view.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`mv-link inline-flex min-h-11 items-center gap-1 text-sm ${focusRing}`}
              >
                Abrir en {link.label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only"> (abre en otra pestaña)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
