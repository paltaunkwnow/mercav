import { nextStepsForDataTypes } from "@/lib/pwn/next-steps";

const STEPS: Record<"email" | "domain" | "password", { title: string; items: string[] }> = {
  email: {
    title: "Si este correo es tuyo",
    items: [
      "Seguilo y confirmá que es tuyo para ver en qué filtraciones aparece y qué datos incluyen.",
      "Activá un segundo factor en esa cuenta antes de volver a entrar desde un enlace.",
      "Los correos se vuelven a revisar cada vez que los consultás: el monitoreo automático es solo para dominios.",
    ],
  },
  domain: {
    title: "Si este dominio es tuyo",
    items: [
      "Seguilo y verificalo con un registro DNS TXT: así el patrullaje lo revisa solo y te avisa.",
      "Revisá qué tipos de dato cita la fuente. Un hallazgo sin verificar no es un hecho confirmado.",
      "Avisale a quien administra el correo del dominio para rotar claves reutilizadas.",
    ],
  },
  password: {
    title: "Esta contraseña ya apareció",
    items: [
      "Dejá de usarla. La comparación se hizo en este navegador y la clave no se envió.",
      "No la recicles en otro servicio. Una filtración vieja sigue sirviendo si la clave es la misma.",
      "Activá un segundo factor en las cuentas donde llegó a usarse.",
    ],
  },
};

/**
 * Qué hacer después de una exposición. Si se conocen los tipos de dato (clases de HIBP),
 * suma pasos para cada uno: contraseñas, teléfono, tarjetas, documentos…
 */
export function NextSteps({ kind, dataTypes = [] }: { kind: "email" | "domain" | "password"; dataTypes?: string[] }) {
  const step = STEPS[kind];
  const groups = kind === "password" ? [] : nextStepsForDataTypes(dataTypes);
  return (
    <section aria-label={step.title} className="rounded-[1.25rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-5 md:p-6">
      <p className="mv-kicker">Qué hacer ahora</p>
      <h2 className="mv-h3 mt-2 text-lg">{step.title}</h2>
      <ol className="mt-4 space-y-3">
        {step.items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <span className="mv-data grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--color-border-gold)] text-[11px] font-semibold text-gold">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
      {groups.length ? (
        <div className="mt-6 grid gap-4 border-t border-[var(--color-border-gold)] pt-5 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Se filtraron: {group.title.toLowerCase()}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:text-gold">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
// creado por pato dev y askforvini
