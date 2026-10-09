"use client";

import { useMemo, useState } from "react";
import { HelpCircle } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ButtonLink, CTABand, Container, PageHero, Section } from "@/components/site/primitives";
import { FaqItem, FaqSearch } from "@/app/faq/FaqAccordion";

const FAQ_DATA = {
  general: [
    { q: "¿Qué es Mercav y para qué sirve?", a: "Mercav es un ecosistema digital que integra publicidad offline, servicios, empleo, comunidad y herramientas de productividad." },
    { q: "¿Cómo me registro?", a: "Podés registrarte con email y contraseña, o con proveedores sociales disponibles en el futuro." },
    { q: "¿Mercav está disponible en mi país?", a: "Mercav está diseñado para operar en Latinoamérica, con especial foco en mercados regionales." },
    { q: "¿Es gratuito usar Mercav?", a: "Sí. Explorar, crear perfil y usar funciones base es gratuito; algunos módulos tienen límites según el plan." },
    { q: "¿Cómo funciona el sistema de planes?", a: "El plan define límites y acceso a herramientas. Podés subir de plan en cualquier momento desde /precios." },
  ],
  pagos: [
    { q: "¿Cómo se calculan las comisiones?", a: "Se aplican según el módulo y el tipo de operación. Las transacciones se informan con claridad antes de confirmar." },
    { q: "¿Cuándo recibo el pago de mis servicios o espacios?", a: "Cuando se cumple la condición de liberación correspondiente y no hay disputas abiertas." },
    { q: "¿Qué pasa si una transacción falla?", a: "La operación queda en revisión y se resuelve según el estado del pago y la evidencia aportada." },
    { q: "¿Puedo pedir un reembolso?", a: "Sí, dependiendo del módulo y de las políticas de la transacción o del servicio contratado." },
    { q: "¿Qué pasa si acuerdo un trato fuera de la plataforma?", a: "Eso viola los Términos y puede generar sanciones, suspensiones y cargos adicionales." },
  ],
  ads: [
    { q: "¿Cómo publico mi espacio publicitario?", a: "Desde el módulo de anuncios podés crear un espacio con fotos, precio, calendario y ubicación." },
    { q: "¿Qué es el primer alquiler sin comisión?", a: "Es un beneficio promocional para el primer alquiler de algunos espacios, cuando aplique." },
    { q: "¿Cómo funciona el calendario de disponibilidad?", a: "Marcás rangos disponibles y Mercav muestra solo las fechas disponibles para reservar." },
    { q: "¿Puedo cancelar una reserva?", a: "Sí, pero las condiciones dependen del estado de la reserva y de la política correspondiente." },
  ],
  services: [
    { q: "¿Cómo funciona el sistema de escrow?", a: "El pago se retiene hasta que el trabajo se entrega y el cliente lo acepta o vence el plazo de revisión." },
    { q: "¿Qué hago si el cliente no aprueba mi entrega?", a: "Podés responder con revisiones o abrir una disputa si corresponde." },
    { q: "¿Cómo abro una disputa?", a: "Desde el detalle del pedido/servicio, adjuntando la evidencia pertinente." },
    { q: "¿Cuánto tiempo tarda en liberarse mi pago?", a: "Depende del módulo y del estado del trabajo, pero se detalla antes de confirmar." },
  ],
  jobs: [
    { q: "¿Cómo me postulo a una vacante?", a: "Entrá a la vacante, completá los datos requeridos y enviá tu postulación." },
    { q: "¿Cuándo puedo chatear con la empresa?", a: "En postulaciones a empleo, el chat se habilita cuando la empresa te mueve a la etapa Entrevista." },
    { q: "¿Mis datos son visibles para cualquiera?", a: "No. La visibilidad depende de tus ajustes de privacidad y del contenido público del perfil." },
    { q: "¿Tengo que pagar para postularme?", a: "No, postularse no tiene costo directo para el usuario." },
    { q: "¿Puedo postularme en otro país?", a: "Sí, siempre que la vacante esté disponible para tu ubicación o modalidad." },
  ],
  account: [
    { q: "¿Cómo mejoro mi porcentaje de completitud?", a: "Agregá foto, bio, ubicación, experiencia, habilidades y enlaces relevantes." },
    { q: "¿Cómo verifico mi cuenta?", a: "Mercav puede solicitar verificación adicional según el tipo de cuenta o actividad." },
    { q: "¿Puedo tener más de un rol?", a: "Sí, dependiendo de cómo esté configurada tu cuenta y tus permisos." },
    { q: "¿Cómo elimino mi cuenta?", a: "Desde la configuración de cuenta o solicitándolo por soporte, según el flujo habilitado." },
    { q: "¿Cómo cambio mi plan?", a: "Desde /precios podés actualizar o cambiar el ciclo de facturación." },
  ],
};

const CATEGORIES = [
  ["general", "General"],
  ["pagos", "Pagos y comisiones"],
  ["ads", "Publicidad offline"],
  ["services", "Servicios"],
  ["jobs", "Empleos"],
  ["account", "Cuenta y perfil"],
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");
  const [open, setOpen] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const base = FAQ_DATA[activeCategory as keyof typeof FAQ_DATA] || [];
    if (!search.trim()) return base;
    return base.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(search.toLowerCase()));
  }, [activeCategory, search]);

  const toggle = (question: string) => {
    setOpen((current) => current.includes(question) ? current.filter((item) => item !== question) : [...current, question]);
  };

  const activeLabel = CATEGORIES.find(([key]) => key === activeCategory)?.[1] ?? "";

  const chip = (key: string, label: string, vertical = false) => {
    const active = activeCategory === key;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={active}
        onClick={() => setActiveCategory(key)}
        className={cn(
          "mv-focus flex h-10 shrink-0 items-center whitespace-nowrap px-4 text-sm transition-colors duration-200",
          vertical ? "w-full rounded-xl text-left" : "rounded-full border",
          active
            ? vertical
              ? "bg-[var(--mv-gold-wash)] font-semibold text-gold"
              : "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] font-semibold text-gold"
            : vertical
              ? "text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
              : "border-[var(--mv-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        )}
      >
        {label}
        {active ? <span className="mv-data ml-2 text-xs opacity-70">{FAQ_DATA[key as keyof typeof FAQ_DATA]?.length ?? 0}</span> : null}
      </button>
    );
  };

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Preguntas frecuentes"
        title="Lo que más nos preguntan, en un solo lugar."
        lead="Elegí una categoría y buscá dentro de ella. Si no está tu respuesta, el equipo de soporte te ayuda."
      >
        <div className="max-w-2xl">
          <FaqSearch value={search} onChange={setSearch} placeholder={`Buscar en ${activeLabel}`} resultCount={filtered.length} />
        </div>
      </PageHero>

      <Section tight className="!pt-4 md:!pt-6">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="Categorías" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">{CATEGORIES.map(([key, label]) => chip(key, label))}</div>
              <div className="hidden flex-col gap-0.5 lg:-ml-3 lg:flex">{CATEGORIES.map(([key, label]) => chip(key, label, true))}</div>
            </nav>

            <section aria-labelledby="pf-cat" className="min-w-0">
              <h2 id="pf-cat" className="mv-h3 mb-5">
                {activeLabel}
              </h2>
              {filtered.length === 0 ? (
                <div className="mv-panel flex flex-col items-center px-6 py-14 text-center">
                  <HelpCircle className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden />
                  <p className="mt-4 font-semibold text-[var(--text-primary)]">No encontramos resultados.</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Probá con otro término o cambiá de categoría.</p>
                  <button type="button" onClick={() => setSearch("")} className="mv-link mt-5 text-sm">
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {filtered.map((item) => (
                    <FaqItem key={item.q} question={item.q} answer={item.a} open={open.includes(item.q)} onToggle={() => toggle(item.q)} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </Container>
      </Section>

      <CTABand
        title="¿No encontraste tu respuesta?"
        lead="Escribinos con el detalle de tu consulta y te respondemos por correo."
        action={<ButtonLink href="/soporte" size="lg" className="w-full sm:w-auto">Ir a soporte</ButtonLink>}
      />
    </div>
  );
}
// creado por pato dev y askforvini
