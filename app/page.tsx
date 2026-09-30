import { prisma } from "@/lib/prisma";
import { 
  HomeHero, 
  HomeModules, 
  HomeLatestActivity, 
  HomeStats, 
  HomeCTA 
} from "@/components/home/HomeClient";
import { HomeKosher } from "@/components/home/HomeKosher";
import { TransactionCard } from "@/components/home/TransactionCard";
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
  const [featuredService, featuredSpace, latestSpaces, latestServices, latestJobs, kosherPlaces, kosherCities, kosherPreview] = await Promise.all([
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
    }),
    prisma.kosherPlace.count({ where: { published: true } }),
    prisma.kosherPlace.findMany({ where: { published: true }, distinct: ['city', 'countryCode'], select: { city: true } }),
    prisma.kosherPlace.findMany({
      where: { published: true, slug: { in: ['lpz-circulo-israelita', 'ba-templo-libertad', 'sp-gelato-borelli'] } },
      orderBy: { lat: 'desc' },
      select: { slug: true, name: true, city: true, type: true, status: true, verifiedAt: true }
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
      <HomeKosher places={kosherPlaces} cities={kosherCities.length} preview={kosherPreview.map(({ verifiedAt, ...p }) => ({ ...p, verified: !!verifiedAt }))} />
      <HomeStats />

      {/* Feature Split Section */}
      <section className="blend-from-primary w-full py-24 md:py-32 bg-bg-secondary overflow-hidden relative section-transition">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
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
            
            <TransactionCard />
          </div>
        </div>
      </section>

      {/* Real-time Activity Feed */}
      <HomeLatestActivity items={JSON.parse(JSON.stringify(items))} />

      <HomeCTA />
    </div>
  );
}
