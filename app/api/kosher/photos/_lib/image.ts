/**
 * Reconoce JPEG, PNG y WebP por sus primeros bytes (no por el Content-Type que manda el cliente)
 * y lee el ancho y el alto de la cabecera, sin decodificar la imagen.
 */
export type ImageMime = "image/jpeg" | "image/png" | "image/webp";
export type ImageInfo = { mime: ImageMime; width: number; height: number };

const ascii = (buf: Uint8Array, start: number, text: string) => {
  for (let i = 0; i < text.length; i++) if (buf[start + i] !== text.charCodeAt(i)) return false;
  return true;
};
const u16be = (buf: Uint8Array, i: number) => (buf[i] << 8) | buf[i + 1];
const u32be = (buf: Uint8Array, i: number) => ((buf[i] << 24) >>> 0) + (buf[i + 1] << 16) + (buf[i + 2] << 8) + buf[i + 3];
const u24le = (buf: Uint8Array, i: number) => buf[i] | (buf[i + 1] << 8) | (buf[i + 2] << 16);

function png(buf: Uint8Array): ImageInfo | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || signature.some((b, i) => buf[i] !== b) || !ascii(buf, 12, "IHDR")) return null;
  return { mime: "image/png", width: u32be(buf, 16), height: u32be(buf, 20) };
}

function jpeg(buf: Uint8Array): ImageInfo | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return null;
  let i = 2;
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    // Bytes de relleno entre segmentos.
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    // Marcadores sin largo.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2;
      continue;
    }
    // Fin de imagen o comienzo de los datos: el tamaño tenía que venir antes.
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = u16be(buf, i + 2);
    if (length < 2) return null;
    // SOF0–SOF15, salvo DHT (C4), JPG (C8) y DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (i + 8 >= buf.length) return null;
      return { mime: "image/jpeg", height: u16be(buf, i + 5), width: u16be(buf, i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

function webp(buf: Uint8Array): ImageInfo | null {
  if (buf.length < 30 || !ascii(buf, 0, "RIFF") || !ascii(buf, 8, "WEBP")) return null;
  if (ascii(buf, 12, "VP8 ")) {
    // Con pérdida: código de inicio 9D 01 2A y 14 bits por lado.
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
    return { mime: "image/webp", width: (buf[26] | (buf[27] << 8)) & 0x3fff, height: (buf[28] | (buf[29] << 8)) & 0x3fff };
  }
  if (ascii(buf, 12, "VP8L")) {
    // Sin pérdida: firma 0x2F y después ancho-1 y alto-1 en 14 bits cada uno.
    if (buf[20] !== 0x2f) return null;
    const [b0, b1, b2, b3] = [buf[21], buf[22], buf[23], buf[24]];
    return { mime: "image/webp", width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
  }
  if (ascii(buf, 12, "VP8X")) {
    // Extendido: lienzo de 24 bits por lado, menos uno.
    return { mime: "image/webp", width: 1 + u24le(buf, 24), height: 1 + u24le(buf, 27) };
  }
  return null;
}

export function sniffImage(buf: Uint8Array): ImageInfo | null {
  const info = jpeg(buf) ?? png(buf) ?? webp(buf);
  return info && info.width > 0 && info.height > 0 ? info : null;
}
// creado por pato dev y askforvini
