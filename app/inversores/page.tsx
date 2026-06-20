"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, Globe2, Users, BarChart3, Rocket, Target, DollarSign, Shield, ArrowRight, Star, Zap, CheckCircle2, Mail, Building2 } from "lucide-react";
import { useState } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
};

export default function InversoresPage() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/contact/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSent(true);
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-primary overflow-hidden">
      {/* Hero Section with golden gradient */}
      <section className="relative pt-24 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-gold/10 via-gold/3 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        
        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center pt-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold mb-8">
              <Star className="h-4 w-4 fill-gold" />
              Oportunidad de Inversión
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Una oportunidad de construir
              </span>
              <br />
              <span className="text-white">junto a Latinoamérica</span>
            </h1>
            
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300 leading-relaxed">
              Mercav está buscando su primer capital semilla para escalar lo que ya funciona. 
              Invertí en la infraestructura digital que le faltaba a toda una región.
            </p>
          </motion.div>

          {/* Key Metrics */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {[
              { label: "Mercado Objetivo", value: "660M+", sub: "personas en Latam" },
              { label: "Módulos Activos", value: "4", sub: "y creciendo" },
              { label: "Crecimiento Digital", value: "+12%", sub: "interanual en Latam" },
              { label: "TAM Estimado", value: "$85B", sub: "mercado regional" },
            ].map((metric, i) => (
              <div key={i} className="rounded-2xl border border-gold/20 bg-gold/5 p-6 text-center backdrop-blur-sm">
                <span className="font-display text-2xl md:text-3xl font-bold text-gold">{metric.value}</span>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{metric.label}</p>
                <p className="text-xs text-gold/60 mt-0.5">{metric.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* The Opportunity */}
      <section className="py-24 bg-bg-secondary border-y border-gold/10">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <GoldCard 
                icon={Target} 
                title="El Proyecto" 
                text="Mercav es una plataforma digital latinoamericana que integra en un solo ecosistema lo que hoy está fragmentado en docenas de herramientas separadas: publicidad offline, servicios digitales, bolsa de empleo y herramientas para empresas.

El mercado existe, el problema es real y la solución ya está construida. Lo que necesitamos ahora es escala."
              />
            </motion.div>
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
              <GoldCard 
                icon={Zap} 
                title="El Problema que Resolvemos" 
                text="1. La publicidad offline en Latinoamérica no tiene infraestructura digital. Los dueños dependen de contactos personales y negociaciones informales.

2. El mercado freelance latinoamericano carece de una plataforma regional confiable con garantías reales.

3. Las bolsas de empleo existentes están desactualizadas y no integran el perfil profesional con el proceso de selección."
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kerem by Mercav - Visionary Project */}
      <section className="py-32 bg-bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/[0.05] via-transparent to-transparent opacity-50" />
        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp} className="space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Próximamente: Kerem by Mercav</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter uppercase">
                Primer Restaurante <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold">100% Kosher</span> <br />
                en Bolivia
              </h2>

              <p className="text-xl text-gray-400 leading-relaxed font-medium">
                Mercav no es solo tecnología, es una visión de comunidad. Detectamos una necesidad ignorada: Bolivia cuenta con una comunidad valiosa pero sin acceso a gastronomía Kosher certificada.
              </p>

              <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl">
                <p className="text-lg text-gold/90 font-bold italic leading-relaxed">
                  "Kerem nace con el propósito de ofrecer la primera opción 100% Kosher en Santa Cruz, expandible a toda Latinoamérica."
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative aspect-square rounded-[4rem] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" 
                alt="Kerem Gastronomy" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
              />
              <div className="absolute bottom-10 left-10 right-10 z-20">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { t: "Certificación", s: "Kosher Estricta" },
                    { t: "Nutrición", s: "100% Saludable" },
                    { t: "Pureza", s: "Cero Cerdo" },
                    { t: "Escala", s: "Regional Latam" }
                  ].map((f, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                      <p className="text-[8px] font-black uppercase text-gold/60 tracking-widest mb-1">{f.t}</p>
                      <p className="text-xs font-bold text-white">{f.s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="mt-20 p-10 rounded-[3rem] bg-gold/[0.03] border border-gold/10 text-center">
            <p className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed">
              No es solo para una comunidad, es para todos. Una propuesta <span className="text-gold font-bold">100% saludable</span>, donde la pureza de los ingredientes es la ley: sin cerdo, sin mezclas prohibidas, solo alimentos en su estado más óptimo y aptos para cualquier persona que busque excelencia nutricional.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Now + Market */}
      <section className="py-24 bg-bg-primary">
        <div className="container mx-auto max-w-5xl px-4 space-y-12">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <GoldCard 
              icon={TrendingUp} 
              title="Por qué Ahora" 
              text="El acceso a internet en Latinoamérica creció un 12% en los últimos tres años. Hay más personas conectadas, más empresas digitalizándose y más profesionales buscando trabajar de forma independiente. Mercav llega en el momento exacto."
              fullWidth
            />
          </motion.div>

          {/* Investment Thesis Points */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }} className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-4">Tesis de Inversión</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Globe2, title: "Mercado Masivo", desc: "660+ millones de personas en Latinoamérica. Un mercado que crece año tras año en digitalización." },
              { icon: BarChart3, title: "Unit Economics Sólidos", desc: "Modelo de monetización diversificado: comisiones, suscripciones premium y herramientas de IA." },
              { icon: Shield, title: "Moat Competitivo", desc: "Ecosistema integrado que crea efectos de red. Los usuarios se quedan porque todo está conectado." },
              { icon: Rocket, title: "Escalabilidad", desc: "Infraestructura preparada para escalar país por país con costos marginales decrecientes." },
              { icon: Users, title: "Community-Led Growth", desc: "Crecimiento orgánico impulsado por la comunidad. Cada usuario trae más usuarios al ecosistema." },
              { icon: DollarSign, title: "Múltiples Revenue Streams", desc: "Comisiones, planes premium, herramientas con IA y publicidad programática en el futuro." },
            ].map((point, i) => (
              <motion.div 
                key={i}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-gold/15 bg-bg-secondary p-6 hover:border-gold/30 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <point.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="text-lg font-bold text-gold mb-2">{point.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{point.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 bg-bg-secondary border-y border-gold/10">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <GoldCard 
              icon={Star} 
              title="Quién está detrás" 
              text={`Me llamo Vinicius. Tengo 18 años.

Construí Mercav porque entendí que el problema no era de tecnología, era de fragmentación. Cada herramienta existía por separado, cara, inaccesible para la mayoría de las empresas pequeñas de la región.

Soy desarrollador autodidacta. Aprendí construyendo cosas reales para negocios reales. Construí sistemas de punto de venta, plataformas de comercio electrónico y herramientas digitales antes de cumplir los 18.

No tengo un título universitario. Tengo algo más útil: la certeza de que este problema existe, la capacidad técnica de resolverlo y la convicción de que Latinoamérica merece infraestructura digital propia.

Mi misión no es construir una empresa. Es construir el ecosistema que le faltaba a toda una región.`}
              fullWidth
            />
          </motion.div>
        </div>
      </section>

      {/* What we're looking for */}
      <section className="py-24 bg-bg-primary">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <GoldCard 
              icon={Users} 
              title="Lo que buscamos" 
              text="Estamos buscando inversores que no solo aporten capital, sino visión. Personas que entiendan el mercado latinoamericano, que crean en fundadores que construyen desde adentro y que quieran ser parte de algo que todavía está en sus primeros capítulos."
              fullWidth
            />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {[
              "Inversores ángeles con conexión a Latam",
              "Fondos de venture capital early-stage",
              "Mentores estratégicos con experiencia en marketplaces",
              "Partners tecnológicos que quieran co-construir"
            ].map((item, i) => (
              <motion.div 
                key={i}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4 p-5 rounded-2xl border border-gold/15 bg-bg-secondary"
              >
                <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                <span className="text-gray-200 font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 bg-bg-secondary border-t border-gold/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_center,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto max-w-3xl px-4 relative z-10">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="rounded-3xl border border-gold/20 bg-bg-primary/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-gold/5">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm text-gold mb-6">
                  <Mail className="h-3.5 w-3.5" />
                  Contacto Directo
                </div>
                <h2 className="text-3xl font-bold text-gold mb-3">Contacto para inversores</h2>
                <p className="text-sm text-gray-400 max-w-lg mx-auto">
                  Esta página tiene fines informativos. Cualquier proceso de inversión se llevará a cabo mediante documentación formal y acuerdos legales específicos.
                </p>
              </div>

              {sent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 className="h-16 w-16 text-gold mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-3">¡Mensaje enviado!</h3>
                  <p className="text-gray-400">Nos pondremos en contacto contigo a la brevedad.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
                  <div className="relative group">
                    <label className="text-xs text-gold/70 uppercase tracking-wider mb-2 block font-medium">Nombre completo</label>
                    <input 
                      name="name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Tu nombre" 
                      className="rounded-xl border border-gold/15 bg-bg-tertiary px-4 py-3.5 text-white outline-none w-full focus:border-gold/40 focus:ring-1 focus:ring-gold/10 transition-all placeholder:text-gray-600" 
                    />
                  </div>
                  <div className="relative group">
                    <label className="text-xs text-gold/70 uppercase tracking-wider mb-2 block font-medium">Email</label>
                    <input 
                      name="email" 
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="tu@email.com" 
                      className="rounded-xl border border-gold/15 bg-bg-tertiary px-4 py-3.5 text-white outline-none w-full focus:border-gold/40 focus:ring-1 focus:ring-gold/10 transition-all placeholder:text-gray-600" 
                    />
                  </div>
                  <div className="md:col-span-2 relative group">
                    <label className="text-xs text-gold/70 uppercase tracking-wider mb-2 block font-medium">Empresa u organización (opcional)</label>
                    <input 
                      name="company" 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Nombre de tu empresa" 
                      className="rounded-xl border border-gold/15 bg-bg-tertiary px-4 py-3.5 text-white outline-none w-full focus:border-gold/40 focus:ring-1 focus:ring-gold/10 transition-all placeholder:text-gray-600" 
                    />
                  </div>
                  <div className="md:col-span-2 relative group">
                    <label className="text-xs text-gold/70 uppercase tracking-wider mb-2 block font-medium">Mensaje</label>
                    <textarea 
                      name="message" 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="¿Por qué te interesa invertir en Mercav?" 
                      className="min-h-40 rounded-xl border border-gold/15 bg-bg-tertiary px-4 py-3.5 text-white outline-none w-full focus:border-gold/40 focus:ring-1 focus:ring-gold/10 transition-all placeholder:text-gray-600 resize-none" 
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button 
                      type="submit"
                      disabled={sending}
                      className="bg-gradient-to-r from-gold to-gold-light text-black font-semibold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all h-12"
                    >
                      {sending ? "Enviando..." : (
                        <span className="flex items-center gap-2">
                          Quiero saber más <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function GoldCard({ icon: Icon, title, text, fullWidth = false }: { icon: any; title: string; text: string; fullWidth?: boolean }) {
  return (
    <div className={`rounded-3xl border border-gold/15 bg-bg-secondary p-8 md:p-10 hover:border-gold/30 transition-all group relative overflow-hidden ${fullWidth ? '' : ''}`}>
      {/* Subtle gold glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gold/5 blur-3xl group-hover:bg-gold/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
          <Icon className="h-6 w-6 text-gold" />
        </div>
        <h2 className="text-2xl font-bold text-gold mb-4">{title}</h2>
        <p className="whitespace-pre-line text-gray-300 leading-7">{text}</p>
      </div>
    </div>
  );
}
