"use client";

import { ArrowRight, Check, Rocket, Star, Target } from "@/components/icons";
import { ButtonLink, CTABand, Container, PageHero, Section, buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

export default function PremiumPage() {
  const plans = [
    {
      id: "PROFESSIONAL",
      name: "Profesional",
      price: "$9.99",
      desc: "Para freelancers y profesionales que buscan destacar.",
      features: [
        "Postulaciones ilimitadas",
        "Hasta 5 servicios/espacios",
        "Perfil destacado en búsquedas",
        "Mensajería ilimitada",
        "Analytics básico del perfil"
      ],
      icon: Target
    },
    {
      id: "EMPRESA",
      name: "Empresa",
      price: "$29",
      desc: "La solución completa para agencias y reclutadores.",
      features: [
        "Vacantes ilimitadas",
        "Badge Empresa verificada",
        "Gestión avanzada de candidatos",
        "Soporte dedicado",
        "Analytics avanzado"
      ],
      icon: Rocket,
      featured: true
    },
    {
      id: "ELITE",
      name: "Elite",
      price: "$79",
      desc: "Herramientas exclusivas para quien necesita todo el alcance.",
      features: [
        "Todo lo de Empresa",
        "Aparición destacada en Home",
        "IA para generación de contratos",
        "API de integración completa",
        "Soporte 24/7 prioritario"
      ],
      icon: Star
    }
  ];

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Premium"
        title="Llevá tu negocio al siguiente nivel."
        lead="Impulsá tus publicaciones, encontrá mejor talento y ganá visibilidad en el mercado publicitario de Bolivia."
        actions={
          <ButtonLink href="/precios" tone="ghost" className="w-full sm:w-auto">
            Comparar con el plan Free <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        }
      />

      <Section tight className="!pt-2 md:!pt-4" labelledBy="premium-planes">
        <Container>
          <h2 id="premium-planes" className="sr-only">
            Planes premium
          </h2>
          <ul className="grid gap-4 md:grid-cols-3 md:items-stretch">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex flex-col p-6 md:p-8",
                    plan.featured ? "liquid-glass liquid-glass-lens order-first rounded-[1.75rem] ring-1 ring-[var(--color-border-gold)] md:order-none" : "mv-panel",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-2xl",
                        plan.featured ? "bg-gold text-[var(--mv-on-gold)]" : "border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    {plan.featured ? <span className="mv-chip mv-chip-gold">Recomendado</span> : null}
                  </div>
                  <h3 className="mv-h3 mt-6">{plan.name}</h3>
                  <p className="mv-body mt-1.5">{plan.desc}</p>

                  <p className="mt-7 flex items-baseline gap-1.5 text-[var(--text-primary)]">
                    <span className="font-display text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums">{plan.price}</span>
                    <span className="text-sm text-[var(--text-secondary)]">/mes</span>
                  </p>

                  <ul className="mt-7 flex-1 space-y-3 border-t border-[var(--mv-hairline)] pt-6">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-3 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => {
                      // El checkout calcula el monto por la clave del plan (PROFESSIONAL, EMPRESA, ELITE);
                      // el nombre visible ("Profesional") no matchea y redirigía a /precios.
                      const numericPrice = plan.price.replace('$', '');
                      window.location.href = `/checkout?amount=${encodeURIComponent(numericPrice)}&plan=${plan.id}&interval=monthly`;
                    }}
                    className={buttonClass(plan.featured ? "primary" : "secondary", "md", "mt-8 w-full")}
                  >
                    Elegir {plan.name} <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">Precios mensuales. Para facturación anual, elegí el ciclo en la página de precios.</p>
        </Container>
      </Section>

      <CTABand
        title="¿Necesitás un plan a medida?"
        lead="Si representás a una organización grande o tenés necesidades específicas de volumen, contanos qué buscás."
        action={<ButtonLink href="/contacto" size="lg" className="w-full sm:w-auto">Hablar con ventas</ButtonLink>}
      />
    </div>
  );
}
// creado por pato dev y askforvini
