/**
 * Loader de desarrollo: quita los comentarios `//# sourceMappingURL=...` de los paquetes de node_modules.
 * Webpack los deja dentro del chunk y el navegador los resuelve contra /_next/static/chunks/..., donde esos .map
 * no existen: DevTools pedía LayoutGroupContext.mjs.map (framer-motion) y el servidor respondía 404.
 */
module.exports = function stripSourceMapUrl(source) {
  if (typeof source !== "string" || !source.includes("sourceMappingURL=")) return source;
  return source.replace(/^[ \t]*\/\/[#@] sourceMappingURL=.*$/gm, "");
};
// creado por pato dev y askforvini
