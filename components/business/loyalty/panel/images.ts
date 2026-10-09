import { MAX_LOGO_BYTES } from "@/lib/business/loyalty/engine";

/** Imágenes del panel (solo navegador): logo de la tarjeta y conversión a PNG para el PDF. */

export const LOGO_MAX_SIDE = 256;
/** Mismo límite que normalizeDesign (largo del data URL). */
const LOGO_LIMIT = Math.floor(MAX_LOGO_BYTES * 1.37);

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function draw(img: HTMLImageElement, maxSide: number) {
  const w = img.naturalWidth || maxSide;
  const h = img.naturalHeight || maxSide;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Achica el logo a 256 px como máximo y lo pasa a PNG (o WebP si el PNG queda pesado). */
export async function processLogo(file: File): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!/^image\/(png|jpeg|webp|svg\+xml|gif)$/.test(file.type)) return { ok: false, error: "Subí una imagen PNG, JPG, WebP o SVG." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "La imagen pesa más de 10 MB. Probá con una más liviana." };
  const url = URL.createObjectURL(file);
  try {
    const canvas = draw(await loadImage(url), LOGO_MAX_SIDE);
    if (!canvas) return { ok: false, error: "Tu navegador no pudo procesar la imagen." };
    let dataUrl = canvas.toDataURL("image/png");
    if (dataUrl.length > LOGO_LIMIT) {
      const webp = canvas.toDataURL("image/webp", 0.9);
      if (webp.startsWith("data:image/webp") && webp.length < dataUrl.length) dataUrl = webp;
    }
    if (dataUrl.length > LOGO_LIMIT) return { ok: false, error: "El logo pesa demasiado aun achicado. Probá con una imagen más simple o con fondo transparente." };
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: "No pudimos leer esa imagen. Probá con otra." };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Cualquier data URL de imagen a PNG, con sus medidas (jsPDF no lee WebP ni SVG en todos lados). */
export async function toPng(dataUrl: string, maxSide = 512): Promise<{ png: string; width: number; height: number } | null> {
  try {
    const canvas = draw(await loadImage(dataUrl), maxSide);
    if (!canvas) return null;
    return { png: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}
// creado por pato dev y askforvini
