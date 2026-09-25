"use client";

import { motion } from "framer-motion";
import { MonitorPlay, Briefcase, Hash, PenTool, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PUBLISH_OPTIONS = [
  {
    id: "ads",
    title: "Anuncio Físico",
    desc: "Alquila tu valla, pantalla LED o paredón a marcas.",
    icon: MonitorPlay,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  {
    id: "service",
    title: "Servicio Profesional",
    desc: "Ofrece tus habilidades en desarrollo, diseño o marketing.",
    icon: PenTool,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  {
    id: "job",
    title: "Oferta de Empleo",
    desc: "Encuentra el talento perfecto para tu empresa.",
    icon: Briefcase,
    color: "bg-green-500/10 text-green-500 border-green-500/20"
  }
];

export default function PublicarPage() {
  return (
    <div className="w-full min-h-screen bg-bg-primary pb-24 pt-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10 mt-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">¿Qué te gustaría publicar?</h1>
          <p className="text-gray-400">Selecciona el tipo de publicación que deseas crear para conectar con miles de usuarios en Latinoamérica.</p>
        </div>

        <div className="space-y-4">
          {PUBLISH_OPTIONS.map((option, i) => {
            const Icon = option.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={option.id}
              >
                <Link href={`/dashboard/crear?type=${option.id}`}>
                  <div className="bg-bg-secondary border border-border p-6 rounded-2xl flex items-center gap-6 hover:border-gold hover:bg-bg-tertiary transition-all group cursor-pointer">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${option.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors">{option.title}</h3>
                      <p className="text-sm text-gray-400">{option.desc}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-bg-primary border border-border flex items-center justify-center group-hover:bg-gold group-hover:text-black group-hover:border-gold transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 p-6 bg-gold/5 border border-gold/20 rounded-2xl text-center">
          <Hash className="w-8 h-8 text-gold mx-auto mb-3" />
          <h3 className="text-white font-bold mb-2">Totalmente Gratis</h3>
          <p className="text-sm text-gray-400">
            Publicar tus servicios o espacios publicitarios es 100% gratuito. Mercav solo cobra una pequeña comisión cuando consigues un cliente a través de la plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
