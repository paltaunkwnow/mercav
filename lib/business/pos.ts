import type { BusinessContext } from "@/lib/business/context";
import type { PosSection } from "@/lib/pos/client";
import { latamCountry } from "@/lib/geo/latam";
import { prisma } from "@/lib/prisma";

/** Las secciones de la caja que el rol puede abrir. */
export function posSections(ctx: BusinessContext): PosSection[] {
  return [
    ...(ctx.can("pos.sell") ? (["" as PosSection]) : []),
    ...(ctx.can("pos.inventory") ? (["inventory" as PosSection]) : []),
    ...(ctx.can("pos.reports") ? (["reports" as PosSection]) : []),
    ...(ctx.can("pos.configure") ? (["config" as PosSection]) : []),
  ];
}

/** Primera sección que el rol puede abrir, para mandarlo ahí desde la pestaña "Caja". */
export function posLanding(ctx: BusinessContext) {
  const base = `/business/${ctx.workspace.slug}/caja`;
  if (ctx.can("pos.sell")) return base;
  if (ctx.can("pos.reports")) return `${base}/reportes`;
  if (ctx.can("pos.inventory")) return `${base}/inventario`;
  if (ctx.can("pos.configure")) return `${base}/ajustes`;
  return null;
}

export function workspacePos(workspaceId: string) {
  return prisma.pOSConfig.findUnique({ where: { workspaceId }, select: { id: true, shopName: true } });
}

/** La caja personal de antes de esta persona, si todavía no la trajo a una empresa. */
export function legacyPos(userId: string) {
  return prisma.pOSConfig.findFirst({
    where: { userId, workspaceId: null },
    select: { id: true, shopName: true, _count: { select: { products: true, sales: true } } },
  });
}

/** Datos de la empresa para arrancar la caja (la caja guarda el país por nombre). */
export function posDefaults(ctx: BusinessContext) {
  const w = ctx.workspace;
  return { shopName: w.name, currency: w.currency, country: latamCountry(w.country).name, department: w.region ?? "", city: w.city ?? "" };
}
// creado por pato dev y askforvini
