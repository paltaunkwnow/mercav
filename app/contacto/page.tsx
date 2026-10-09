"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Copy, Flag, Lightbulb, ShieldAlert } from "@/components/icons";
import { Container, PageHero, Section, SectionHeading, buttonClass } from "@/components/site/primitives";
import { LEGAL } from "@/lib/legal/site";

const CONTACT_CHANNELS = [
  {
    id: "fraud",
    title: "Reportes de fraude",
    email: "fraud@mercav.lat",
    description: "Actividad sospechosa, estafas o suplantación de identidad dentro de la plataforma.",
    icon: ShieldAlert,
    featured: true,
  },
  {
    id: "reports",
    title: "Reportes generales",
    email: "reportes@mercav.lat",
    description: "Problemas técnicos, errores en el feed o comportamiento inapropiado de otros usuarios.",
    icon: Flag,
  },
  {
    id: "suggestions",
    title: "Sugerencias e ideas",
    email: "sugerencias@mercav.lat",
    description: "Ideas para nuevas funciones o mejoras de diseño. Las leemos todas.",
    icon: Lightbulb,
  },
];

const OTHER = [
  { label: "Soporte de cuenta", email: LEGAL.emailSupport },
  { label: "Asuntos legales", email: LEGAL.emailLegal },
  { label: "Privacidad y datos", email: LEGAL.emailPrivacy },
];

export default function ContactoPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Contacto"
        title="Escribí al canal correcto y llegá más rápido."
        lead="Cada casilla la lee una persona del equipo. Elegí la que corresponde a tu consulta; si es sobre tu cuenta, empezá por soporte."
        actions={
          <Link href="/soporte" className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
            Ir a soporte de cuenta
          </Link>
        }
      />

      <Section tight className="!pt-2 md:!pt-4" labelledBy="canales">
        <Container>
          <h2 id="canales" className="sr-only">
            Canales de contacto
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {CONTACT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const copied = copiedId === channel.id;
              return (
                <li
                  key={channel.id}
                  className={
                    channel.featured
                      ? "liquid-glass flex flex-col rounded-[1.5rem] p-6 md:p-7"
                      : "mv-panel flex flex-col p-6 md:p-7"
                  }
                >
                  <span
                    className={
                      channel.featured
                        ? "grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-400 light:text-red-600"
                        : "grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]"
                    }
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mv-h3 mt-5">{channel.title}</h3>
                  <p className="mv-body mt-2 flex-1">{channel.description}</p>

                  <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] py-1.5 pl-4 pr-1.5">
                    <span className="mv-data min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{channel.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(channel.email, channel.id)}
                      aria-label={copied ? `${channel.email} copiado` : `Copiar ${channel.email}`}
                      className="mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                    >
                      {copied ? <Check className="h-4 w-4 text-gold" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                  <span className="sr-only" aria-live="polite">
                    {copied ? "Dirección copiada" : ""}
                  </span>
                  <a href={`mailto:${channel.email}`} className={buttonClass(channel.featured ? "primary" : "secondary", "md", "mt-3 w-full")}>
                    Escribir un correo <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="raised" labelledBy="antes">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <SectionHeading
                id="antes"
                kicker="Antes de escribir"
                title="Un buen reporte se resuelve en menos idas y vueltas."
                lead="Incluí lo necesario para que podamos reproducir el problema o revisar el caso sin pedirte más datos."
              />
              <ol className="mt-10 space-y-4">
                {[
                  "Tu nombre de usuario y el correo con el que te registraste.",
                  "El enlace a la publicación, perfil o pedido involucrado.",
                  "Qué pasó, cuándo y qué esperabas que pasara.",
                  "Capturas de pantalla si ayudan a entenderlo.",
                ].map((item, i) => (
                  <li key={item} className="flex gap-4">
                    <span className="mv-data grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-xs text-[var(--text-tertiary)]">{i + 1}</span>
                    <span className="mv-body pt-0.5 text-[var(--text-primary)]">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-sm text-[var(--text-secondary)]">
                ¿Es una duda de uso? Puede que ya esté respondida en las{" "}
                <Link href="/preguntas-frecuentes" className="mv-link">
                  preguntas frecuentes
                </Link>
                .
              </p>
            </div>

            <div className="lg:pt-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Otras casillas</h3>
              <dl className="mt-4 divide-y divide-[var(--mv-hairline)] rounded-[1.5rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel)]">
                {OTHER.map((o) => (
                  <div key={o.email} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-sm text-[var(--text-secondary)]">{o.label}</dt>
                    <dd>
                      <a href={`mailto:${o.email}`} className="mv-link mv-data text-sm font-normal">
                        {o.email}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-[var(--text-tertiary)]">
                Responsable: {LEGAL.legalName}. {LEGAL.address}.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
// creado por pato dev y askforvini
