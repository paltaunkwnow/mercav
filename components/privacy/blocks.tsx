import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowLeft, ArrowRight, Mail, MessageCircle, Plus } from "@/components/icons";
import { HostLink } from "@/components/layout/HostContext";
import { SUPPORT_EMAIL, mailtoHref, privacyPath, whatsappHref } from "@/components/privacy/site";
import { cn } from "@/lib/utils";

/* Piezas comunes de las páginas de Mercav Privacy, en el cartel en blanco y negro (.c-mono). */

/** Datos estructurados de la página. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Link interno de la tienda: recibe la ruta sin /privacy ("/celulares"). */
export function PLink({ to, children, ...rest }: Omit<ComponentPropsWithoutRef<"a">, "href"> & { to: string }) {
  return (
    <HostLink href={privacyPath(to)} {...rest}>
      {children}
    </HostLink>
  );
}

/**
 * Cómo pedir (o preguntar): WhatsApp si hay número configurado; si no, el correo de soporte.
 * `ask` cambia los textos para una consulta en vez de un pedido.
 */
export function OrderCTA({
  product,
  ask,
  tone = "default",
  className,
}: {
  product?: { name: string };
  ask?: boolean;
  tone?: "default" | "ink";
  className?: string;
}) {
  const btn = cn("c-btn", tone === "ink" && "c-btn-ink");
  const subject = ask ? "Consulta sobre Mercav Privacy" : product ? `Pedido: ${product.name}` : "Pedido en Mercav Privacy";
  const mail = (
    <a href={mailtoHref(subject)} className="c-link text-[var(--c-text)]">
      {SUPPORT_EMAIL}
    </a>
  );
  const wa = whatsappHref(
    ask ? "Hola, tengo una consulta sobre Mercav Privacy." : product ? `Hola, quiero pedir: ${product.name}.` : "Hola, quiero hacer un pedido en Mercav Privacy.",
  );
  if (wa) {
    return (
      <div className={cn("flex flex-col items-start gap-3", className)}>
        <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
          <MessageCircle className="h-5 w-5" aria-hidden />
          {ask ? "Escribinos por WhatsApp" : product ? "Pedilo por WhatsApp" : "Pedí por WhatsApp"}
          <span className="sr-only"> (se abre WhatsApp)</span>
        </a>
        <p className="text-[0.95rem] leading-relaxed text-[var(--c-soft)]">O escribinos a {mail}.</p>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      <a href={mailtoHref(subject)} className={btn}>
        <Mail className="h-5 w-5" aria-hidden />
        {ask ? "Escribinos" : product ? "Pedilo por correo" : "Pedí por correo"}
      </a>
      <p className="max-w-[30rem] text-[0.95rem] leading-relaxed text-[var(--c-soft)]">
        {ask ? (
          <>Escribinos a {mail} y te respondemos.</>
        ) : (
          <>
            Escribinos a {mail} con {product ? "el producto" : "lo que querés"} y tu ciudad: te respondemos con el total y cómo pagar.
          </>
        )}
      </p>
    </div>
  );
}

/** La aclaración que va en toda página que habla del sistema. */
export function GrapheneNote({ className }: { className?: string }) {
  return (
    <p className={cn("max-w-[44rem] text-[0.95rem] leading-relaxed text-[var(--c-muted)]", className)}>
      No somos parte del proyecto GrapheneOS ni lo representamos: instalamos su versión oficial firmada, sin modificaciones.
    </p>
  );
}

/** Encabezado de una página interior: volver, titular y bajada. */
export function PageIntro({
  id,
  title,
  lead,
  back,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  back?: { to: string; label: string };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("c-container pb-12 pt-10 md:pb-16 md:pt-16", className)}>
      {back ? (
        <PLink to={back.to} className="mb-6 inline-flex items-center gap-2 rounded-[2px] text-[0.95rem] font-semibold text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {back.label}
        </PLink>
      ) : null}
      <h1 id={id} className="c-display max-w-[16ch] text-[clamp(3rem,1.6rem+5.6vw,6rem)] [text-wrap:balance]">
        {title}
      </h1>
      {lead ? <p className="c-lead mt-6">{lead}</p> : null}
      {children}
    </header>
  );
}

/** Link con flecha, para seguir a otra página. */
export function MoreLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <PLink to={to} className={cn("c-link inline-flex w-fit items-center gap-2 text-[1.0625rem] font-semibold text-[var(--c-text)]", className)}>
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </PLink>
  );
}

/** Preguntas con su FAQPage. Las respuestas son texto plano: lo mismo que leen los buscadores. */
export function FaqList({ items, withSchema = true, className }: { items: { q: string; a: string }[]; withSchema?: boolean; className?: string }) {
  return (
    <div className={cn("border-t-2 border-[var(--c-line)]", className)}>
      {withSchema ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
      ) : null}
      {items.map((f) => (
        <details key={f.q} className="c-faq border-b-2 border-[var(--c-line)]">
          <summary className="flex items-center justify-between gap-6 rounded-[2px] py-5">
            <span className="text-[1.125rem] font-semibold leading-snug">{f.q}</span>
            <Plus className="c-faq-icon h-6 w-6 shrink-0" aria-hidden />
          </summary>
          <p className="c-body pb-6">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
// creado por pato dev y askforvini
