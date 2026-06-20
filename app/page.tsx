import { prisma } from "@/lib/prisma";
import { 
  HomeHero, 
  HomeModules, 
  HomeLatestActivity, 
  HomeStats, 
  HomeCTA 
} from "@/components/home/HomeClient";
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

interface ActivityItem {
  id: string;
  type: 'SERVICE' | 'SPACE' | 'JOB';
  title: string;
  location: string;
  price?: string;
  category: string;
  createdAt: Date;
  image?: string;
}

export default async function Home() {
  // Fetch real data from all modules
  // Fetch global config for featured items
  const config = await prisma.globalConfig.findUnique({
    where: { id: "singleton" }
  });

  // Fetch featured items specifically if IDs are set
  const [featuredService, featuredSpace, latestSpaces, latestServices, latestJobs] = await Promise.all([
    config?.featuredServiceId ? prisma.service.findUnique({
      where: { id: config.featuredServiceId, isActive: true },
      include: { packages: { orderBy: { price: 'asc' }, take: 1 } }
    }) : null,
    config?.featuredSpaceId ? prisma.space.findUnique({
      where: { id: config.featuredSpaceId, isActive: true },
      include: { images: { take: 1 } }
    }) : null,
    prisma.space.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { images: { take: 1 } }
    }),
    prisma.service.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { packages: { orderBy: { price: 'asc' }, take: 1 } }
    }),
    prisma.jobPost.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Combine and format activity
  const items: ActivityItem[] = [
    ...(featuredSpace ? [{
      id: featuredSpace.id,
      type: 'SPACE' as const,
      title: `[DESTACADO] ${featuredSpace.title}`,
      location: `${featuredSpace.city}, ${featuredSpace.country}`,
      price: featuredSpace.pricePerMonth ? `$${featuredSpace.pricePerMonth}/mes` : undefined,
      category: featuredSpace.type.replace('_', ' '),
      createdAt: new Date(), // Set current date to ensure it stays at top
      image: featuredSpace.images[0]?.url
    }] : []),
    ...(featuredService ? [{
      id: featuredService.id,
      type: 'SERVICE' as const,
      title: `[DESTACADO] ${featuredService.title}`,
      location: 'Remoto / Global',
      price: featuredService.packages[0] ? `Desde $${featuredService.packages[0].price}` : undefined,
      category: featuredService.category.replace('_', ' '),
      createdAt: new Date()
    }] : []),
    ...latestSpaces.map(s => ({
      id: s.id,
      type: 'SPACE' as const,
      title: s.title,
      location: `${s.city}, ${s.country}`,
      price: s.pricePerMonth ? `$${s.pricePerMonth}/mes` : undefined,
      category: s.type.replace('_', ' '),
      createdAt: s.createdAt,
      image: s.images[0]?.url
    })),
    ...latestServices.map(s => ({
      id: s.id,
      type: 'SERVICE' as const,
      title: s.title,
      location: 'Remoto / Global',
      price: s.packages[0] ? `Desde $${s.packages[0].price}` : undefined,
      category: s.category.replace('_', ' '),
      createdAt: s.createdAt
    })),
    ...latestJobs.map(j => ({
      id: j.id,
      type: 'JOB' as const,
      title: j.title,
      location: `${j.city}, ${j.country}`,
      price: j.salaryVisible && j.salaryMin ? `$${j.salaryMin}+` : 'Confidencial',
      category: j.employmentType.replace('_', ' '),
      createdAt: j.createdAt
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);

  return (
    <div className="flex flex-col w-full min-h-screen overflow-hidden">
      <HomeHero />
      <HomeModules />
      <HomeStats />

      {/* Feature Split Section */}
      <section className="w-full py-24 md:py-32 bg-bg-secondary overflow-hidden relative section-transition">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
          <div className="absolute top-1/2 left-[60%] -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.02] blur-[180px] rounded-full" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <div className="flex-1 space-y-8">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Nuestra promesa
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Construido diferente. <br/>
                <span className="gradient-text-gold">Construido para vos.</span>
              </h2>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                Mercav elimina los intermediarios innecesarios y las comisiones abusivas. 
                Si tenés un espacio, tu primer alquiler es completamente libre de comisiones. 
                Si buscas talento, lo encuentras con transparencia total.
              </p>
              <ul className="space-y-4">
                {[
                  "Primer alquiler de espacios sin costo de plataforma",
                  "Escrow seguro para servicios digitales",
                  "Perfiles verificados y reseñas reales",
                  "Sin emojis, diseño 100% profesional"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300 group">
                    <div className="h-6 w-6 rounded-lg bg-gold/10 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                    </div>
                    <span className="group-hover:text-white transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60 rounded-xl px-6 transition-all duration-300">
                <Link href="/por-que-mercav">Leer el manifiesto</Link>
              </Button>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="aspect-square max-w-md mx-auto rounded-full bg-gradient-to-tr from-gold/20 to-transparent blur-3xl absolute inset-0 -z-10 opacity-50" />
              <div className="relative group perspective-[1000px]">
                {/* Advanced glow behind card */}
                <div className="absolute -inset-2 bg-gradient-to-r from-gold/40 to-gold/10 rounded-3xl blur-xl opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                
                <div className="relative bg-bg-secondary/90 backdrop-blur-2xl p-8 rounded-3xl border border-border shadow-2xl overflow-hidden transform lg:rotate-3 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:rotate-0 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] glassmorphism card-hover-premium section-transition">
                  {/* Decorative Scan Line Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent -translate-y-full group-hover:animate-scanline pointer-events-none" />
                  
                  {/* Receipt Header */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <h4 className="text-white font-bold text-lg tracking-tight uppercase text-[12px]">Certificado de Transacción</h4>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">ID: MRC-5592-X90-GOLD</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center relative">
                      <CheckCircle2 className="h-6 w-6 text-gold" />
                      <div className="absolute inset-0 rounded-full border border-gold/40 animate-ping opacity-20" />
                    </div>
                  </div>

                  {/* Receipt Body */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Activo Digital</p>
                      <h5 className="text-white font-medium text-lg">Valla en Av. Principal</h5>
                    </div>

                    <div className="space-y-4 pt-4 relative">
                      {/* Dotted separator */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      
                      <div className="flex justify-between items-center group/row">
                        <span className="text-gray-400 text-sm group-hover/row:text-gray-300 transition-colors">Precio Base</span>
                        <span className="text-white font-mono font-medium">$ 500.00</span>
                      </div>

                      <div className="flex justify-between items-center group/row">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm group-hover/row:text-gray-300 transition-colors">Comisión Mercav</span>
                          <span className="text-[9px] text-gold font-black uppercase tracking-tighter bg-gold/5 border border-gold/10 px-1.5 py-0.5 rounded w-fit mt-1">Primer alquiler • Free</span>
                        </div>
                        <span className="text-green-500 font-mono font-medium">$ 0.00</span>
                      </div>

                      {/* Perforated separator look */}
                      <div className="py-4 flex items-center gap-2 opacity-30">
                         <div className="h-[2px] flex-1 border-dashed border-t border-gold/30" />
                         <div className="h-2 w-2 rounded-full bg-gold/40" />
                         <div className="h-[2px] flex-1 border-dashed border-t border-gold/30" />
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-black">Neto Final</p>
                           <span className="text-white font-bold text-sm">Total a recibir</span>
                        </div>
                        <div className="text-right">
                           <span className="text-gold font-mono font-black text-3xl drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">$ 500.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certified Footnote */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Verified by Mercav Security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Activity Feed */}
      <HomeLatestActivity items={JSON.parse(JSON.stringify(items))} />

      <HomeCTA />
    </div>
  );
}
