import { prisma } from "@/lib/prisma";
import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import {
  HomeHero,
  HomeProblem,
  HomePlatform,
  HomeCapabilities,
  HomeSecurity,
  HomeLatestActivity,
  HomeTrust,
  HomeCTA,
} from "@/components/home/HomeClient";
import { HomeKosher } from "@/components/home/HomeKosher";
import { PWN_FEED_SOURCES } from "@/lib/integrations/pwn/feed-catalog";

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
  // Fetch real data from all modules with fault-tolerant try/catch
  let config: any = null;
  let featuredService: any = null;
  let featuredSpace: any = null;
  let latestSpaces: any[] = [];
  let latestServices: any[] = [];
  let latestJobs: any[] = [];

  let kosherPlaces = 0;
  let kosherCities: { city: string }[] = [];
  let counts = { spaces: 0, services: 0, jobs: 0 };
  let kosherCountries: { countryCode: string }[] = [];
  let kosherPreview: { slug: string; name: string; city: string; type: KosherPlaceType; status: KosherStatus; verifiedAt: Date | null }[] = [];

  try {
    config = await prisma.globalConfig.findUnique({
      where: { id: "singleton" }
    });

    [featuredService, featuredSpace, latestSpaces, latestServices, latestJobs, kosherPlaces, kosherCities, kosherPreview] = await Promise.all([
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
    const [spaces, services, jobs, countries] = await Promise.all([
      prisma.space.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.jobPost.count({ where: { isActive: true } }),
      prisma.kosherPlace.findMany({ where: { published: true }, distinct: ['countryCode'], select: { countryCode: true } }),
    ]);
    counts = { spaces, services, jobs };
    kosherCountries = countries;
  } catch (dbError) {
    console.warn("Database query error on Home page (showing graceful fallback):", dbError);
  }

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

  // Pwn reads these feeds plus the HIBP, NVD and CISA KEV APIs.
  const pwnSources = Array.from(
    new Set(["Have I Been Pwned", "NVD", "CISA KEV", ...PWN_FEED_SOURCES.map((source) => source.forumLabel)])
  );

  const fmt = (n: number) => new Intl.NumberFormat("es").format(n);
  const facts = [
    { value: "7", label: "módulos con una sola cuenta" },
    { value: fmt(pwnSources.length), label: "fuentes públicas que consulta Pwn" },
    ...(kosherPlaces > 0 ? [{ value: fmt(kosherPlaces), label: "lugares publicados en el atlas Kosher" }] : []),
    ...(kosherCountries.length > 0 ? [{ value: fmt(kosherCountries.length), label: "países con lugares en el atlas" }] : []),
    ...(counts.spaces > 0 ? [{ value: fmt(counts.spaces), label: "espacios publicitarios activos" }] : []),
    ...(counts.services > 0 ? [{ value: fmt(counts.services), label: "servicios activos" }] : []),
    ...(counts.jobs > 0 ? [{ value: fmt(counts.jobs), label: "vacantes abiertas" }] : []),
  ].slice(0, 4);

  const preview = kosherPreview.map(({ verifiedAt, ...p }) => ({ ...p, verified: !!verifiedAt }));

  return (
    <div className="flex w-full flex-col overflow-x-clip">
      <HomeHero />
      <HomeProblem />
      <HomePlatform pwnSources={pwnSources} kosherPreview={preview} />
      <HomeCapabilities />
      <HomeSecurity sources={pwnSources} />
      <HomeKosher places={kosherPlaces} cities={kosherCities.length} preview={preview} />
      <HomeLatestActivity items={JSON.parse(JSON.stringify(items))} />
      <HomeTrust facts={facts} />
      <HomeCTA />
    </div>
  );
}
// creado por pato dev y askforvini
