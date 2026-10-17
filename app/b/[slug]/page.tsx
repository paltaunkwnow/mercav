import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { canonicalFor } from "@/lib/seo/site";
import { publicPageDraftSchema, whatsappHref } from "@/lib/business/public-page";

type Props = { params: { slug: string } };
export const revalidate = 60;

async function pageFor(slug: string) {
  try {
    const page = await prisma.businessPublicPage.findFirst({
    where: { publicSlug: slug, status: "PUBLISHED" },
    include: {
      workspace: {
        include: {
          posConfig: {
            include: {
              products: {
                where: { isActive: true },
                include: { category: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
    },
    });
    if (page) return page;
    const alias = await prisma.businessPublicPageAlias.findUnique({ where: { slug }, include: { page: true } });
    if (alias?.page.status === "PUBLISHED" && alias.page.publicSlug) redirect(`/b/${alias.page.publicSlug}`);
  } catch (error) {
    console.error("BUSINESS_PUBLIC_PAGE_LOOKUP_ERROR", error);
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await pageFor(params.slug); if (!page) return {};
  const data = publicPageDraftSchema.parse(page.published);
  const title = data.title || page.workspace.name;
  return { title, description: data.description || `Conocé ${title} en Mercav.`, alternates: { canonical: canonicalFor(`/b/${page.publicSlug}`) }, openGraph: { title, description: data.description || `Conocé ${title} en Mercav.`, url: canonicalFor(`/b/${page.publicSlug}`) } };
}

export default async function BusinessPublicPage({ params }: Props) {
  const page = await pageFor(params.slug); if (!page) notFound();
  const data = publicPageDraftSchema.parse(page.published);
  const products = page.workspace.posConfig?.products.filter((p) => data.selectedProductIds.includes(p.id) && (!p.trackStock || Number(p.stock) > 0)) ?? [];
  const title = data.title || page.workspace.name;
  const wa = whatsappHref(data.whatsapp, `Hola, quiero consultar sobre ${title}.`);
  const style = page.workspace.brandColor ? { "--business-accent": page.workspace.brandColor } as CSSProperties : undefined;
  const productRows = products.map((p) => <li key={p.id} className="flex items-start justify-between gap-5 border-b border-black/10 py-4"><span><strong className="block text-[1.02rem]">{p.name}</strong>{p.description ? <span className="mt-1 block text-sm opacity-70">{p.description}</span> : null}{p.category ? <span className="mt-1 block text-xs font-semibold uppercase tracking-wide opacity-60">{p.category.name}</span> : null}</span><b className="shrink-0 text-[var(--business-accent,#9a7118)]">{new Intl.NumberFormat("es", { style: "currency", currency: page.workspace.currency }).format(Number(p.price))}</b></li>);
  const instagramHref = data.instagram ? `https://instagram.com/${data.instagram.replace(/^@/, "")}` : null;
  const contact = <div className="flex flex-wrap gap-3">{wa ? <a className="rounded-xl bg-[var(--business-accent,#9a7118)] px-5 py-3 font-semibold text-white" href={wa} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a> : null}{data.phone ? <a className="rounded-xl border border-current px-5 py-3 font-semibold" href={`tel:${data.phone}`}>Llamar</a> : null}{data.website ? <a className="rounded-xl border border-current px-5 py-3 font-semibold" href={data.website} target="_blank" rel="noopener noreferrer">Sitio web</a> : null}{instagramHref ? <a className="rounded-xl border border-current px-5 py-3 font-semibold" href={instagramHref} target="_blank" rel="noopener noreferrer">Instagram</a> : null}</div>;
  const structuredData = { "@context": "https://schema.org", "@type": "LocalBusiness", name: title, description: data.description || undefined, url: canonicalFor(`/b/${page.publicSlug}`), telephone: data.phone || undefined, address: data.address || undefined, openingHours: data.hours || undefined };
  return <main style={style} className={`min-h-dvh bg-[#fffdf8] px-4 py-10 text-[#252017] ${data.template === "SHOWCASE" ? "bg-stone-950 text-stone-50" : ""}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><div className="mx-auto max-w-4xl">
    {data.template === "PROFILE" ? <><header className="mx-auto max-w-xl text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--business-accent,#9a7118)] text-3xl font-bold text-white">{title.slice(0, 1).toUpperCase()}</div><h1 className="mt-5 text-4xl font-bold tracking-tight">{title}</h1>{data.description ? <p className="mx-auto mt-3 max-w-xl text-lg opacity-75">{data.description}</p> : null}<div className="mt-6 justify-center">{contact}</div></header><section className="mx-auto mt-12 max-w-2xl"><h2 className="text-xl font-bold">{products.length ? "Lo que ofrecemos" : "Información"}</h2><ul className="mt-3">{productRows}</ul></section></> : null}
    {data.template === "MENU" ? <><header className="border-b-4 border-[var(--business-accent,#9a7118)] pb-7"><p className="text-sm font-bold uppercase tracking-[0.2em] opacity-60">Menú</p><h1 className="mt-2 text-5xl font-bold tracking-tight">{title}</h1>{data.description ? <p className="mt-3 max-w-2xl text-lg opacity-75">{data.description}</p> : null}</header><section className="mt-10 grid gap-10 md:grid-cols-[1fr_0.35fr]"><div><h2 className="text-2xl font-bold">Carta</h2><ul className="mt-4">{productRows.length ? productRows : <li className="py-4 opacity-70">Pronto publicaremos el menú.</li>}</ul></div><aside className="h-fit border-l-2 border-[var(--business-accent,#9a7118)] pl-5"><h2 className="font-bold">Visitános</h2>{data.hours ? <p className="mt-2 whitespace-pre-line text-sm opacity-75">{data.hours}</p> : null}{data.address ? <p className="mt-2 text-sm opacity-75">{data.address}</p> : null}<div className="mt-5">{contact}</div></aside></section></> : null}
    {data.template === "SHOWCASE" ? <><header className="rounded-3xl bg-[var(--business-accent,#9a7118)] p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Mercav</p><h1 className="mt-3 max-w-2xl text-5xl font-bold tracking-tight">{title}</h1>{data.description ? <p className="mt-4 max-w-xl text-lg text-white/80">{data.description}</p> : null}<div className="mt-7">{contact}</div></header><section className="mt-10"><h2 className="text-2xl font-bold">Destacados</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <li key={p.id} className="rounded-2xl bg-white/10 p-5"><p className="font-bold">{p.name}</p>{p.description ? <p className="mt-2 text-sm text-white/70">{p.description}</p> : null}<p className="mt-5 font-bold text-amber-300">{new Intl.NumberFormat("es", { style: "currency", currency: page.workspace.currency }).format(Number(p.price))}</p></li>)}</ul></section></> : null}
    <footer className="mt-16 border-t border-current/15 pt-5 text-sm opacity-60">Hecho con Mercav</footer>
  </div></main>;
}
