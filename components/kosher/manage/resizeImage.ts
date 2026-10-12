import { PHOTO_MAX_BYTES, PHOTO_MAX_SIDE, PHOTO_MIN_SIDE, PHOTO_ORIGINAL_MAX_BYTES } from "@/components/kosher/manage/details";

/**
 * Achica una foto en el navegador antes de subirla: lado mayor hasta 1600 px, JPEG ~0,82 y como mucho 700 KB.
 * Al volver a codificarla se pierden los metadatos (EXIF, ubicación del teléfono).
 */
export type PreparedImage = { blob: Blob; width: number; height: number };

type Source = { image: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Algunos navegadores no aceptan opciones o el formato: se prueba con <img>.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("No pudimos leer esa imagen. Probá con una foto JPG o PNG.");
  }
  return { image: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

export async function prepareImage(file: File): Promise<PreparedImage> {
  // Algunos sistemas no informan el tipo (HEIC): en ese caso decide el decodificador.
  if (file.type && !file.type.startsWith("image/")) throw new Error("Ese archivo no es una imagen.");
  if (file.size > PHOTO_ORIGINAL_MAX_BYTES) throw new Error("La foto pesa más de 10 MB. Elegí una más liviana.");
  const source = await decode(file);
  try {
    if (Math.min(source.width, source.height) < PHOTO_MIN_SIDE) {
      throw new Error(`La foto es muy chica: tiene que medir al menos ${PHOTO_MIN_SIDE} px de lado.`);
    }
    // Si a 0,82 pesa demasiado, se baja la calidad y después el tamaño.
    for (const side of [PHOTO_MAX_SIDE, 1280, 1024]) {
      const scale = Math.min(1, side / Math.max(source.width, source.height));
      const width = Math.max(1, Math.round(source.width * scale));
      const height = Math.max(1, Math.round(source.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Tu navegador no pudo procesar la foto.");
      // Fondo blanco: un PNG con transparencia no queda negro en JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source.image, 0, 0, width, height);
      for (const quality of [0.82, 0.72, 0.62]) {
        const blob = await toBlob(canvas, quality);
        if (blob && blob.size <= PHOTO_MAX_BYTES) return { blob, width, height };
      }
    }
    throw new Error("No pudimos achicar la foto lo suficiente. Probá con otra.");
  } finally {
    source.close();
  }
}
// creado por pato dev y askforvini
