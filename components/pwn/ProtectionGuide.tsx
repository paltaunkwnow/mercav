"use client";

import { KeyRound, Mail, MousePointerClick, RefreshCw, Shield, Smartphone } from "lucide-react";

const TIPS = [
  {
    icon: Smartphone,
    title: "Activa el segundo factor",
    body: "En el correo y en las cuentas que importan, una segunda prueba evita que una contraseña filtrada baste para entrar.",
  },
  {
    icon: KeyRound,
    title: "Una contraseña por cuenta",
    body: "No reutilices la misma clave. Un gestor genera y guarda las demás; Pwn solo comprueba el rango del hash en este navegador.",
  },
  {
    icon: Mail,
    title: "Monitorea lo tuyo",
    body: "Añade el correo de tu cuenta o un dominio verificado. Las alertas salen de esa búsqueda, no de un volcado guardado.",
  },
  {
    icon: MousePointerClick,
    title: "Desconfía del mensaje inesperado",
    body: "Un aviso de filtración no pide la contraseña por correo ni por un enlace. Entra escribiendo la dirección del servicio.",
  },
  {
    icon: RefreshCw,
    title: "Actualiza lo expuesto",
    body: "Si una vulnerabilidad está en el catálogo de CISA, el paso es instalar la corrección del fabricante, no buscar el detalle del ataque.",
  },
];

export function ProtectionGuide() {
  return (
    <section aria-labelledby="pwn-protection-title" className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gold" aria-hidden />
          <h2 id="pwn-protection-title" className="font-display text-2xl text-white">
            Qué hacer para protegerte
          </h2>
        </div>
        <p className="text-xs text-gray-500">Acciones defensivas. No hay pasos de ataque.</p>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {TIPS.map((tip) => {
          const Icon = tip.icon;
          return (
            <li key={tip.title} className="rounded-2xl border border-gold/15 bg-gold/[0.04] p-4">
              <div className="flex items-center gap-2 text-gold">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <h3 className="text-sm font-semibold text-white">{tip.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">{tip.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
