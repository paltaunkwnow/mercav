"use client";

import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/site/primitives";
import { useState } from "react";

type NotificationKey =
  | "newMessages"
  | "jobApplications"
  | "serviceUpdates"
  | "followers"
  | "projectMilestones"
  | "platformNews"
  | "weeklyDigest"
  | "emailNotifications";

export default function NotificacionesPage() {
  // Todavía no existe un modelo/endpoint para guardar preferencias de notificación:
  // los switches son locales y el botón de guardar queda deshabilitado (no simulamos guardado).
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    newMessages: true,
    jobApplications: true,
    serviceUpdates: true,
    followers: true,
    projectMilestones: true,
    platformNews: false,
    weeklyDigest: true,
    emailNotifications: true
  });

  const handleToggle = (key: NotificationKey) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const categories: { title: string; items: { key: NotificationKey; label: string }[] }[] = [
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
    <div className="relative w-full bg-bg-primary pb-16 pt-24 md:pb-24 md:pt-28">
      <div className="mv-aura" aria-hidden />
      <Container className="relative max-w-[48rem]">
        <Link href="/perfil" className="mv-focus mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a mi perfil
        </Link>

        <header>
          <p className="mv-kicker">Tu cuenta</p>
          <h1 className="mv-h2 mt-3">Notificaciones</h1>
          <p className="mv-body mt-2">Elegí qué avisos querés recibir y por dónde.</p>
        </header>

        <div className="mt-10 space-y-8">
          {categories.map((category) => (
            <section key={category.title} aria-labelledby={`notif-${category.title}`}>
              <h2 id={`notif-${category.title}`} className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">{category.title}</h2>
              <ul className="mv-panel overflow-hidden">
                {category.items.map((item, itemIdx) => {
                  const on = notifications[item.key];
                  const id = `notif-${item.key}`;
                  return (
                    <li key={item.key} className={itemIdx > 0 ? "border-t border-[var(--mv-hairline)]" : undefined}>
                      <div className="flex min-h-[3.75rem] items-center justify-between gap-4 px-4 py-3 sm:px-5">
                        <label htmlFor={id} className="flex-1 cursor-pointer text-[15px] font-medium text-[var(--text-primary)]">
                          {item.label}
                        </label>
                        <button
                          id={id}
                          type="button"
                          role="switch"
                          aria-checked={on}
                          onClick={() => handleToggle(item.key)}
                          className={`mv-focus relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 ${
                            on ? "border-transparent bg-gold" : "border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)]"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 [transition-timing-function:var(--ease-out)] ${
                              on ? "translate-x-[1.45rem]" : "translate-x-[0.2rem]"
                            }`}
                          />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <aside className="flex gap-3 rounded-[1.25rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-5">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Avisos por email.</span>{" "}
              Con las notificaciones por email activas te enterás de mensajes y actividad aunque no estés en Mercav.
            </p>
          </aside>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href="/perfil" className="mv-btn mv-btn-ghost w-full sm:w-auto">
              Cancelar
            </Link>
            <button
              type="button"
              disabled
              aria-describedby="notif-save-note"
              className="mv-btn mv-btn-primary w-full cursor-not-allowed opacity-60 sm:w-auto"
            >
              Guardar preferencias
            </button>
          </div>
          <p id="notif-save-note" className="text-right text-xs text-[var(--text-secondary)]">
            Todavía no podemos guardar estas preferencias. Por ahora los cambios no se conservan.
          </p>
        </div>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
