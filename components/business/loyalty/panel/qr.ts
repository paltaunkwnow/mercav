/** Qrcode es CommonJS: según el empaquetador, las funciones vienen sueltas o dentro de default. */
export async function qrDataUrl(text: string, width = 512) {
  const mod = await import("qrcode");
  const toDataURL = mod.toDataURL ?? (mod as unknown as { default: typeof mod }).default.toDataURL;
  return toDataURL(text, { margin: 1, width, errorCorrectionLevel: "M" });
}
// creado por pato dev y askforvini
