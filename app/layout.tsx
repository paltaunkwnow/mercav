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
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, hostKindFor } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

// La app y el sitio usan la letra del sistema (SF en Apple), como los celulares de la portada: --font-sans y
// --font-display viven en globals.css.
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });
// Letra del cartel del sitio público (mercav.lat). "block" porque los titulares se calibran a su ancho: con otra letra se desbordan.
const cartel = Big_Shoulders_Display({ weight: "variable", subsets: ["latin", "latin-ext"], variable: "--font-cartel", display: "block" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mercav — publicidad, talento, empleo y ciberinteligencia para Latinoamérica",
    template: "%s | Mercav",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Mercav",
    "publicidad exterior",
    "alquiler de vallas",
    "pantallas publicitarias",
    "freelancers",
    "talento digital",
    "empleos",
    "planillas de sueldo",
    "recursos humanos",
    "feriados",
    "calendario hebreo",
    "ciberseguridad",
    "filtraciones de datos",
    "kosher",
    "Latinoamérica",
  ],
  authors: [
    { name: "Mercav", url: SITE_URL },
    { name: "Vinicius Salazar", url: `${SITE_URL}/nosotros#vinicius` },
    { name: "Sebastian Rojas Cespedes", url: `${SITE_URL}/nosotros` },
    { name: "Alejandro Ismael Mendoza Diaz", url: `${SITE_URL}/nosotros` },
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
    title: "Mercav — tu negocio entero, en una sola cuenta",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Mercav — publicidad, talento, empleo y ciberinteligencia para Latinoamérica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mercav — tu negocio entero, en una sola cuenta",
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
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      sameAs: ["https://www.instagram.com/mercav.lat", "https://www.tiktok.com/@mercav.ar", "https://github.com/invertilo"],
      founder: [
        { "@type": "Person", name: "Vinicius Salazar", jobTitle: "CEO" },
        { "@type": "Person", name: "Sebastian Rojas Cespedes", jobTitle: "CTO" },
        { "@type": "Person", name: "Alejandro Ismael Mendoza Diaz", jobTitle: "CTO" },
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
  let config: any = null;
  let session: any = null;

  try {
    config = await prisma.globalConfig.findUnique({ where: { id: "singleton" } });
  } catch (e) {
    config = null;
  }

  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    session = null;
  }

  const isAdmin = session?.user?.roles?.includes("ADMIN");
  // The chrome can't infer the host from usePathname(): kosher.mercav.lat/mapa renders /kosher/mapa.
  const hostKind = hostKindFor(headers().get("host"));

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
        <script dangerouslySetInnerHTML={{
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
        <Providers>
          <HostProvider kind={hostKind}>
            <a href="#contenido" className="mv-skip">Saltar al contenido</a>
            <AnnouncementBar />
            <Header />
            <main id="contenido" tabIndex={-1} className="flex-1 w-full flex flex-col outline-none">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </HostProvider>
        </Providers>
      </body>
    </html>
  );
}
// creado por pato dev y askforvini
