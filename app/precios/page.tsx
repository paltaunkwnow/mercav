"use client";

import { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { AuthHeroButton } from '@/components/ui/AuthHeroButton';
import { cn } from '@/lib/utils';
import { TOOL_REQUIREMENTS } from '@/lib/toolPlanCatalog';
import { CTABand, Container, PageHero, Section, SectionHeading, buttonClass } from '@/components/site/primitives';

/** Display names for the tools gated in lib/toolPlanCatalog.ts (same labels as /herramientas). */
const TOOL_LABELS: Record<string, string> = {
  "pos-system": "Punto de venta (POS)",
  "roi-calculator": "Calculadora de ROI",
  "palette-generator": "Generador de paletas",
  "seo-analyzer": "Analizador SEO",
  "price-simulator": "Simulador de precios",
  "contract-generator": "Generador de contratos",
  "prompt-generator": "Generador de prompts",
};

export default function Precios() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "FREE",
      displayName: "Free",
      price: 0,
      desc: "Para explorar la plataforma.",
      features: [
        "Perfil completo",
        "10 postulaciones por mes",
        "1 espacio o servicio publicado",
        "1 vacante por mes",
        "Feed y perfiles públicos",
        "Hasta 5 chats activos"
      ]
    },
    {
      name: "PROFESSIONAL",
      displayName: "Profesional",
      price: 9.99,
      desc: "Para freelancers y profesionales.",
      features: [
        "Postulaciones ilimitadas",
        "Hasta 5 espacios o servicios",
        "Hasta 5 vacantes por mes",
        "Mensajes ilimitados",
        "Perfil destacado en búsquedas",
        "Analytics básico del perfil"
      ]
    },
    {
      name: "EMPRESA",
      displayName: "Empresa",
      price: 29,
      desc: "Para agencias y negocios.",
      popular: true,
      features: [
        "Vacantes ilimitadas",
        "Gestión avanzada de candidatos",
        "Preguntas de postulación",
        "Analytics avanzado",
        "Badge Empresa verificada",
        "Soporte dedicado"
      ]
    },
    {
      name: "ELITE",
      displayName: "Elite",
      price: 79,
      desc: "La suite completa para escalar.",
      features: [
        "Hasta 20 espacios o servicios",
        "Aparición destacada en el inicio",
        "Mercav Tools sin límites",
        "Generación de contratos con IA",
        "API de integración completa",
        "Soporte 24/7 prioritario"
      ]
    }
  ];

  const toolRows = Object.entries(TOOL_REQUIREMENTS).map(([id, allowed]) => ({ id, label: TOOL_LABELS[id] ?? id, allowed }));

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Precios"
        title="Planes claros. Sin sorpresas."
        lead="Empezá gratis y subí de plan solo cuando lo necesites. Pagando anualmente ahorrás un 20%."
      >
        <div role="group" aria-label="Ciclo de facturación" className="mv-panel inline-flex rounded-full p-1">
          {[
            { annual: false, label: "Mensual" },
            { annual: true, label: "Anual" },
          ].map((opt) => {
            const active = isAnnual === opt.annual;
            return (
              <button
                key={opt.label}
                type="button"
                aria-pressed={active}
                onClick={() => setIsAnnual(opt.annual)}
                className={cn(
                  "mv-focus inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-200",
                  active ? "bg-[var(--text-primary)] text-bg-primary" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {opt.label}
                {opt.annual ? <span className={cn("mv-data text-xs", active ? "opacity-80" : "text-gold")}>−20%</span> : null}
              </button>
            );
          })}
        </div>
      </PageHero>

      <Section tight className="!pt-2 md:!pt-4" labelledBy="planes">
        <Container>
          <h2 id="planes" className="sr-only">
            Planes
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, i) => {
              const displayPrice = isAnnual ? (plan.price * 0.8).toFixed(2) : plan.price;
              const featured = Boolean(plan.popular);
              return (
                <li
                  key={i}
                  className={cn(
                    "relative flex flex-col p-6 md:p-7",
                    featured ? "liquid-glass liquid-glass-lens rounded-[1.75rem] ring-1 ring-[var(--color-border-gold)]" : "mv-panel",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="mv-h3">{plan.displayName}</h3>
                    {featured ? <span className="mv-chip mv-chip-gold">Recomendado</span> : null}
                  </div>
                  <p className="mv-body mt-1.5">{plan.desc}</p>

                  <div className="mt-7">
                    <p className="flex items-baseline gap-1 text-[var(--text-primary)]">
                      <span className="text-lg text-[var(--text-secondary)]">$</span>
                      <span className="font-display text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums">{displayPrice}</span>
                      <span className="ml-1 text-sm text-[var(--text-secondary)]">/mes</span>
                    </p>
                    <p className="mt-2 h-5 text-sm text-[var(--text-tertiary)]">
                      {plan.price === 0 ? (
                        "Sin costo"
                      ) : isAnnual ? (
                        <>
                          <span className="line-through">${plan.price}</span> · facturación anual
                        </>
                      ) : (
                        "Facturación mensual"
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (plan.price === 0) {
                        window.location.href = '/dashboard';
                        return;
                      }
                      const url = `/checkout?amount=${displayPrice}&plan=${plan.name}${isAnnual ? '&interval=annual' : '&interval=monthly'}`;
                      window.location.href = url;
                    }}
                    className={buttonClass(featured ? "primary" : "secondary", "md", "mt-6 w-full")}
                  >
                    {plan.price === 0 ? "Comenzar gratis" : "Elegir " + plan.displayName}
                  </button>

                  <div className="mv-divider my-6" aria-hidden />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Incluye</p>
                  <ul className="mt-3 flex-1 space-y-3">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="raised" labelledBy="comparar-tools">
        <Container>
          <SectionHeading
            id="comparar-tools"
            kicker="Mercav Tools"
            title="Qué herramientas abre cada plan."
            lead="El acceso a cada herramienta depende del plan de tu cuenta. Esta tabla sale de la misma configuración que usa la plataforma."
          />

          {/* Desktop: comparison table */}
          <div className="mv-panel mt-12 hidden overflow-hidden md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Herramientas incluidas por plan</caption>
              <thead>
                <tr className="border-b border-[var(--mv-hairline)]">
                  <th scope="col" className="px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                    Herramienta
                  </th>
                  {plans.map((p) => (
                    <th key={p.name} scope="col" className={cn("px-4 py-4 text-center text-sm font-semibold", p.popular ? "text-gold" : "text-[var(--text-primary)]")}>
                      {p.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {toolRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--mv-hairline)] last:border-b-0">
                    <th scope="row" className="px-6 py-4 text-[0.9375rem] font-medium text-[var(--text-primary)]">
                      {row.label}
                    </th>
                    {plans.map((p) => {
                      const ok = row.allowed.includes(p.name);
                      return (
                        <td key={p.name} className={cn("px-4 py-4 text-center", p.popular && "bg-[var(--mv-gold-wash)]")}>
                          {ok ? <Check className="mx-auto h-4 w-4 text-gold" aria-label="Incluida" /> : <Minus className="mx-auto h-4 w-4 text-[var(--text-tertiary)]" aria-label="No incluida" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards, one per tool */}
          <ul className="mt-10 space-y-3 md:hidden">
            {toolRows.map((row) => (
              <li key={row.id} className="mv-panel rounded-[1.25rem] p-5">
                <p className="font-semibold text-[var(--text-primary)]">{row.label}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Planes que incluyen ${row.label}`}>
                  {plans.map((p) => {
                    const ok = row.allowed.includes(p.name);
                    return (
                      <li key={p.name} className={cn("mv-chip", ok ? "mv-chip-gold" : "opacity-50 line-through")}>
                        <span className="sr-only">{ok ? "Incluida en" : "No incluida en"} </span>
                        {p.displayName}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CTABand
        title="Empezá hoy, sin tarjeta."
        lead="Creá tu cuenta gratis y subí de plan cuando tu negocio lo pida."
        action={<AuthHeroButton label="Empezar gratis, sin tarjeta" className="w-full sm:w-auto px-8" />}
      />
    </div>
  );
}
// creado por pato dev y askforvini
