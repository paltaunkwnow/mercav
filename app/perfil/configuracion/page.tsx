"use client";

import {
  Shield,
  KeyRound,
  Bell,
  User,
  CreditCard,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { Container } from "@/components/site/primitives";

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();

  const sections = [
    { icon: User, label: "Información de la cuenta", desc: "Nombre, foto, titular y datos de tu perfil", href: "/perfil/editar" },
    { icon: KeyRound, label: "Seguridad", desc: "Verificación en dos pasos", href: "/perfil/editar#security" },
    { icon: Bell, label: "Notificaciones", desc: "Alertas de mensajes y actividad", href: "/notificaciones-settings" },
    { icon: Shield, label: "Privacidad", desc: "Cómo tratamos tus datos en Mercav", href: "/privacidad" },
    { icon: CreditCard, label: "Plan y pagos", desc: "Tu plan actual y opciones de facturación", href: "/precios" },
  ];

  const themes = [
    { value: "dark", label: "Oscuro", desc: "Menos brillo, ideal de noche", icon: Moon },
    { value: "light", label: "Claro", desc: "Más luminosidad y contraste", icon: Sun },
  ] as const;

  return (
    <div className="relative w-full bg-bg-primary pb-16 pt-24 md:pb-24 md:pt-28">
      <div className="mv-aura" aria-hidden />
      <Container className="relative max-w-[48rem]">
        <Link href="/perfil" className="mv-focus mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a mi perfil
        </Link>

        <header>
          <p className="mv-kicker">Tu cuenta</p>
          <h1 className="mv-h2 mt-3">Configuración</h1>
          <p className="mv-body mt-2">Apariencia, seguridad y preferencias de tu cuenta Mercav.</p>
        </header>

        {/* Appearance */}
        <section aria-labelledby="cfg-apariencia" className="mt-10">
          <h2 id="cfg-apariencia" className="mv-h3">Apariencia</h2>
          <div role="radiogroup" aria-labelledby="cfg-apariencia" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {themes.map(({ value, label, desc, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(value)}
                  className={`mv-focus relative flex items-center gap-4 rounded-[1.25rem] border p-4 text-left transition-colors duration-200 sm:p-5 ${
                    active
                      ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]"
                      : "border-[var(--mv-hairline)] bg-[var(--mv-panel)] hover:bg-[var(--mv-panel-hover)]"
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-gold text-[var(--mv-on-gold)]" : "border border-[var(--mv-hairline)] text-[var(--text-secondary)]"}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--text-primary)]">{label}</span>
                    <span className="block text-sm text-[var(--text-secondary)]">{desc}</span>
                  </span>
                  {active && <Check className="h-5 w-5 shrink-0 text-gold" aria-hidden />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Account */}
        <section aria-labelledby="cfg-cuenta" className="mt-10">
          <h2 id="cfg-cuenta" className="mv-h3">Cuenta</h2>
          <ul className="mv-panel mt-4 overflow-hidden p-1.5">
            {sections.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="mv-focus group flex items-center gap-4 rounded-[1.1rem] p-3.5 transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] sm:p-4"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-gold">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--text-primary)]">{item.label}</span>
                    <span className="block truncate text-sm text-[var(--text-secondary)]">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Session */}
        <section aria-labelledby="cfg-sesion" className="mt-10 flex flex-col gap-4 rounded-[1.5rem] border border-red-500/20 bg-red-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 id="cfg-sesion" className="font-semibold text-[var(--text-primary)]">Sesión</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Cerrá la sesión en este dispositivo.</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mv-btn w-full border border-red-500/25 text-red-400 hover:bg-red-500/10 sm:w-auto"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
          </button>
        </section>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
