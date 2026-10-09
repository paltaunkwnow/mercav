/**
 * api.mercav.lat y los dominios de Mercav que lo pueden llamar con la sesión (CORS con credenciales).
 * Puro, sin imports de Next: lo usan el middleware y la guarda de Pwn, y se testea con node:test.
 */
export const API_HOST = "api.mercav.lat";

const MERCAV_ORIGINS = new Set([
  "https://mercav.lat",
  "https://www.mercav.lat",
  "https://app.mercav.lat",
  "https://kosher.mercav.lat",
  "https://pwn.mercav.lat",
]);

export function isMercavOrigin(origin: string | null | undefined): boolean {
  return !!origin && MERCAV_ORIGINS.has(origin.trim().toLowerCase());
}
// creado por pato dev y askforvini
