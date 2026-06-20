"use client";
import Link from "next/link";
import { Users, Heart, Globe } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.includes('/pos') || pathname?.includes('/admin')) return null;

  return (
    <footer className="w-full bg-bg-secondary border-t border-border pt-16 md:pt-20 pb-8 relative overflow-hidden section-transition">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/[0.02] blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="MERCAV" className="h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Publicidad offline, servicios digitales, empleo y herramientas. Todo en una sola plataforma.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a href="https://www.instagram.com/mercav.lat" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-bg-tertiary/50 border border-border flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-300">
                <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@mercav.ar" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-bg-tertiary/50 border border-border flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-300">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14 1.01.23 2.05.94 2.76.84.77 2.16.82 2.98.11.83-.65 1.1-1.74 1.15-2.75.06-4.03.01-8.05.03-12.08z"/>
                </svg>
              </a>
              <a href="https://github.com/invertilo" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-bg-tertiary/50 border border-border flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-300">
                <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Links: Módulos */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Módulos</h4>
            {[
              { href: "/anuncios", label: "Mercav Ads" },
              { href: "/servicios", label: "Mercav Services" },
              { href: "/empleos", label: "Mercav Jobs" },
              { href: "/herramientas", label: "Mercav Tools" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-400 text-sm hover:text-gold transition-colors duration-300 py-1 hover:translate-x-1 transform transition-transform">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Links: Plataforma */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Plataforma</h4>
            {[
              { href: "/precios", label: "Planes y Precios" },
              { href: "/inversores", label: "Inversores" },
              { href: "/por-que-mercav", label: "Por qué Mercav" },
              { href: "/faq", label: "Preguntas Frecuentes" },
              { href: "/nosotros", label: "Nosotros" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-400 text-sm hover:text-gold transition-colors duration-300 py-1 hover:translate-x-1 transform transition-transform">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Links: Legal */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Legal</h4>
            {[
              { href: "/terminos", label: "Términos y Condiciones" },
              { href: "/privacidad", label: "Política de Privacidad" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-400 text-sm hover:text-gold transition-colors duration-300 py-1 hover:translate-x-1 transform transition-transform">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm flex items-center gap-2">
            © {new Date().getFullYear()} Mercav. Construido con <Heart className="h-3 w-3 text-gold/50" /> en Latinoamérica.
          </p>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <Globe className="h-3.5 w-3.5 text-gold/30" />
            <span>Disponible en 15 países</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
