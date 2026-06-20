"use client";

import { ArrowLeft, Gavel, ShieldAlert, Scale, ScrollText, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Aceptación de los Términos",
      icon: <CheckCircle2 className="text-gold" size={20} />,
      content: "Al acceder y utilizar la plataforma Mercav, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios. Mercav se reserva el derecho de modificar estos términos en cualquier momento, notificando a los usuarios a través de la plataforma."
    },
    {
      title: "2. Registro y Seguridad de la Cuenta",
      icon: <Scale className="text-blue-400" size={20} />,
      content: "Para utilizar ciertas funciones como el POS o la publicación de servicios, debe crear una cuenta. Usted es el único responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Mercav no se hace responsable por pérdidas resultantes de un acceso no autorizado a su cuenta."
    },
    {
      title: "3. Mercav POS y Gestión Comercial",
      icon: <ScrollText className="text-orange-400" size={20} />,
      content: "El sistema de Punto de Venta (POS) se proporciona para la gestión interna de su negocio. Usted es responsable de la exactitud de los datos de inventario y precios. Mercav no garantiza la interoperabilidad con todas las impresoras térmicas de terceros, aunque el sistema está optimizado para estándares industriales (ESC/POS)."
    },
    {
      title: "4. Depósito en Garantía (Escrow)",
      icon: <ShieldAlert className="text-emerald-400" size={20} />,
      content: "Mercav actúa como custodio de los pagos por servicios freelance. El dinero del comprador es retenido por Mercav y solo se libera al vendedor cuando el trabajo es aceptado. En caso de disputa, Mercav revisará las pruebas y emitirá una resolución final vinculante para ambas partes."
    },
    {
      title: "5. Contenido y Conducta Prohibida",
      icon: <XCircle className="text-red-500" size={20} />,
      content: "Está estrictamente prohibido: suplantar la identidad de empresas o personas, publicar contenido ilegal, pornográfico o violento, realizar spam, intentar estafar a otros usuarios o utilizar la plataforma para lavado de dinero. El incumplimiento resultará en la proscripción inmediata y reporte a las autoridades competentes."
    },
    {
      title: "6. Comisiones y Facturación",
      icon: <AlertCircle className="text-purple-400" size={20} />,
      content: "Mercav cobra una comisión del 12% por cada transacción de servicios freelance exitosa. Esta comisión cubre los costos de mantenimiento, pasarelas de pago y soporte. Las publicaciones de empleo son gratuitas. Mercav no es responsable por las obligaciones tributarias de los usuarios frente al SIN u otras entidades."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-white pt-32 pb-20 overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gold transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.2em]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
          </Link>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white mb-6">
            Términos y <span className="text-gold">Condiciones</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Acuerdo legal para el uso de la plataforma Mercav y sus servicios asociados.
          </p>
          <div className="mt-8 text-[10px] text-gray-700 font-black uppercase tracking-widest">
            Última actualización: 12 de Mayo, 2026
          </div>
        </motion.div>

        <div className="space-y-12">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg-secondary/40 border border-white/5 p-10 rounded-[3rem] hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                   {section.icon}
                 </div>
                 <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-lg">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-10 border-t border-white/5 text-center"
        >
          <p className="text-gray-600 text-sm mb-8">
            Al continuar utilizando Mercav, usted confirma que ha leído y entendido estos términos.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/privacidad" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gold transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/contacto" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gold transition-colors">
              Contactar Legal
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
