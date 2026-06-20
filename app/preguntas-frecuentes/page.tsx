"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus } from "lucide-react";

const FAQ_DATA = {
  general: [
    { q: "¿Qué es Mercav y para qué sirve?", a: "Mercav es un ecosistema digital que integra publicidad offline, servicios, empleo, comunidad y herramientas de productividad." },
    { q: "¿Cómo me registro?", a: "Podés registrarte con email y contraseña, o con proveedores sociales disponibles en el futuro." },
    { q: "¿Mercav está disponible en mi país?", a: "Mercav está diseñado para operar en Latinoamérica, con especial foco en mercados regionales." },
    { q: "¿Es gratuito usar Mercav?", a: "Sí. Explorar, crear perfil y usar funciones base es gratuito; algunos módulos tienen límites según el plan." },
    { q: "¿Cómo funciona el sistema de planes?", a: "El plan define límites y acceso a herramientas. Podés subir de plan en cualquier momento desde /precios." },
  ],
  pagos: [
    { q: "¿Cómo se calculan las comisiones?", a: "Se aplican según el módulo y el tipo de operación. Las transacciones se informan con claridad antes de confirmar." },
    { q: "¿Cuándo recibo el pago de mis servicios o espacios?", a: "Cuando se cumple la condición de liberación correspondiente y no hay disputas abiertas." },
    { q: "¿Qué pasa si una transacción falla?", a: "La operación queda en revisión y se resuelve según el estado del pago y la evidencia aportada." },
    { q: "¿Puedo pedir un reembolso?", a: "Sí, dependiendo del módulo y de las políticas de la transacción o del servicio contratado." },
    { q: "¿Qué pasa si acuerdo un trato fuera de la plataforma?", a: "Eso viola los Términos y puede generar sanciones, suspensiones y cargos adicionales." },
  ],
  ads: [
    { q: "¿Cómo publico mi espacio publicitario?", a: "Desde el módulo de anuncios podés crear un espacio con fotos, precio, calendario y ubicación." },
    { q: "¿Qué es el primer alquiler sin comisión?", a: "Es un beneficio promocional para el primer alquiler de algunos espacios, cuando aplique." },
    { q: "¿Cómo funciona el calendario de disponibilidad?", a: "Marcás rangos disponibles y Mercav muestra solo las fechas disponibles para reservar." },
    { q: "¿Puedo cancelar una reserva?", a: "Sí, pero las condiciones dependen del estado de la reserva y de la política correspondiente." },
  ],
  services: [
    { q: "¿Cómo funciona el sistema de escrow?", a: "El pago se retiene hasta que el trabajo se entrega y el cliente lo acepta o vence el plazo de revisión." },
    { q: "¿Qué hago si el cliente no aprueba mi entrega?", a: "Podés responder con revisiones o abrir una disputa si corresponde." },
    { q: "¿Cómo abro una disputa?", a: "Desde el detalle del pedido/servicio, adjuntando la evidencia pertinente." },
    { q: "¿Cuánto tiempo tarda en liberarse mi pago?", a: "Depende del módulo y del estado del trabajo, pero se detalla antes de confirmar." },
  ],
  jobs: [
    { q: "¿Cómo me postulo a una vacante?", a: "Entrá a la vacante, completá los datos requeridos y enviá tu postulación." },
    { q: "¿Cuándo puedo chatear con la empresa?", a: "En postulaciones a empleo, el chat se habilita cuando la empresa te mueve a la etapa Entrevista." },
    { q: "¿Mis datos son visibles para cualquiera?", a: "No. La visibilidad depende de tus ajustes de privacidad y del contenido público del perfil." },
    { q: "¿Tengo que pagar para postularme?", a: "No, postularse no tiene costo directo para el usuario." },
    { q: "¿Puedo postularme en otro país?", a: "Sí, siempre que la vacante esté disponible para tu ubicación o modalidad." },
  ],
  account: [
    { q: "¿Cómo mejoro mi porcentaje de completitud?", a: "Agregá foto, bio, ubicación, experiencia, habilidades y enlaces relevantes." },
    { q: "¿Cómo verifico mi cuenta?", a: "Mercav puede solicitar verificación adicional según el tipo de cuenta o actividad." },
    { q: "¿Puedo tener más de un rol?", a: "Sí, dependiendo de cómo esté configurada tu cuenta y tus permisos." },
    { q: "¿Cómo elimino mi cuenta?", a: "Desde la configuración de cuenta o solicitándolo por soporte, según el flujo habilitado." },
    { q: "¿Cómo cambio mi plan?", a: "Desde /precios podés actualizar o cambiar el ciclo de facturación." },
  ],
};

const CATEGORIES = [
  ["general", "General"],
  ["pagos", "Pagos y Comisiones"],
  ["ads", "Publicidad Offline"],
  ["services", "Servicios"],
  ["jobs", "Empleos"],
  ["account", "Cuenta y Perfil"],
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");
  const [open, setOpen] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const base = FAQ_DATA[activeCategory as keyof typeof FAQ_DATA] || [];
    if (!search.trim()) return base;
    return base.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(search.toLowerCase()));
  }, [activeCategory, search]);

  const toggle = (question: string) => {
    setOpen((current) => current.includes(question) ? current.filter((item) => item !== question) : [...current, question]);
  };

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-7xl grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-bg-secondary p-4">
            <div className="mb-4 text-sm font-semibold text-white">Categorías</div>
            <div className="space-y-2">
              {CATEGORIES.map(([key, label]) => (
                <button key={key} onClick={() => setActiveCategory(key)} className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${activeCategory === key ? "border-gold bg-gold/10 text-gold" : "border-border bg-bg-primary text-gray-300 hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main>
          <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-border bg-bg-secondary p-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Preguntas <span className="text-gold">Frecuentes</span></h1>
            <p className="mt-3 text-gray-400">Buscador en tiempo real, tabs de categorías y acordeones independientes.</p>
            <div className="mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-border bg-bg-primary px-4 py-3">
              <Search className="h-5 w-5 text-gold" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar una pregunta" className="w-full bg-transparent text-white outline-none placeholder:text-gray-500" />
            </div>
          </motion.header>

          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {CATEGORIES.map(([key, label]) => (
              <button key={key} onClick={() => setActiveCategory(key)} className={`rounded-full border px-4 py-2 text-sm ${activeCategory === key ? "border-gold bg-gold/10 text-gold" : "border-border bg-bg-secondary text-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-border bg-bg-secondary p-10 text-center text-gray-400">No encontramos resultados. Probá con otro término o cambiá de categoría.</div>
            ) : filtered.map((item) => {
              const isOpen = open.includes(item.q);
              return (
                <motion.div key={item.q} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-bg-secondary overflow-hidden">
                  <button onClick={() => toggle(item.q)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="text-lg font-semibold text-white">{item.q}</span>
                    {isOpen ? <Minus className="h-5 w-5 text-gold" /> : <Plus className="h-5 w-5 text-gray-500" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="px-6 pb-5 text-gray-400 leading-7">
                        {item.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
