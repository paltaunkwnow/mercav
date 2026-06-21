"use client";

import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState({
    newMessages: true,
    jobApplications: true,
    serviceUpdates: true,
    followers: true,
    projectMilestones: true,
    platformNews: false,
    weeklyDigest: true,
    emailNotifications: true
  });

  const handleToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const categories = [
    {
      title: "Mensajería",
      items: [
        { key: "newMessages", label: "Nuevos mensajes directos" },
        { key: "emailNotifications", label: "Recibir notificaciones por email" }
      ]
    },
    {
      title: "Empleos",
      items: [
        { key: "jobApplications", label: "Nuevas postulaciones a mis vacantes" }
      ]
    },
    {
      title: "Servicios",
      items: [
        { key: "serviceUpdates", label: "Actualizaciones de mis servicios" },
        { key: "projectMilestones", label: "Hitos de proyectos" }
      ]
    },
    {
      title: "Redes",
      items: [
        { key: "followers", label: "Nuevos seguidores" }
      ]
    },
    {
      title: "Mercav",
      items: [
        { key: "platformNews", label: "Noticias y actualizaciones de Mercav" },
        { key: "weeklyDigest", label: "Resumen semanal de actividad" }
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/perfil" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mi perfil
        </Link>

        <h1 className="font-display text-4xl font-bold text-white mb-2">Preferencias de Notificaciones</h1>
        <p className="text-gray-400 mb-12">Controla qué notificaciones quieres recibir y cómo.</p>

        <div className="space-y-8">
          {categories.map((category, idx) => (
            <section key={idx} className="bg-bg-secondary border border-border p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-6">{category.title}</h2>

              <div className="space-y-4">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg border border-border">
                    <span className="text-white font-medium">{item.label}</span>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications] ? "bg-gold" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="bg-gold/10 border border-gold/20 p-8 rounded-2xl">
            <div className="flex gap-3">
              <Bell className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gold mb-2">Tip: Email Notifications</h3>
                <p className="text-gray-300 text-sm">Habilitar notificaciones por email te mantiene actualizado incluso cuando no estés en la plataforma.</p>
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <Button variant="outline" className="border-border text-white hover:border-gold">
              Cancelar
            </Button>
            <Button className="bg-gold text-black hover:bg-gold-light">
              Guardar Preferencias
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
