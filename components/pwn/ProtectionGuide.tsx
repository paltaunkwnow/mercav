"use client";

import { KeyRound, Mail, MousePointerClick, RefreshCw, Smartphone } from "@/components/icons";

const TIPS = [
  {
    icon: Smartphone,
    title: "Activá el segundo factor",
    body: "En el correo y en las cuentas que importan, una segunda prueba evita que una contraseña filtrada baste para entrar.",
  },
  {
    icon: KeyRound,
    title: "Una contraseña por cuenta",
    body: "No repitas la misma clave. Un gestor genera y guarda las demás; Pwn solo comprueba el rango del hash en este navegador.",
  },
  {
    icon: Mail,
    title: "Seguí lo tuyo",
    body: "Sumá el correo de tu cuenta o un dominio verificado por DNS. Las alertas salen de esa búsqueda, no de un volcado guardado.",
  },
  {
    icon: MousePointerClick,
    title: "Desconfiá del mensaje inesperado",
    body: "Un aviso de filtración no pide la contraseña por correo ni por un enlace. Entrá escribiendo la dirección del servicio.",
  },
  {
    icon: RefreshCw,
    title: "Actualizá lo expuesto",
    body: "Si una vulnerabilidad está en el catálogo de CISA, el paso es instalar la corrección del fabricante, no buscar el detalle del ataque.",
  },
];

export function ProtectionGuide() {
  return (
    <section aria-labelledby="pwn-protection-title" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 id="pwn-protection-title" className="mv-h3 text-[clamp(1.35rem,1.15rem+0.8vw,1.85rem)]">
            Qué hacer para protegerte
          </h2>
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">Acciones defensivas. No hay pasos de ataque.</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TIPS.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <li key={tip.title} className="mv-panel flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-[0.875rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="mv-data text-xs text-[var(--text-tertiary)]">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-4 text-[0.9375rem] font-semibold leading-snug text-[var(--text-primary)]">{tip.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{tip.body}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
// creado por pato dev y askforvini
