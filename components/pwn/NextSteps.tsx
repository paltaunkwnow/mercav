const STEPS: Record<"email" | "domain" | "password", { title: string; items: string[] }> = {
  email: {
    title: "Si este correo es tuyo",
    items: [
      "Cambia la contraseña de esa cuenta y de cualquier otra que use la misma clave.",
      "Activa un segundo factor antes de volver a iniciar sesión desde un enlace.",
      "Comprueba la contraseña nueva en esta misma página: el hash se calcula aquí y no se guarda.",
      "Si es el correo de tu cuenta Mercav, añádelo en Monitoreo para recibir la alerta en la app.",
    ],
  },
  domain: {
    title: "Si este dominio es tuyo",
    items: [
      "Verifícalo en Monitoreo con el registro DNS TXT. Sin eso no hay detalle ni alerta.",
      "Revisa qué tipos de dato cita la fuente. Un hallazgo sin verificar no es un hecho confirmado.",
      "Avisa a quien administra el correo del dominio para rotar claves reutilizadas.",
    ],
  },
  password: {
    title: "Esta contraseña ya apareció",
    items: [
      "Deja de usarla. La comparación se hizo en este navegador y la clave no se envió.",
      "No la recicles en otro servicio. Una filtración vieja sigue sirviendo si la clave es la misma.",
      "Activa un segundo factor en las cuentas donde llegó a usarse.",
    ],
  },
};

export function NextSteps({ kind }: { kind: "email" | "domain" | "password" }) {
  const step = STEPS[kind];
  return (
    <section aria-label={step.title} className="rounded-3xl border border-gold/20 bg-bg-secondary/80 p-5 md:p-6">
      <h2 className="font-display text-xl text-white">{step.title}</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-300">
        {step.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
// creado por pato dev y askforvini
