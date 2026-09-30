"use client";

import { ArrowLeft, ChevronDown, Search, ShieldCheck, CreditCard, ShoppingBag, HelpCircle, UserCheck, MessageSquare, Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
      category: "Mercav POS (Punto de Venta)",
      icon: <Package className="text-orange-400" size={20} />,
      items: [
        { q: "¿Cómo configuro mi moneda en el POS?", a: "Ve a Dashboard > Ajustes del POS. Ahí puedes seleccionar el símbolo de moneda (BOB, USD, etc.) y el nombre de tu negocio para los tickets." },
        { q: "¿Puedo usar el POS desde mi celular?", a: "Sí, el POS está 100% optimizado para móviles. Incluye un botón flotante de caja para facilitar la facturación rápida." },
        { q: "¿Cómo cierro mi turno de caja?", a: "En la parte superior de la terminal POS verás un botón rojo de 'Cerrar'. Al pulsarlo, el sistema te pedirá el arqueo final y te mostrará el resumen de ventas del turno." },
        { q: "¿Genera tickets para impresoras térmicas?", a: "Sí, el sistema genera un recibo digital optimizado para impresión térmica (58mm/80mm) que puedes imprimir directamente desde el navegador de tu móvil o PC." },
        { q: "¿El inventario se descuenta automáticamente?", a: "Correcto. Cada vez que procesas una venta exitosa, el stock de los productos se actualiza en tiempo real en tu base de datos." }
      ]
    },
    {
      category: "Pagos y Protección",
      icon: <CreditCard className="text-emerald-400" size={20} />,
      items: [
        { q: "¿Qué pasa si me estafan?", a: "Mercav utiliza un sistema de Depósito en Garantía (Escrow). Los pagos se retienen hasta que confirmes la entrega. Si hay un problema, abrimos una disputa oficial." },
        { q: "¿Cuándo recibo mi pago como vendedor?", a: "Una vez que el comprador acepta el trabajo o se cumple el tiempo de entrega sin reclamos, los fondos se liberan a tu billetera Mercav (generalmente en 48-72h)." },
        { q: "¿Cómo está protegido mi dinero?", a: "Mercav actúa como intermediario neutral. El dinero nunca va directamente al vendedor hasta que el servicio está garantizado." },
        { q: "¿Cuáles son los métodos de pago aceptados?", a: "Aceptamos pagos con tarjetas de crédito/débito, QR, transferencias bancarias y saldo interno de la plataforma." }
      ]
    },
    {
      category: "Fraude y Verificación",
      icon: <ShieldCheck className="text-gold" size={20} />,
      items: [
        { q: "¿Cómo sé si un perfil es real?", a: "Busca el distintivo dorado 'VERIFICADO'. Significa que Mercav ha validado la identidad legal y comercial del usuario o empresa." },
        { q: "¿Qué hago si detecto una publicación sospechosa?", a: "Usa el botón de 'Reportar' en la publicación. Nuestro equipo de moderación revisa todos los reportes en menos de 24 horas." },
        { q: "¿Por qué Mercav me pide mi ID/Documento?", a: "Para mantener la red libre de estafadores. La verificación biométrica es obligatoria para usuarios que manejan pagos de servicios." }
      ]
    },
    {
      category: "Servicios y Publicidad",
      icon: <ShoppingBag className="text-blue-400" size={20} />,
      items: [
        { q: "¿Cuál es la comisión por venta?", a: "Mercav cobra un 12% de comisión en servicios freelance para mantener la infraestructura y el sistema de protección de pagos." },
        { q: "¿Los anuncios de empleo tienen costo?", a: "No. Publicar vacantes de empleo en Mercav es y siempre será gratuito para las empresas de toda Latinoamérica." },
        { q: "¿Cómo funcionan las reservas de vallas publicitarias?", a: "Puedes ver la disponibilidad en el mapa, reservar el periodo que desees y pagar online. Mercav notificará al dueño del espacio para la instalación." }
      ]
    },
    {
      category: "Cuentas y Seguridad",
      icon: <UserCheck className="text-purple-400" size={20} />,
      items: [
        { q: "¿Puedo tener múltiples negocios?", a: "Sí, puedes configurar varios perfiles de POS o catálogos bajo una misma cuenta maestra de Mercav." },
        { q: "¿Cómo cambio mi contraseña?", a: "En la sección de Perfil > Ajustes > Seguridad. Recomendamos usar autenticación de dos pasos (2FA) para proteger tus fondos." },
        { q: "¿Qué pasa si pierdo acceso a mi cuenta?", a: "Escribe inmediatamente a soporte@mercav.lat con tu ID de usuario y los últimos movimientos realizados para validar tu identidad." }
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

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-32 pb-20 overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gold transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.2em]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
          </Link>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white mb-6">
            Centro de <span className="text-gold">Ayuda</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Todo lo que necesitas saber sobre cómo usar Mercav de forma segura y eficiente.
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-20 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-gold transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Busca respuestas (ej: pagos, POS, stock...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-6 text-white outline-none focus:border-gold/30 focus:bg-white/[0.05] transition-all"
          />
        </div>

        <div className="space-y-12">
          {filteredFaqs.map((section, sectionIndex) => (
            <motion.div 
              key={sectionIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-white">{section.category}</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => {
                  const globalIndex = sectionIndex * 100 + itemIndex;
                  const isOpen = openItems.includes(globalIndex);

                  return (
                    <div 
                      key={itemIndex}
                      className={`bg-bg-secondary/40 border transition-all rounded-3xl overflow-hidden ${isOpen ? 'border-gold/30 bg-white/[0.02]' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full p-6 text-left flex items-start justify-between gap-4"
                      >
                        <h3 className={`font-bold transition-colors ${isOpen ? 'text-gold' : 'text-gray-300'}`}>{item.q}</h3>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          className="mt-1"
                        >
                          <ChevronDown size={20} className={isOpen ? 'text-gold' : 'text-gray-600'} />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 text-gray-500 leading-relaxed text-sm">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="text-center py-20 opacity-20">
               <HelpCircle size={80} className="mx-auto mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">No se encontraron resultados</p>
            </div>
          )}
        </div>

        {/* Contact Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-10 bg-gradient-to-br from-gold/10 to-transparent border border-gold/10 rounded-[3rem] text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">¿Aún tienes dudas?</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Nuestro equipo técnico está disponible 24/7 para ayudarte con cualquier problema en la plataforma.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="h-14 px-8 bg-gold text-primary-foreground hover:bg-gold-light rounded-2xl font-black uppercase tracking-widest text-[10px]">
              <Link href="/soporte">Contactar Soporte</Link>
            </Button>
            <Button asChild className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
              <Link href="/mensajes">Chat en Vivo</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
