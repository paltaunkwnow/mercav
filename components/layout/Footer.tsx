"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { ManageCookiesLink } from "@/components/legal/ManageCookiesLink";

const focusLink =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

type FooterLink = { href: string; label: string; external?: boolean };

const MODULES: FooterLink[] = [
  { href: "/anuncios", label: "Mercav Ads" },
  { href: "/servicios", label: "Mercav Services" },
  { href: "/empleos", label: "Mercav Jobs" },
  { href: "/herramientas", label: "Mercav Tools" },
  { href: "/pwn", label: "Mercav Pwn" },
];

const PWN: FooterLink[] = [
  { href: "/pwn/exposure", label: "Consultar exposición" },
  { href: "/pwn/signals", label: "Señales de filtraciones" },
  { href: "/pwn/signals?gov=true", label: "Alertas gubernamentales" },
  { href: "/pwn/monitor", label: "Monitoreo" },
  { href: "/pwn/alerts", label: "Alertas" },
];

const PLATFORM: FooterLink[] = [
  { href: "/precios", label: "Planes y precios" },
  { href: "/inversores", label: "Inversores" },
  { href: "/por-que-mercav", label: "Por qué Mercav" },
  { href: "/faq", label: "Preguntas frecuentes" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/explorar", label: "Explorar" },
  { href: "/feed", label: "Feed" },
  { href: "/buscar", label: "Buscar" },
  { href: "/contacto", label: "Contacto" },
  { href: "/soporte", label: "Soporte" },
];

const LEGAL: FooterLink[] = [
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/cookies", label: "Política de cookies" },
  { href: "/pwn/terminos", label: "Términos Mercav Pwn" },
  { href: "/legal/uso-aceptable", label: "Uso aceptable" },
  { href: "/legal/reembolsos", label: "Pagos y reembolsos" },
  { href: "/legal/derechos", label: "Derechos de privacidad" },
];

const ACCOUNT: FooterLink[] = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/register", label: "Crear cuenta" },
  { href: "/dashboard", label: "Panel" },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">{title}</h2>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block py-1.5 text-sm text-gray-400 transition-colors hover:text-white ${focusLink}`}
              >
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className={`inline-block py-1.5 text-sm text-gray-400 transition-colors hover:text-white ${focusLink}`}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:border-gold/35 hover:bg-gold/5 hover:text-gold ${focusLink}`}
    >
      {children}
    </a>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname?.includes("/pos") || pathname?.includes("/admin")) return null;

  return (
    <footer className="relative w-full overflow-hidden bg-bg-primary pt-16 pb-10 md:pt-20 md:pb-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[280px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-gold/[0.03] blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-4">
            <Link href="/" className={`inline-flex w-fit items-center gap-2.5 ${focusLink}`}>
              <img src="/images/logo.png" alt="" className="h-9 w-9 object-contain" aria-hidden />
              <span className="font-display text-lg font-bold tracking-tight text-white">Mercav</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              Publicidad offline, servicios digitales, empleo, herramientas y ciberinteligencia. Todo en una sola plataforma.
            </p>
            <div className="flex items-center gap-2.5">
              <SocialIcon href="https://www.instagram.com/mercav.lat" label="Instagram de Mercav">
                <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.tiktok.com/@mercav.ar" label="TikTok de Mercav">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14 1.01.23 2.05.94 2.76.84.77 2.16.82 2.98.11.83-.65 1.1-1.74 1.15-2.75.06-4.03.01-8.05.03-12.08z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://github.com/invertilo" label="GitHub de Mercav">
                <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Módulos" links={MODULES} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Mercav Pwn" links={PWN} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Plataforma" links={PLATFORM} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Legal" links={LEGAL} />
            <div className="mt-8">
              <FooterColumn title="Cuenta" links={ACCOUNT} />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="flex items-center gap-2 text-center text-sm text-gray-500 sm:text-left">
            © {new Date().getFullYear()} Mercav
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold" aria-hidden>
              <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 3.2 20.2 17.4H3.8Z" />
              <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 20.8 3.8 6.6h16.4Z" />
            </svg>
            <span className="sr-only">Estrella de David</span>
            Latinoamérica.
          </p>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <ManageCookiesLink className={`text-xs text-gray-500 transition-colors hover:text-gold ${focusLink}`} />
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Globe className="h-3.5 w-3.5 text-gold/40" aria-hidden />
              <span>Disponible en 15 países</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
// creado por Patodev y Invertilo
