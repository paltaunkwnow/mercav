import { ThemeSwitch } from "@/components/site/cartel/SiteHeader";
import { FitLines } from "@/components/site/cartel/primitives";
import { PLink, GrapheneNote } from "@/components/privacy/blocks";
import { PrivacyNav } from "@/components/privacy/PrivacyNav";
import { SUPPORT_EMAIL } from "@/components/privacy/site";
import { SITE_URL } from "@/lib/seo/site";
import { DELIVERY } from "@/lib/privacy/catalog";

/*
 * Marco propio de privacy.mercav.lat: header y pie de la tienda. El header y el pie globales de Mercav no se muestran
 * en este host (lo resuelve el middleware y el layout raíz).
 */

export function PrivacyWordmark() {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="c-display text-[1.6rem] tracking-[0.02em]">Mercav</span>
      <span className="c-display c-strip px-1.5 text-[1.6rem] tracking-[0.02em]">Privacy</span>
    </span>
  );
}

export function PrivacyHeader() {
  return (
    <header className="c-nav relative z-[90] pt-[env(safe-area-inset-top,0px)] md:sticky md:top-0">
      <div className="c-container flex h-[var(--c-nav-h)] items-center gap-4">
        <PLink to="/" aria-label="Mercav Privacy, inicio" className="shrink-0 rounded-[2px]">
          <PrivacyWordmark />
        </PLink>
        <PrivacyNav className="ml-4 hidden md:block lg:ml-8" />
        <div className="ml-auto">
          <ThemeSwitch />
        </div>
      </div>
      <PrivacyNav compact className="c-container -mt-3 pb-1.5 md:hidden" />
    </header>
  );
}

type FooterLink = { to: string; label: string };

const STORE: FooterLink[] = [
  { to: "/billeteras-frias", label: "Billeteras frías" },
  { to: "/celulares", label: "Celulares" },
  { to: "/instalacion", label: "Instalación en tu Pixel" },
];

const HELP: FooterLink[] = [
  { to: "/pagos", label: "Pagos" },
  { to: "/envios", label: "Envíos" },
  { to: "/garantia", label: "Garantía" },
  { to: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
];

const LEGAL: FooterLink[] = [
  { to: "/terminos", label: "Términos" },
  { to: "/privacidad", label: "Privacidad" },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h2 className="c-label text-[1.15rem]">{title}</h2>
      <ul className="flex flex-col">
        {links.map((l) => (
          <li key={l.to}>
            <PLink to={l.to} className="inline-block rounded-[2px] py-1.5 text-[0.95rem] text-[var(--c-soft)] transition-colors duration-150 hover:text-[var(--c-text)]">
              {l.label}
            </PLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Pie de la tienda: siempre en la noche, como el del sitio. */
export function PrivacyFooter() {
  return (
    <footer className="c-night relative w-full border-t-2 border-[var(--c-line)] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-16 md:pt-24">
      <div className="c-container">
        <FitLines as="p" lines={[{ text: "Mercav Privacy", fit: 16.697 }]} className="max-w-[44rem]" />
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 lg:grid-cols-12 lg:gap-10">
          <div className="col-span-2 flex flex-col gap-5 md:col-span-4 lg:col-span-5">
            <p className="max-w-sm text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">
              Billeteras frías y celulares con sistema reforzado, a pedido. {DELIVERY.coverage}
            </p>
            <p className="text-[0.95rem] text-[var(--c-soft)]">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="c-link text-[var(--c-text)]">
                {SUPPORT_EMAIL}
              </a>
            </p>
            <GrapheneNote className="max-w-sm" />
          </div>
          <div className="lg:col-span-2 lg:col-start-7">
            <FooterColumn title="Tienda" links={STORE} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Ayuda" links={HELP} />
          </div>
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <FooterColumn title="Legal" links={LEGAL} />
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t-2 border-[var(--c-line)] pt-8 sm:flex-row sm:items-center">
          <p className="text-[0.95rem] text-[var(--c-muted)]">© {new Date().getFullYear()} Mercav · Sin rastreadores ni analítica en este sitio.</p>
          <a href={SITE_URL} className="c-link text-[0.95rem] font-semibold text-[var(--c-text)]">
            Volver a mercav.lat
          </a>
        </div>
      </div>
    </footer>
  );
}
// creado por pato dev y askforvini
