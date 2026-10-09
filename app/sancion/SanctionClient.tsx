"use client";

import { useState } from "react";
import { ArrowLeft, Clock, FileText, LogOut, Mail, OctagonAlert, Scale } from "@/components/icons";
import { signOut } from "next-auth/react";
import { Container, buttonClass } from "@/components/site/primitives";

interface SanctionClientProps {
  user: any;
  days: number | null;
  hours: number | null;
  timeLeft: number | null;
}

export default function SanctionClient({ user, days, hours, timeLeft }: SanctionClientProps) {
  const [showAppeal, setShowAppeal] = useState(false);
  const permanent = timeLeft === null;
  const caseId = String(user.id).slice(0, 12).toUpperCase();

  return (
    <section aria-labelledby="sanction-title" className="relative flex min-h-[85svh] w-full items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <div className="relative w-full">
        <Container width="narrow">
          {!showAppeal ? (
            <div key="info" className="mv-fade flex flex-col items-center text-center">
              <span className="mv-panel grid h-14 w-14 place-items-center rounded-2xl text-red-400 light:text-red-600">
                <OctagonAlert className="h-6 w-6" aria-hidden />
              </span>
              <p className="mv-kicker mt-8 !text-red-400 light:!text-red-600">Cuenta restringida</p>
              <h1 id="sanction-title" className="mv-h1 mt-4">
                Tu acceso a Mercav está suspendido.
              </h1>
              <p className="mv-lead mx-auto mt-5">
                Mientras dure la restricción no podés usar los módulos de la plataforma. Abajo tenés el motivo, el tiempo restante y cómo pedir una revisión.
              </p>

              <dl className="mt-10 grid w-full gap-3 text-left sm:grid-cols-2">
                <div className="mv-panel rounded-[1.25rem] p-5 sm:col-span-2">
                  <dt className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Scale className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden /> Motivo
                  </dt>
                  <dd className="mt-2 text-base leading-relaxed text-[var(--text-primary)]">
                    {user.sanctionReason || "Violación de los términos de servicio de la plataforma."}
                  </dd>
                </div>
                <div className="mv-panel rounded-[1.25rem] p-5">
                  <dt className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden /> Tiempo restante
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                    {permanent ? "Indefinido" : `${days} d ${hours} h`}
                  </dd>
                  <dd className="mt-1 text-xs text-[var(--text-tertiary)]">{permanent ? "Suspensión permanente" : "Suspensión temporal"}</dd>
                </div>
                <div className="mv-panel rounded-[1.25rem] p-5">
                  <dt className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <FileText className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden /> Número de caso
                  </dt>
                  <dd className="mv-data mt-2 break-all text-lg text-[var(--text-primary)]">{caseId}</dd>
                  <dd className="mt-1 text-xs text-[var(--text-tertiary)]">Incluilo si apelás</dd>
                </div>
              </dl>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => setShowAppeal(true)} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
                  <Mail className="h-4 w-4" aria-hidden /> Apelar la sanción
                </button>
                <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
                  <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div key="appeal" className="mv-fade">
              <button
                type="button"
                onClick={() => setShowAppeal(false)}
                className="mv-focus -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a los detalles
              </button>
              <p className="mv-kicker mt-6">Apelación</p>
              <h1 id="sanction-title" className="mv-h1 mt-4">
                Cómo pedir una revisión
              </h1>
              <p className="mv-lead mt-5">
                Si creés que la sanción es un error, iniciá una revisión formal por correo. La revisa una persona del equipo de soporte y legal.
              </p>

              <div className="liquid-glass mt-10 rounded-[1.75rem] p-6 md:p-8">
                <p className="text-sm text-[var(--text-secondary)]">Escribí a</p>
                <a
                  href={`mailto:soporte@mercav.lat?subject=${encodeURIComponent(`Apelación de sanción · caso ${caseId}`)}`}
                  className="mv-link mv-data mt-1 inline-block break-all text-xl font-medium md:text-2xl"
                >
                  soporte@mercav.lat
                </a>
                <div className="mv-divider my-6" aria-hidden />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Incluí en tu mensaje</p>
                <ol className="mt-3 space-y-3">
                  {[
                    "Tu nombre de usuario, el correo de registro y el número de caso.",
                    "El contexto de lo que pasó, con el mayor detalle posible.",
                    "Pruebas si considerás que la sanción es injusta.",
                    "Por qué debería levantarse la restricción.",
                  ].map((item, i) => (
                    <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                      <span className="mv-data mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-xs text-[var(--text-tertiary)]">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="mt-5 text-sm text-[var(--text-tertiary)]">Revisamos cada solicitud en un plazo de 48 a 72 horas hábiles.</p>
            </div>
          )}
        </Container>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
