/**
 * Fotos reales de los equipos, con licencia libre (Wikimedia Commons). Se sirven desde public/privacy/fotos y cada
 * una lleva su crédito y su licencia, que es obligatorio mostrar al lado de la foto. Se achicaron y recomprimieron.
 * Sin foto libre del modelo exacto, la ficha muestra solo la recreación.
 */
export type ProductPhoto = {
  slug: string;
  /** Color del catálogo que muestra la foto, si aplica. */
  color?: string;
  file: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export const PRODUCT_PHOTOS: ProductPhoto[] = [
  {
    slug: "pixel-6",
    color: "Sorta Seafoam",
    file: "/privacy/fotos/pixel-6-sorta-seafoam.jpg",
    width: 1200,
    height: 1800,
    author: "IXTA9839",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Google_Pixel_6_Sorta_Seafoam_rear.jpg",
  },
  {
    slug: "pixel-9-pro-xl",
    color: "Porcelain",
    file: "/privacy/fotos/pixel-9-pro-xl-porcelain.jpg",
    width: 1600,
    height: 1060,
    author: "D.328",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Google_Pixel_9_Pro_XL_(back).jpg",
  },
  {
    slug: "trezor-safe-7",
    file: "/privacy/fotos/trezor-safe-7.jpg",
    width: 1125,
    height: 1500,
    author: "FlippyFlink",
    license: "CC0 (dominio público)",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Trezor_Safe_7.jpg",
  },
];

export const photosFor = (slug: string) => PRODUCT_PHOTOS.filter((p) => p.slug === slug);
// creado por pato dev y askforvini
