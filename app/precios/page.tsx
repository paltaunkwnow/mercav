"use client";

import { useState } from 'react';
import { Check, Minus } from '@/components/icons';
import { AuthHeroButton } from '@/components/ui/AuthHeroButton';
import { cn } from '@/lib/utils';
import { TOOL_REQUIREMENTS } from '@/lib/toolPlanCatalog';
import { PRO_ANNUAL_MONTHLY_USD, PRO_ANNUAL_USD, PRO_MONTHLY_USD, PRO_PLAN } from '@/lib/billing/plans';
import { CTABand, Container, PageHero, Section, SectionHeading, buttonClass } from '@/components/site/primitives';

/** Display names for the tools gated in lib/toolPlanCatalog.ts (same labels as /herramientas). */
const TOOL_LABELS: Record<string, string> = {
  "holiday-calendar": "Calendario de feriados",
  "roi-calculator": "Calculadora de ROI",
  "palette-generator": "Generador de paletas",
  "seo-analyzer": "Analizador SEO",
  "price-simulator": "Simulador de precios",
  "contract-generator": "Generador de contratos",
  "prompt-generator": "Generador de prompts",
};

export default function Precios() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Los límites son los que aplican lib/checkPlanLimit.ts y lib/toolPlanCatalog.ts.
  const plans = [
    {
      name: "FREE",
      displayName: "Gratis",
      price: 0,
      annualPrice: 0,
      desc: "Para empezar, con límites.",
      popular: false,
      groups: [
        { title: "Mercado", items: ["1 espacio publicado", "1 servicio publicado", "1 vacante por mes", "10 postulaciones por mes"] },
        { title: "Business", items: ["1 empresa", "Hasta 5 trabajadores por empresa", "1 programa de fidelización por empresa"] },
        { title: "Herramientas", items: ["Calculadora de ROI, paletas y feriados"] },
      ],
    },
    {
      name: PRO_PLAN,
      displayName: "Mercav Pro",
      price: PRO_MONTHLY_USD,
      annualPrice: PRO_ANNUAL_MONTHLY_USD,
      desc: "Sin los límites del plan Gratis.",
      popular: true,
      groups: [
        { title: "Mercado", items: ["Espacios y servicios sin límite", "Vacantes y postulaciones sin límite"] },
        { title: "Business", items: ["Hasta 5 empresas", "Trabajadores sin límite", "Hasta 20 programas de fidelización por empresa"] },
        { title: "Herramientas", items: ["Todas, también contratos, SEO, precios y prompts"] },
      ],
    },
  ];

  /** 9.99 -> "9,99"; 0 -> "0". */
  const money = (value: number) => (value === 0 ? "0" : value.toFixed(2).replace(".", ","));

  const toolRows = Object.entries(TOOL_REQUIREMENTS).map(([id, allowed]) => ({ id, label: TOOL_LABELS[id] ?? id, allowed }));

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Precios"
        title="Planes claros. Sin sorpresas."
        lead="Todo es gratis hasta un límite. Mercav Pro lo quita, y pagando por año ahorrás un 20 %."
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
          <ul className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {plans.map((plan, i) => {
              const displayPrice = money(isAnnual ? plan.annualPrice : plan.price);
              const featured = plan.popular;
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
                          <span className="line-through">${money(plan.price)}</span> · ${money(PRO_ANNUAL_USD)} por año
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
                        window.location.href = '/inicio';
                        return;
                      }
                      // El monto lo fija el servidor (lib/billing/plans.ts): acá solo van el plan y el ciclo.
                      window.location.href = `/checkout?plan=${PRO_PLAN}&interval=${isAnnual ? 'annual' : 'monthly'}`;
                    }}
                    className={buttonClass(featured ? "primary" : "secondary", "md", "mt-6 w-full")}
                  >
                    {plan.price === 0 ? "Comenzar gratis" : "Elegir " + plan.displayName}
                  </button>

                  <div className="mv-divider my-6" aria-hidden />
                  <div className="flex-1 space-y-5">
                    {plan.groups.map((group) => (
                      <div key={group.title}>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{group.title}</p>
                        <ul className="mt-3 space-y-3">
                          {group.items.map((item) => (
                            <li key={item} className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mx-auto mt-6 max-w-4xl text-center text-sm text-[var(--text-secondary)]">Pwn, Kosher y el Calendario no tienen límites: son gratis para todos.</p>
        </Container>
      </Section>

      <Section tone="raised" labelledBy="comparar-tools">
        <Container>
          <SectionHeading
            id="comparar-tools"
            kicker="Mercav Herramientas"
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
        lead="Creá tu cuenta gratis y pasate a Mercav Pro cuando necesites más."
        action={<AuthHeroButton label="Empezar gratis, sin tarjeta" className="w-full sm:w-auto px-8" />}
      />
    </div>
  );
}
// creado por pato dev y askforvini
