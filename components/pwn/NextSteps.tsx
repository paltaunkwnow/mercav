const STEPS: Record<"email" | "domain" | "password", { title: string; items: string[] }> = {
  email: {
    title: "Si este correo es tuyo",
    items: [
      "Cambiá la contraseña de esa cuenta y de cualquier otra que use la misma clave.",
      "Activá un segundo factor antes de volver a iniciar sesión desde un enlace.",
      "Comprobá la contraseña nueva en esta misma página: el hash se calcula aquí y no se guarda.",
      "Si querés alertas, seguilo en Exposición. El correo de tu cuenta se patrulla al añadirlo; otro correo pide autorización solo para el patrullaje.",
    ],
  },
  domain: {
    title: "Si este dominio es tuyo",
    items: [
      "Seguilo en Exposición para recibir alertas. Un dominio no pide autorización para consultarlo ni para patrullarlo.",
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

export function NextSteps({ kind }: { kind: "email" | "domain" | "password" }) {
  const step = STEPS[kind];
  return (
    <section aria-label={step.title} className="rounded-[1.5rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-5 md:p-6">
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
    </section>
  );
}
// creado por pato dev y askforvini
