"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ManageCookiesLink } from "@/components/legal/ManageCookiesLink";
import { hidesGlobalChrome, isSiteChrome } from "@/components/layout/Header";
import { HostLink, useAppPathname, useHostKind } from "@/components/layout/HostContext";
import { SOCIAL_PROFILES, APP_HOME } from "@/lib/seo/site";
import { FitLines, Starburst } from "@/components/site/cartel/primitives";
import { Mervi } from "@/components/mervi/Mervi";

const focusLink =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

type FooterLink = { href: string; label: string; external?: boolean };

const COMPANY: FooterLink[] = [
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/pitch", label: "Pitch" },
  { href: "/inversores", label: "Inversores" },
  { href: "/feriados", label: "Feriados por país" },
];

const APPS: FooterLink[] = [
  { href: "/business", label: "Mercav Business" },
  { href: "/pwn", label: "Mercav Pwn" },
  { href: "/kosher", label: "Mercav Kosher" },
];

const APP: FooterLink[] = [
  { href: APP_HOME, label: "Entrar a la app" },
  { href: "/register", label: "Crear cuenta" },
  { href: "/login", label: "Iniciar sesión" },
];

const LEGAL: FooterLink[] = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/cookies", label: "Política de cookies" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/legal/uso-aceptable", label: "Uso aceptable" },
  { href: "/legal/reembolsos", label: "Pagos y reembolsos" },
  { href: "/legal/derechos", label: "Derechos de privacidad" },
];

/** Pie mínimo de app.mercav.lat (y kosher.mercav.lat): deja aire sobre la barra inferior y los links legales a mano. */
function AppFooter() {
  return (
    <footer data-site-footer className="relative w-full pb-nav pt-6">
      <div className="mv-container flex flex-col items-center justify-between gap-3 border-t border-[var(--mv-hairline)] pt-6 text-xs text-[var(--text-tertiary)] sm:flex-row">
        <p>© {new Date().getFullYear()} Mercav</p>
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {/* Términos y privacidad viven en mercav.lat; HostLink los lleva allá con un link absoluto. */}
          <HostLink href="/terminos" className={`transition-colors hover:text-[var(--text-primary)] ${focusLink}`}>Términos</HostLink>
          <HostLink href="/privacidad" className={`transition-colors hover:text-[var(--text-primary)] ${focusLink}`}>Privacidad</HostLink>
          <HostLink href="/soporte" className={`transition-colors hover:text-[var(--text-primary)] ${focusLink}`}>Soporte</HostLink>
          <ManageCookiesLink className={`transition-colors hover:text-gold ${focusLink}`} />
        </nav>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h2 className="c-label text-[1.15rem] text-[var(--c-yellow-text)]">{title}</h2>
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <HostLink href={link.href} className="inline-block rounded-[2px] py-1.5 text-[0.95rem] text-[var(--c-soft)] transition-colors hover:text-[var(--c-text)]">
              {link.label}
            </HostLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-[2px] text-[var(--c-soft)] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-colors hover:text-[var(--c-yellow-text)] hover:shadow-[inset_0_0_0_2px_currentColor]"
    >
      {children}
    </a>
  );
}

/** Pie del sitio público: el cierre del cartel, siempre en la noche. */
function SiteFooter() {
  return (
    <footer data-site-footer className="cartel c-night relative w-full pb-10 pt-16 md:pt-24">
      <div className="c-container">
        <Mervi pose="durmiendo" scale={1} className="absolute right-[max(var(--c-gutter),calc((100vw-80rem)/2+var(--c-gutter)))] top-[calc(var(--mervi-unit)*-91)]" label="Mervi, la mascota de Mercav, durmiendo" />
        <FitLines as="p" lines={[{ text: "Mercav", fit: 34.531, className: "c-text-gold" }]} className="max-w-[40rem]" />
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 lg:grid-cols-12 lg:gap-10">
          <div className="col-span-2 flex flex-col gap-6 md:col-span-4 lg:col-span-4">
            <p className="max-w-sm text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">
              Mercav Business para operar tu negocio, Mercav Pwn para protegerlo y Mercav Kosher para la comunidad. Una sola cuenta, en toda Latinoamérica.
            </p>
            <div className="flex items-center gap-2">
              <SocialIcon href={SOCIAL_PROFILES.instagram} label="Instagram de Mercav">
                <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL_PROFILES.x} label="X de Mercav">
                <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL_PROFILES.tiktok} label="TikTok de Mercav">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14 1.01.23 2.05.94 2.76.84.77 2.16.82 2.98.11.83-.65 1.1-1.74 1.15-2.75.06-4.03.01-8.05.03-12.08z" />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL_PROFILES.github} label="GitHub de Mercav">
                <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </SocialIcon>
            </div>
          </div>
          <div className="lg:col-span-2 lg:col-start-5">
            <FooterColumn title="Apps" links={APPS} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Tu cuenta" links={APP} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Compañía" links={COMPANY} />
          </div>
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <FooterColumn title="Legal" links={LEGAL} />
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t-2 border-[var(--c-line)] pt-8 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-[0.95rem] text-[var(--c-muted)]">
            © {new Date().getFullYear()} Mercav
            <Starburst className="c-text-yellow h-3 w-3" />
            Hecho en Latinoamérica.
          </p>
          <ManageCookiesLink className="text-[0.95rem] text-[var(--c-muted)] transition-colors hover:text-[var(--c-text)]" />
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  const pathname = usePathname();
  const appPath = useAppPathname();
  const hostKind = useHostKind();
  if (hidesGlobalChrome(pathname) || appPath === "/kosher/mapa" || appPath === "/mensajes") return null;
  if (!isSiteChrome(hostKind, pathname)) return <AppFooter />;
  return <SiteFooter />;
}
// creado por pato dev y askforvini
