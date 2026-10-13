// Resuelve el alias "@/" de tsconfig a la raíz del repo, para importar lib/*.ts desde los scripts de Kosher
// (node --experimental-strip-types --import ./scripts/kosher/ts-register.mjs …).
const ROOT = new URL("../../", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const path = specifier.slice(2);
    return nextResolve(new URL(/\.(ts|mjs|js)$/.test(path) ? path : `${path}.ts`, ROOT).href, context);
  }
  return nextResolve(specifier, context);
}
// creado por pato dev y askforvini
