/**
 * Public URL for each Mercav tool. Shared by the server pages (metadata, 404) and the client catalog
 * (open/close a panel by URL). The POS is not here: it lives at /dashboard/pos.
 */
export const TOOL_ROUTES = [
  {
    slug: "roi",
    toolId: "roi-calculator",
    title: "Calculadora de ROI",
    description: "Proyectá cuánto puede devolverte una campaña: inversión, ingresos estimados, ganancia neta y punto de equilibrio.",
  },
  {
    slug: "contratos",
    toolId: "contract-generator",
    title: "Generador de contratos",
    description: "Armá un modelo de contrato de servicios entre freelancer y cliente, adaptado al país que elijas.",
  },
  {
    slug: "seo",
    toolId: "seo-analyzer",
    title: "Analizador SEO",
    description: "Revisá título, descripción, contenido, imágenes y enlaces de una página y descargá el reporte en PDF.",
  },
  {
    slug: "precios",
    toolId: "price-simulator",
    title: "Simulador de precios",
    description: "Calculá cuánto cobrar por hora y por proyecto según rubro, mercado y experiencia.",
  },
  {
    slug: "paletas",
    toolId: "palette-generator",
    title: "Generador de paletas",
    description: "Creá una paleta de cinco colores, revisá el contraste y exportala a CSS, Tailwind, SCSS o JSON.",
  },
  {
    slug: "prompts",
    toolId: "prompt-generator",
    title: "Generador de prompts",
    description: "Instrucciones listas para cualquier asistente de IA: descripciones de producto, anuncios, respuestas a clientes y más.",
  },
] as const;

export type ToolRoute = (typeof TOOL_ROUTES)[number];
export type RoutedToolId = ToolRoute["toolId"];

/** Tools whose results can be saved to the history (API whitelist). */
export const HISTORY_TOOLS: readonly string[] = TOOL_ROUTES.map((route) => route.toolId);

export const CATALOG_PATH = "/herramientas";

export function routeBySlug(slug: string | undefined | null) {
  return TOOL_ROUTES.find((route) => route.slug === slug) ?? null;
}

export function routeByToolId(toolId: string | undefined | null) {
  return TOOL_ROUTES.find((route) => route.toolId === toolId) ?? null;
}

export function toolPath(toolId: string) {
  const route = routeByToolId(toolId);
  return route ? `${CATALOG_PATH}/${route.slug}` : CATALOG_PATH;
}

/** "/herramientas/seo" → "seo-analyzer"; anything else → null. */
export function toolIdFromPathname(pathname: string | null | undefined): RoutedToolId | null {
  if (!pathname) return null;
  const match = pathname.replace(/\/+$/, "").match(/^\/herramientas\/([^/]+)$/);
  return match ? routeBySlug(decodeURIComponent(match[1]))?.toolId ?? null : null;
}

export const CATALOG_TITLE = "Herramientas · Mercav Tools";
export const CATALOG_DESCRIPTION =
  "Calculadora de ROI, contratos, SEO, precios, paletas y prompts para tu negocio. Se abren en el navegador, sin instalar nada.";

export function documentTitleFor(route: ToolRoute | null) {
  return route ? `${route.title} · Mercav Tools` : CATALOG_TITLE;
}
// creado por pato dev y askforvini
