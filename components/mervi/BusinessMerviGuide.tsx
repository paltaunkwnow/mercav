"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mervi, type MerviPose } from "@/components/mervi/Mervi";
import { X } from "@/components/icons";
type Guide = { action: "catalog" | "sell" | "page"; dismissed: boolean; permissions: { inventory: boolean; sell: boolean; page: boolean } };
const content: Record<Guide["action"], { pose: MerviPose; title: string; body: string; label: string }> = {
  catalog: { pose: "emprendedor", title: "Empecemos por lo que vendés", body: "Agregá un producto o servicio con nombre y precio. Lo demás puede esperar.", label: "Agregar lo que vendo" },
  sell: { pose: "celebrando", title: "Tu catálogo está listo", body: "Abrí la caja cuando vayas a vender. Podés volver al catálogo cuando quieras.", label: "Ir a vender" },
  page: { pose: "smartphone", title: "Compartí tu negocio", body: "Tu página pública reúne el menú, enlaces y contacto en un solo link.", label: "Crear mi página" },
};
export function BusinessMerviGuide({ slug }: { slug: string }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  useEffect(() => { fetch(`/api/business/${encodeURIComponent(slug)}/guide`).then((r) => r.json()).then((v) => v.success && setGuide(v.data)).catch(() => {}); }, [slug]);
  if (!guide || guide.dismissed) return null;
  const item = content[guide.action];
  const href = guide.action === "catalog" ? (guide.permissions.inventory ? `/business/${slug}/caja/inventario` : null) : guide.action === "sell" ? (guide.permissions.sell ? `/business/${slug}/caja` : null) : guide.permissions.page ? `/business/${slug}/pagina` : null;
  const dismiss = () => { fetch(`/api/business/${encodeURIComponent(slug)}/guide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "dismiss" }) }).finally(() => setGuide({ ...guide, dismissed: true })); };
  return <aside aria-label="Guía de Mervi" className="mv-panel relative mb-6 flex gap-3 overflow-hidden p-4 sm:p-5"><Mervi pose={item.pose} scale={1} still label="Mervi te guía" className="mt-1" /><div className="min-w-0 pr-7"><p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p><p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{href ? item.body : "Cuando quien administra esta parte la complete, vas a poder continuar."}</p>{href ? <Link href={href} className="mv-link mt-3 inline-flex min-h-11 items-center font-semibold">{item.label}</Link> : null}</div><button type="button" onClick={dismiss} aria-label="Ocultar guía de Mervi" className="mv-focus absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="h-4 w-4" aria-hidden /></button></aside>;
}
export function AccountMerviGuide() { return <section className="mv-panel flex items-center gap-4 p-4 sm:p-5" aria-label="Primer paso con Mercav"><Mervi pose="saludando" scale={1} still label="Mervi te da la bienvenida" /><div><p className="font-semibold text-[var(--text-primary)]">¿Querés empezar a vender?</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Mervi te va a acompañar paso a paso desde tu primer negocio.</p><Link href="/business" className="mv-link mt-2 inline-flex min-h-11 items-center font-semibold">Preparar mi negocio</Link></div></section>; }
