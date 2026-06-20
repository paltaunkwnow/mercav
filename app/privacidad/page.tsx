"use client";

import { ArrowLeft, ShieldCheck, Eye, Database, Lock, UserPlus, Globe, Cookie } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const policies = [
    {
      title: "1. Información que Recopilamos",
      icon: <Database className="text-gold" size={20} />,
      content: "Recopilamos información que usted nos proporciona directamente (nombre, email, datos comerciales) e información automática (dirección IP, tipo de navegador). Si utiliza el POS, procesamos datos de ventas, inventario y tickets necesarios para la funcionalidad del servicio."
    },
    {
      title: "2. Uso de sus Datos",
      icon: <Eye className="text-blue-400" size={20} />,
      content: "Utilizamos sus datos para: procesar transacciones, verificar identidades para evitar fraudes, personalizar su experiencia en el feed social, generar reportes comerciales para su negocio y enviarle notificaciones críticas sobre sus servicios o pedidos."
    },
    {
      title: "3. Privacidad del POS y Datos Comerciales",
      icon: <Lock className="text-emerald-400" size={20} />,
      content: "Los datos de ventas y clientes registrados en su Mercav POS son de su propiedad exclusiva. Mercav no vende ni comparte su información comercial con terceros. Utilizamos estos datos de forma agregada y anónima solo para mejorar la eficiencia del sistema."
    },
    {
      title: "4. Seguridad Biométrica y Verificación",
      icon: <ShieldCheck className="text-orange-400" size={20} />,
      content: "Para garantizar la seguridad de los pagos, podemos solicitar verificación biométrica o de identidad legal. Estos datos se procesan a través de proveedores de seguridad líderes en la industria y nunca se almacenan de forma legible en nuestros servidores públicos."
    },
    {
      title: "5. Cookies y Tecnologías de Seguimiento",
      icon: <Cookie className="text-purple-400" size={20} />,
      content: "Utilizamos cookies para mantener su sesión activa, recordar sus preferencias del POS y analizar el tráfico de la web. Puede gestionar el uso de cookies desde la configuración de su navegador en cualquier momento."
    },
    {
      title: "6. Sus Derechos de Privacidad",
      icon: <Globe className="text-white" size={20} />,
      content: "Usted tiene derecho a acceder, rectificar o eliminar sus datos personales de nuestros sistemas. Si desea cerrar su cuenta y solicitar el borrado de sus datos comerciales, puede escribir a privacidad@mercav.lat."
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
            Política de <span className="text-gold">Privacidad</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Cómo protegemos y gestionamos su información personal y comercial en Mercav.
          </p>
          <div className="mt-8 text-[10px] text-gray-700 font-black uppercase tracking-widest">
            Compromiso de Privacidad Mercav v2.0
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {policies.map((policy, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                   {policy.icon}
                 </div>
                 <h3 className="text-xl font-bold text-white">{policy.title}</h3>
              </div>
              <p className="text-gray-500 leading-relaxed text-sm">
                {policy.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-12 bg-bg-secondary border border-border rounded-[3rem] text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold mx-auto mb-8 shadow-2xl shadow-gold/20">
             <Lock size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Tu seguridad es nuestra prioridad</h3>
          <p className="text-gray-500 max-w-lg mx-auto mb-10 leading-relaxed">
            Implementamos cifrado de grado bancario y protocolos de seguridad de última generación para asegurar que tu información esté siempre a salvo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/terminos" className="text-xs font-black uppercase tracking-widest text-gold hover:underline">
              Ver Términos y Condiciones
            </Link>
            <span className="hidden sm:inline text-gray-800">|</span>
            <Link href="/soporte" className="text-xs font-black uppercase tracking-widest text-gold hover:underline">
              Contactar Oficial de Privacidad
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
