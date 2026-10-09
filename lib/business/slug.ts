const RESERVED = new Set(["nueva", "nuevo", "unirse", "api", "admin", "business", "app", "ajustes", "planillas", "trabajadores"]);

export function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return base.length >= 2 ? base : `empresa${base ? `-${base}` : ""}`;
}

export function isReservedSlug(slug: string) {
  return RESERVED.has(slug);
}

/** Primer slug libre: nombre, nombre-2, nombre-3… */
export async function uniqueSlug(name: string, taken: (slug: string) => Promise<boolean>) {
  const base = slugify(name);
  for (let i = 1; i < 200; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    if (isReservedSlug(candidate)) continue;
    if (!(await taken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
// creado por pato dev y askforvini
