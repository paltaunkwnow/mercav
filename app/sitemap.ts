import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { canonicalFor } from "@/lib/seo/site";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];
type Freq = Entry["changeFrequency"];

const STATIC: Array<[path: string, priority: number, freq: Freq]> = [
  ["/", 1, "daily"],
  ["/anuncios", 0.9, "daily"],
  ["/servicios", 0.9, "daily"],
  ["/empleos", 0.9, "daily"],
  ["/herramientas", 0.8, "weekly"],
  ["/herramientas/roi", 0.6, "monthly"],
  ["/herramientas/contratos", 0.6, "monthly"],
  ["/herramientas/seo", 0.6, "monthly"],
  ["/herramientas/precios", 0.6, "monthly"],
  ["/herramientas/paletas", 0.6, "monthly"],
  ["/herramientas/prompts", 0.6, "monthly"],
  ["/precios", 0.8, "monthly"],
  ["/premium", 0.6, "monthly"],
  ["/por-que-mercav", 0.7, "monthly"],
  ["/nosotros", 0.7, "monthly"],
  ["/inversores", 0.6, "monthly"],
  ["/pitch", 0.6, "monthly"],
  ["/explorar", 0.6, "daily"],
  ["/feed", 0.5, "daily"],
  ["/faq", 0.6, "monthly"],
  ["/preguntas-frecuentes", 0.5, "monthly"],
  ["/contacto", 0.5, "yearly"],
  ["/soporte", 0.5, "yearly"],
  ["/changelog", 0.4, "weekly"],
  ["/terminos", 0.3, "yearly"],
  ["/privacidad", 0.3, "yearly"],
  ["/cookies", 0.3, "yearly"],
  ["/aviso-legal", 0.3, "yearly"],
  ["/legal/uso-aceptable", 0.3, "yearly"],
  ["/legal/reembolsos", 0.3, "yearly"],
  ["/legal/derechos", 0.3, "yearly"],
  // Mercav Pwn (pwn.mercav.lat)
  ["/pwn", 0.9, "daily"],
  ["/pwn/exposure", 0.8, "weekly"],
  ["/pwn/breaches", 0.8, "daily"],
  ["/pwn/vulnerabilities", 0.8, "daily"],
  ["/pwn/signals", 0.7, "hourly"],
  ["/pwn/actors", 0.6, "daily"],
  ["/pwn/organizations", 0.6, "daily"],
  ["/pwn/reports", 0.5, "weekly"],
  ["/pwn/sources", 0.6, "weekly"],
  ["/pwn/terminos", 0.3, "yearly"],
  // Mercav Kosher (kosher.mercav.lat)
  ["/kosher", 0.9, "daily"],
  ["/kosher/mapa", 0.8, "daily"],
  ["/kosher/calendario", 0.7, "daily"],
  ["/kosher/comunidad", 0.6, "daily"],
  ["/kosher/comunidad/agenda", 0.5, "daily"],
  ["/kosher/comunidad/minian", 0.5, "daily"],
  ["/kosher/comunidad/shabat", 0.5, "weekly"],
  ["/kosher/comunidad/jesed", 0.5, "weekly"],
  ["/kosher/comunidad/empleos", 0.5, "weekly"],
  ["/kosher/comunidad/agencias", 0.5, "monthly"],
  ["/kosher/comunidades", 0.6, "weekly"],
  ["/kosher/viaje", 0.6, "monthly"],
  ["/kosher/chat", 0.4, "daily"],
  ["/kosher/sugerir", 0.4, "monthly"],
  ["/kosher/terminos", 0.3, "yearly"],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map(([path, priority, changeFrequency]) => ({
    url: canonicalFor(path),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Live public listings. A failing query must never break the sitemap.
  const safe = async <T,>(query: () => Promise<T[]>) => {
    try {
      return await query();
    } catch {
      return [] as T[];
    }
  };

  const [spaces, services, jobs, places] = await Promise.all([
    safe(() => prisma.space.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true }, take: 5000 })),
    safe(() => prisma.service.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true }, take: 5000 })),
    safe(() => prisma.jobPost.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true }, take: 5000 })),
    safe(() => prisma.kosherPlace.findMany({ where: { published: true }, select: { slug: true, updatedAt: true }, take: 10000 })),
  ]);

  for (const s of spaces) entries.push({ url: canonicalFor(`/anuncios/${s.id}`), lastModified: s.updatedAt, changeFrequency: "weekly", priority: 0.7 });
  for (const s of services) entries.push({ url: canonicalFor(`/servicios/${s.id}`), lastModified: s.updatedAt, changeFrequency: "weekly", priority: 0.7 });
  for (const j of jobs) entries.push({ url: canonicalFor(`/empleos/${j.id}`), lastModified: j.updatedAt, changeFrequency: "daily", priority: 0.7 });
  for (const p of places) entries.push({ url: canonicalFor(`/kosher/lugar/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.7 });

  return entries;
}
// creado por pato dev y askforvini
