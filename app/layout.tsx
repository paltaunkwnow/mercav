import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, DM_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "@/components/layout/Providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Zap } from "lucide-react";


const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-display" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Mercav | Ecosistema Digital Latinoamericano",
  description: "Publicidad offline, servicios digitales, empleo y herramientas. Todo en una sola plataforma.",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await prisma.globalConfig.findUnique({ where: { id: "singleton" } });
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.roles?.includes("ADMIN");

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
    <html lang="es" className={cn("font-sans dark", jakarta.variable, outfit.variable, dmMono.variable)} suppressHydrationWarning>
      <head>
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
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <AnnouncementBar />
          <Header />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
// creado por pato dev y askforvini
