import type { Metadata, Viewport } from "next";
import { DM_Mono, Big_Shoulders_Display } from "next/font/google";
// cartel.css va antes que Tailwind: sus clases ganan al preflight por especificidad y las utilidades
// (text-[…], hidden, sm:inline-flex) ganan a las clases del cartel por orden.
import "./cartel.css";
import "./globals.css";
import "./icons.css";
import "./mervi.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "@/components/layout/Providers";
import { HostProvider } from "@/components/layout/HostContext";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { Zap } from "@/components/icons";
import { Suspense } from "react";
import { SplashScreen } from "@/components/splash/SplashScreen";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_PROFILES, X_HANDLE, canonicalFor, hostKindFor, isNoindexPath, isPrivacyMode } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

// La app y el sitio usan la letra del sistema (SF en Apple), como los celulares de la portada: --font-sans y
// --font-display viven en globals.css.
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });
// Letra del cartel del sitio público (mercav.lat). "block" porque los titulares se calibran a su ancho: con otra letra se desbordan.
const cartel = Big_Shoulders_Display({ weight: "variable", subsets: ["latin", "latin-ext"], variable: "--font-cartel", display: "block" });

const TITLE = "Mercav — tu negocio entero, en una sola cuenta";

const BASE_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Mercav",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Mercav",
    "caja para negocios",
    "punto de venta",
    "inventario",
    "planillas de sueldo",
    "planillas Bolivia",
    "fidelización de clientes",
    "tarjeta de sellos",
    "ciberseguridad para empresas",
    "filtraciones de datos",
    "atlas kosher",
    "calendario hebreo",
    "feriados Latinoamérica",
    "publicidad exterior",
    "empleos",
    "Latinoamérica",
  ],
  authors: [
    { name: "Mercav", url: SITE_URL },
    { name: "Vinicius Salazar", url: `${SITE_URL}/nosotros#vinicius` },
    { name: "Sebastian Rojas Cespedes", url: `${SITE_URL}/nosotros#sebastian` },
    { name: "Alejandro Ismael Mendoza Diaz", url: `${SITE_URL}/nosotros#alejandro` },
    { name: "Marco Sánchez", url: `${SITE_URL}/nosotros#marco` },
  ],
  creator: "Mercav",
  publisher: "Mercav",
  category: "business",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_419",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: X_HANDLE,
    creator: X_HANDLE,
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  appleWebApp: { capable: true, title: "Mercav", statusBarStyle: "black-translucent" },
  // Versioned so browsers drop the old cached favicon.
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icons/favicon-16.png?v=3", type: "image/png", sizes: "16x16" },
      { url: "/icons/favicon-32.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/icons/favicon-512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/icons/apple-touch-icon.png?v=3", sizes: "180x180" }],
  },
  // Google Search Console: el código de la etiqueta HTML va en GOOGLE_SITE_VERIFICATION (con la verificación por DNS no hace falta).
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

/**
 * Cada página declara su URL canónica y su og:url. El middleware manda la ruta en x-mercav-path; las áreas privadas
 * (noindex) no llevan canónica. Una página que define su propio alternates u openGraph lo pisa.
 */
export function generateMetadata(): Metadata {
  const path = headers().get("x-mercav-path");
  if (!path || isNoindexPath(path)) return BASE_METADATA;
  const canonical = canonicalFor(path);
  return { ...BASE_METADATA, alternates: { canonical }, openGraph: { ...BASE_METADATA.openGraph, url: canonical } };
}

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description: SITE_DESCRIPTION,
      sameAs: Object.values(SOCIAL_PROFILES),
      founder: [
        { "@type": "Person", name: "Vinicius Salazar", jobTitle: "Fundador y CEO" },
        { "@type": "Person", name: "Sebastian Rojas Cespedes", jobTitle: "Cofundador" },
        { "@type": "Person", name: "Alejandro Ismael Mendoza Diaz", jobTitle: "CTO" },
        { "@type": "Person", name: "Marco Sánchez", jobTitle: "Representante en Costa Rica" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/buscar?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await prisma.globalConfig.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const session = await getServerSession(authOptions).catch(() => null);

  const isAdmin = session?.user?.roles?.includes("ADMIN");
  // The chrome can't infer the host from usePathname(): kosher.mercav.lat/mapa renders /kosher/mapa.
  const hostKind = hostKindFor(headers().get("host"));
  // Mercav Privacy: sin rastreadores ni terceros, y sin el header, el footer ni la barra de Mercav (trae su propio shell
  // en app/privacy/layout.tsx). El nonce de su CSP (middleware.ts) habilita el script del tema.
  const appPath = headers().get("x-mercav-path");
  const privacy = isPrivacyMode(hostKind, appPath);
  const mail = hostKind === "mail" || (hostKind === "dev" && !!appPath && appPath.startsWith("/mail"));
  const nonce = privacy || mail ? headers().get("x-nonce") ?? undefined : undefined;

  if (config?.maintenanceMode && !isAdmin) {
    return (
      <html lang="es" className="dark" suppressHydrationWarning>
        <body className="bg-black text-white flex flex-col items-center justify-center min-h-screen p-4 text-center font-sans">
           <div className="h-20 w-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-8 animate-pulse">
              <Zap className="h-10 w-10" />
           </div>
           <h1 className="text-4xl font-display font-black mb-4 uppercase tracking-tighter">Mantenimiento en Curso</h1>
           <p className="text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
             {config?.maintenanceMessage || "Estamos optimizando el ecosistema MERCAV. Volveremos en unos minutos con mejoras significativas."}
           </p>
           <div className="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Operación Administrativa Activa
           </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es" className={cn("font-sans dark", dmMono.variable, cartel.variable)} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
        {/* Prevent flash of wrong theme */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{
          __html: `
            try {
              const theme = localStorage.getItem('mercav-theme');
              if (theme === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              }
            } catch(e) {}
          `
        }} />
      </head>
      <body className="flex min-h-dvh flex-col overflow-x-clip antialiased">
        <Providers privacy={privacy || mail}>
          <HostProvider kind={hostKind}>
            <a href="#contenido" className="mv-skip">Saltar al contenido</a>
            {!privacy && !mail && <AnnouncementBar />}
            {!privacy && !mail && <Header />}
            <main id="contenido" tabIndex={-1} className="flex-1 w-full flex flex-col outline-none">
              {/* Al entrar a la app, Mervi tapa la pantalla mientras la página termina de cargar en el servidor. Las
                  rutas con su propio loading.tsx muestran el suyo; Privacy y Mail traen su propio shell, sin Mervi. */}
              {privacy || mail ? children : <Suspense fallback={<SplashScreen fullscreen />}>{children}</Suspense>}
            </main>
            {!privacy && !mail && <Footer />}
            {!privacy && !mail && <BottomNav />}
          </HostProvider>
        </Providers>
      </body>
    </html>
  );
}
