"use client";

import { createContext, useContext } from "react";
import { POS_SCOPE_HEADER } from "./scope";

/**
 * De quién es la caja que se está usando. Dos piezas:
 * - Un contexto de React para todo lo que se dibuja (links de la cabecera, botones): en el servidor cada pedido tiene
 *   el suyo, así un render nunca toma la empresa de otro.
 * - Una variable del navegador para posFetch (se llama desde efectos y handlers, fuera del árbol de React). Solo se
 *   asigna en el cliente.
 * Con empresa, cada pedido a /api/pos lleva su slug y los links van a /business/<slug>/caja; sin ella, es la caja
 * personal de /dashboard/pos.
 */
export type PosSection = "" | "inventory" | "reports" | "config";
export type PosScopeValue = { slug: string | null; allowed: PosSection[] | null };

export const PosScopeContext = createContext<PosScopeValue>({ slug: null, allowed: null });

let browserSlug: string | null = null;

export function setPosWorkspace(slug: string | null) {
  if (typeof window !== "undefined") browserSlug = slug;
}

export function posFetch(input: string, init?: RequestInit) {
  if (!browserSlug || !input.startsWith("/api/pos")) return fetch(input, init);
  const headers = new Headers(init?.headers);
  headers.set(POS_SCOPE_HEADER, browserSlug);
  return fetch(input, { ...init, headers });
}

const BUSINESS_PATHS: Record<PosSection, string> = { "": "", inventory: "/inventario", reports: "/reportes", config: "/ajustes" };

export function posHrefFor(slug: string | null, section: PosSection = "") {
  if (slug) return `/business/${slug}/caja${BUSINESS_PATHS[section]}`;
  return section ? `/dashboard/pos/${section}` : "/dashboard/pos";
}

/** Links y permisos de la caja actual, para los componentes. */
export function usePos() {
  const { slug, allowed } = useContext(PosScopeContext);
  return {
    slug,
    inBusiness: !!slug,
    href: (section: PosSection = "") => posHrefFor(slug, section),
    /** A dónde vuelve "Salir": la empresa en Business o el panel. */
    exitHref: slug ? `/business/${slug}` : "/dashboard",
    allowed: (section: PosSection) => !allowed || allowed.includes(section),
  };
}
// creado por pato dev y askforvini
