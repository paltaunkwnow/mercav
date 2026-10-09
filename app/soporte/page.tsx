"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Mail } from "@/components/icons";
import { Container, PageHero, Section, buttonClass } from "@/components/site/primitives";

export default function SupportPage() {
  const { data: session } = useSession();

  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "Usuario de Mercav";

  const supportEmail = "soporte@mercav.lat";
  const subject = encodeURIComponent("Solicitud de Soporte - Mercav");
  const body = encodeURIComponent(`Hola equipo de Soporte Mercav,

Necesito ayuda con lo siguiente:
[Describe tu duda o problema aquí]

Mis datos:
- Nombre de Usuario: ${userEmail}
- Nombre Completo: ${userName}

Saludos.`);

  const mailtoLink = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Soporte"
        title="¿En qué te ayudamos?"
        lead="Escribinos con el detalle de tu situación y una persona del equipo te responde por correo. Si es una duda de uso, probá primero las preguntas frecuentes."
      />

      <Section tight className="!pt-2 md:!pt-4" labelledBy="soporte-canales">
        <Container>
          <h2 id="soporte-canales" className="sr-only">
            Formas de pedir ayuda
          </h2>
          <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
            <article className="liquid-glass flex flex-col rounded-[1.75rem] p-6 md:p-9">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mv-h3 mt-6">Soporte por correo</h3>
              <p className="mv-body mt-2 max-w-md">
                {userEmail
                  ? "Abrimos un correo con tu usuario ya incluido para que no tengas que repetirlo."
                  : "Abrimos un correo con una plantilla. Si iniciás sesión antes, incluimos tu usuario automáticamente."}
              </p>
              <p className="mt-6 text-sm text-[var(--text-secondary)]">
                Destino: <span className="mv-data text-[var(--text-primary)]">{supportEmail}</span>
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href={mailtoLink} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                  Redactar correo
                </a>
                <span className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                  <Clock className="h-4 w-4" aria-hidden /> Tiempo estimado de respuesta: 24 a 48 h
                </span>
              </div>
            </article>

            <article className="mv-panel flex flex-col p-6 md:p-9">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]">
                <BookOpen className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mv-h3 mt-6">Preguntas frecuentes</h3>
              <p className="mv-body mt-2 flex-1">Respuestas a lo más consultado sobre pagos, Business, verificación, publicidad y cuenta.</p>
              <Link href="/faq" className={buttonClass("secondary", "md", "mt-6 w-full sm:w-auto sm:self-start")}>
                Ver preguntas frecuentes <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          </div>
        </Container>
      </Section>

      <Section tone="raised" tight labelledBy="soporte-incluir">
        <Container>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <p className="mv-kicker">Para responderte mejor</p>
              <h2 id="soporte-incluir" className="mv-h2 mt-4">
                Qué incluir en tu mensaje
              </h2>
              <p className="mv-body mt-4 max-w-md">
                Al escribir a <span className="mv-data text-[var(--text-primary)]">{supportEmail}</span>, sumá estos datos para que podamos revisar tu caso sin pedirte más información.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Nombre de usuario completo",
                "Descripción detallada de la duda",
                "Capturas de pantalla, si aplica",
                "Un número de contacto directo",
              ].map((item, i) => (
                <li key={item} className="mv-panel flex items-start gap-3 rounded-[1.25rem] p-5">
                  <span className="mv-data grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-xs text-[var(--text-tertiary)]">{i + 1}</span>
                  <span className="pt-0.5 text-[0.9375rem] text-[var(--text-primary)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              ¿Querés reportar fraude o enviar una sugerencia?{" "}
              <Link href="/contacto" className="mv-link">
                Ver todos los canales
              </Link>
            </p>
            <Link href="/dashboard" className={buttonClass("ghost", "sm", "w-full sm:w-auto")}>
              Volver al panel <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  );
}
// creado por pato dev y askforvini
