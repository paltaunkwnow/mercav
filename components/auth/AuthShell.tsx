import type { ReactNode } from "react";
import { Briefcase, Building2, Megaphone, MonitorPlay, Shield, Wrench } from "@/components/icons";
import { Container } from "@/components/site/primitives";
import { StarOfDavid } from "@/components/site/StarOfDavid";

/** The seven modules one Mercav account opens (Business replaced POS). Copy mirrors the home platform tabs. */
const MODULES = [
  { name: "Publicidad", icon: Megaphone, does: "Alquilá vallas, pantallas y vidrieras con reserva por fechas." },
  { name: "Servicios", icon: MonitorPlay, does: "Contratá talento con pagos retenidos hasta cada hito." },
  { name: "Empleos", icon: Briefcase, does: "Publicá vacantes y ordená las postulaciones." },
  { name: "Business", icon: Building2, does: "Equipo, planillas de sueldo y tarjetas de fidelización." },
  { name: "Herramientas", icon: Wrench, does: "Contratos, cálculos, SEO y precios en un solo lugar." },
  { name: "Pwn", icon: Shield, does: "Vigilá la exposición de los correos y dominios de tu empresa." },
  { name: "Kosher", icon: StarOfDavid, does: "Atlas de lugares kosher, sinagogas y kehilot." },
] as const;

/**
 * Two-column auth layout: the form leads on the left, a Liquid Glass panel with
 * the account's real value proposition sits on the right (desktop only).
 * On mobile the panel collapses into a compact module strip under the form.
 */
export function AuthShell({
  kicker,
  title,
  lead,
  children,
  panelTitle,
  panelLead,
}: {
  kicker: string;
  title: string;
  lead: string;
  children: ReactNode;
  panelTitle: string;
  panelLead: string;
}) {
  return (
    <div className="relative isolate w-full overflow-hidden bg-bg-primary">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <div className="grid min-h-[100svh] items-center gap-12 pb-12 pt-28 md:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pb-16 xl:gap-20">
          <div className="mx-auto w-full max-w-[27rem] lg:mx-0 lg:justify-self-center">
            <p className="mv-kicker">{kicker}</p>
            <h1 className="mv-h2 mt-4">{title}</h1>
            <p className="mv-body mt-3">{lead}</p>
            <div className="mt-8">{children}</div>

            <div className="mt-12 lg:hidden">
              <p className="text-sm text-[var(--text-secondary)]">Una cuenta para todos los módulos</p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Módulos de Mercav">
                {MODULES.map(({ name, icon: Icon }) => (
                  <li key={name} className="mv-chip">
                    <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="hidden lg:block" aria-labelledby="auth-panel-title">
            <div className="liquid-glass liquid-glass-lens relative overflow-hidden rounded-[2rem] p-8 xl:p-10">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gold/10 blur-[80px]" />
              <div className="relative">
                <p className="mv-kicker">Una sola cuenta</p>
                <h2 id="auth-panel-title" className="mv-h3 mt-4 max-w-md text-[1.75rem] leading-[1.15]">
                  {panelTitle}
                </h2>
                <p className="mv-body mt-3 max-w-md">{panelLead}</p>

                <ul className="mt-8 grid gap-1">
                  {MODULES.map(({ name, icon: Icon, does }) => (
                    <li key={name} className="flex items-start gap-4 rounded-2xl px-3 py-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">{name}</span>
                        <span className="block text-sm leading-snug text-[var(--text-secondary)]">{does}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mv-divider mt-6" />
                <p className="mt-5 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  Pagos procesados por Stripe. Podés activar la verificación en dos pasos desde tu perfil.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
