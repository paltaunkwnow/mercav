"use client";

import { useState } from "react";
import { CreditCard, HelpCircle, Package, ShieldCheck, ShoppingBag, UserCheck } from "lucide-react";
import { CTABand, ButtonLink, Container, PageHero, Section } from "@/components/site/primitives";
import { FaqItem, FaqSearch } from "./FaqAccordion";

function slug(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "Mercav POS (punto de venta)",
      icon: Package,
      items: [
        { q: "¿Cómo configuro mi moneda en el POS?", a: "Andá a Dashboard > Ajustes del POS. Ahí podés seleccionar el símbolo de moneda (BOB, USD, etc.) y el nombre de tu negocio para los tickets." },
        { q: "¿Puedo usar el POS desde mi celular?", a: "Sí, el POS está 100% optimizado para móviles. Incluye un botón flotante de caja para facilitar la facturación rápida." },
        { q: "¿Cómo cierro mi turno de caja?", a: "En la parte superior de la terminal POS vas a ver un botón rojo de 'Cerrar'. Al pulsarlo, el sistema te pedirá el arqueo final y te mostrará el resumen de ventas del turno." },
        { q: "¿Genera tickets para impresoras térmicas?", a: "Sí, el sistema genera un recibo digital optimizado para impresión térmica (58mm/80mm) que podés imprimir directamente desde el navegador de tu móvil o PC." },
        { q: "¿El inventario se descuenta automáticamente?", a: "Correcto. Cada vez que procesas una venta exitosa, el stock de los productos se actualiza en tiempo real en tu base de datos." }
      ]
    },
    {
      category: "Pagos y protección",
      icon: CreditCard,
      items: [
        { q: "¿Qué pasa si me estafan?", a: "Mercav utiliza un sistema de Depósito en Garantía (Escrow). Los pagos se retienen hasta que confirmes la entrega. Si hay un problema, abrimos una disputa oficial." },
        { q: "¿Cuándo recibo mi pago como vendedor?", a: "Una vez que el comprador acepta el trabajo o se cumple el tiempo de entrega sin reclamos, los fondos se liberan a tu billetera Mercav (generalmente en 48-72h)." },
        { q: "¿Cómo está protegido mi dinero?", a: "Mercav actúa como intermediario neutral. El dinero nunca va directamente al vendedor hasta que el servicio está garantizado." },
        { q: "¿Cuáles son los métodos de pago aceptados?", a: "Aceptamos pagos con tarjetas de crédito/débito, QR, transferencias bancarias y saldo interno de la plataforma." }
      ]
    },
    {
      category: "Fraude y verificación",
      icon: ShieldCheck,
      items: [
        { q: "¿Cómo sé si un perfil es real?", a: "Buscá el distintivo dorado 'VERIFICADO'. Significa que Mercav ha validado la identidad legal y comercial del usuario o empresa." },
        { q: "¿Qué hago si detecto una publicación sospechosa?", a: "Usá el botón de 'Reportar' en la publicación. Nuestro equipo de moderación revisa todos los reportes en menos de 24 horas." },
        { q: "¿Por qué Mercav me pide mi ID/Documento?", a: "Para mantener la red libre de estafadores. La verificación biométrica es obligatoria para usuarios que manejan pagos de servicios." }
      ]
    },
    {
      category: "Servicios y publicidad",
      icon: ShoppingBag,
      items: [
        { q: "¿Cuál es la comisión por venta?", a: "Mercav cobra un 12% de comisión en servicios freelance para mantener la infraestructura y el sistema de protección de pagos." },
        { q: "¿Los anuncios de empleo tienen costo?", a: "No. Publicar vacantes de empleo en Mercav es y siempre será gratuito para las empresas de toda Latinoamérica." },
        { q: "¿Cómo funcionan las reservas de vallas publicitarias?", a: "Podés ver la disponibilidad en el mapa, reservar el período que quieras y pagar online. Mercav notificará al dueño del espacio para la instalación." }
      ]
    },
    {
      category: "Cuentas y seguridad",
      icon: UserCheck,
      items: [
        { q: "¿Puedo tener múltiples negocios?", a: "Sí, podés configurar varios perfiles de POS o catálogos bajo una misma cuenta maestra de Mercav." },
        { q: "¿Cómo cambio mi contraseña?", a: "En la sección de Perfil > Ajustes > Seguridad. Recomendamos usar autenticación de dos pasos (2FA) para proteger tus fondos." },
        { q: "¿Qué pasa si pierdo acceso a mi cuenta?", a: "Escribí de inmediato a soporte@mercav.lat con tu ID de usuario y los últimos movimientos realizados para validar tu identidad." }
      ]
    }
  ];

  const filteredFaqs = searchQuery 
    ? faqs.map(cat => ({
        ...cat,
        items: cat.items.filter(i => 
          i.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
          i.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : faqs;

  const resultCount = filteredFaqs.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Centro de ayuda"
        title="Respuestas para usar Mercav con tranquilidad."
        lead="Pagos, POS, verificación, publicidad y cuenta. Buscá por palabra o recorré las categorías."
      >
        <div className="max-w-2xl">
          <FaqSearch value={searchQuery} onChange={setSearchQuery} placeholder="Buscá respuestas: pagos, POS, stock…" resultCount={resultCount} />
        </div>
      </PageHero>

      <Section tight className="!pt-4 md:!pt-6">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="Categorías" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <ul className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
                {filteredFaqs.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.category} className="shrink-0">
                      <a
                        href={`#${slug(section.category)}`}
                        className="mv-focus flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full border border-[var(--mv-hairline)] px-4 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] lg:-ml-3 lg:rounded-xl lg:border-transparent lg:px-3 lg:hover:bg-[var(--mv-panel-hover)]"
                      >
                        <Icon className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
                        {section.category}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="min-w-0 space-y-14">
              {filteredFaqs.map((section) => {
                const sectionIndex = faqs.findIndex((c) => c.category === section.category);
                const Icon = section.icon;
                const sid = slug(section.category);
                return (
                  <section key={section.category} id={sid} aria-labelledby={`${sid}-h`} className="scroll-mt-28">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <h2 id={`${sid}-h`} className="mv-h3">
                        {section.category}
                      </h2>
                    </div>
                    <ul className="space-y-2.5">
                      {section.items.map((item) => {
                        const itemIndex = faqs[sectionIndex].items.findIndex((x) => x.q === item.q);
                        const globalIndex = sectionIndex * 100 + itemIndex;
                        return (
                          <FaqItem
                            key={item.q}
                            question={item.q}
                            answer={item.a}
                            open={openItems.includes(globalIndex)}
                            onToggle={() => toggleItem(globalIndex)}
                          />
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
              {filteredFaqs.length === 0 && (
                <div className="mv-panel flex flex-col items-center px-6 py-14 text-center">
                  <HelpCircle className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden />
                  <p className="mt-4 font-semibold text-[var(--text-primary)]">No encontramos resultados para “{searchQuery}”.</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Probá con otra palabra o escribinos a soporte.</p>
                  <button type="button" onClick={() => setSearchQuery("")} className="mv-link mt-5 text-sm">
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <CTABand
        title="¿Seguís con dudas?"
        lead="Contanos qué necesitás y una persona del equipo te responde por correo."
        action={<ButtonLink href="/soporte" size="lg" className="w-full sm:w-auto">Contactar soporte</ButtonLink>}
        note={<>También podés escribir desde <a href="/mensajes" className="mv-link font-medium">Mensajes</a> si ya tenés cuenta.</>}
      />
    </div>
  );
}
// creado por pato dev y askforvini
