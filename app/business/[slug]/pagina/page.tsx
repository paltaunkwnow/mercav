import type { Metadata } from "next";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs } from "@/components/business/ui";
import { PublicPageEditor } from "@/components/business/PublicPageEditor";
export const metadata: Metadata = { title: "Mi página · Business", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: { slug: string } }) { const ctx = await requireBusiness(params.slug, "publicPage.edit"); return <AppPage kicker="Mercav Business" title="Mi página" lead="Una página simple para compartir tu negocio, menú y contacto." tabs={<BusinessTabs slug={ctx.workspace.slug} role={ctx.role} active="pagina" />}><PublicPageEditor slug={ctx.workspace.slug} canPublish={ctx.can("publicPage.publish")} /></AppPage>; }
