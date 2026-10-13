/** Checked against each agency's own website on 29/09/2026. Only add agencies with a public site. */
export type Agency = {
  slug: string;
  name: string;
  country: string;
  countryCode: string | null;
  about: string;
  website: string;
  lists?: { label: string; url: string };
  contact?: string;
  address?: string;
  /** Si se revisó en otra fecha que AGENCIES_VERIFIED_AT. */
  verifiedAt?: string;
};

export const AGENCIES_VERIFIED_AT = "29 de septiembre de 2026";

export const AGENCIES: Agency[] = [
  {
    slug: "ajdut",
    name: "Ajdut Kosher",
    country: "Argentina",
    countryCode: "AR",
    about: "Supervisión kosher de productos y establecimientos. Publica su guía de productos y el directorio de restaurantes certificados en su app.",
    website: "https://kosher.org.ar",
    lists: { label: "App Ajdut Kosher (productos y restaurantes)", url: "https://kosher.org.ar" },
    contact: "+54 11 4787-6712",
    address: "Moldes 2449, CABA",
  },
  {
    slug: "bdk",
    name: "BDK do Brasil",
    country: "Brasil",
    countryCode: "BR",
    about: "Beit Din de São Paulo. Publica una lista verde (con sello) y una amarela de productos, y los establecimientos total o parcialmente kosher.",
    website: "https://bdk.com.br",
    lists: { label: "Establecimientos certificados", url: "https://bdk.com.br/estabelecimentos" },
    address: "Alameda Lorena 1304, cj. 1508, São Paulo",
  },
  {
    slug: "uruguay-kosher",
    name: "Uruguay Kosher",
    country: "Uruguay",
    countryCode: "UY",
    about: "Bajo la supervisión del Gran Rabinato de la Comunidad Israelita del Uruguay, a cargo del rabino Aarón Gulman.",
    website: "https://kasher.uy",
    contact: "rabinato@kehila.org.uy · 091 412 114",
  },
  {
    slug: "chile-kosher",
    name: "Chile Kosher",
    country: "Chile",
    countryCode: "CL",
    about: "Certificadora de la comunidad Aish Chile, a cargo del rabino Eliahu Tamim. Publica en su sitio las marcas y productos aprobados.",
    website: "https://www.chilekosher.cl",
    contact: "info@chilekosher.cl",
  },
  {
    slug: "kv-kosher",
    name: "KV Kosher",
    country: "Chile",
    countryCode: "CL",
    about: "Certificación y supervisión kosher en Chile desde 1970.",
    website: "https://www.kosherkv.cl",
  },
  {
    slug: "kmd",
    name: "Kosher Maguen David (KMD)",
    country: "México",
    countryCode: "MX",
    about: "Certificadora kosher de México. Tiene un buscador de productos y establecimientos certificados y listas para descargar, entre ellas la de Pésaj y la de pescados.",
    website: "https://www.kosher.com.mx",
    lists: { label: "Listas KMD (productos, Pésaj, pescados)", url: "https://www.kosher.com.mx/pages/listas" },
    contact: "+52 55 3872 5050 · atencionaclientes@kosher.com.mx",
    address: "Horacio 1008, Col. Polanco, CDMX",
    verifiedAt: "12 de octubre de 2026",
  },
  {
    slug: "ka-kosher",
    name: "Ka Kosher (Supervisores en Calidad Kosher)",
    country: "México",
    countryCode: "MX",
    about: "Certificadora kosher de México. Supervisa productos y publica una lista de restaurantes y comercios bajo su supervisión.",
    website: "https://kakosher.com",
    lists: { label: "Establecimientos supervisados", url: "https://kakosher.com/establecimientos/" },
    verifiedAt: "13 de octubre de 2026",
  },
  {
    slug: "ou",
    name: "OU Kosher",
    country: "Estados Unidos · internacional",
    countryCode: null,
    about: "Orthodox Union. El sello más frecuente en productos importados.",
    website: "https://oukosher.org",
  },
  {
    slug: "ok",
    name: "OK Kosher",
    country: "Estados Unidos · internacional",
    countryCode: null,
    about: "Certificación internacional de productos e ingredientes.",
    website: "https://www.ok.org",
  },
  {
    slug: "star-k",
    name: "Star-K",
    country: "Estados Unidos · internacional",
    countryCode: null,
    about: "Certificación internacional de productos, establecimientos y electrodomésticos con modo Shabat.",
    website: "https://www.star-k.org",
  },
  {
    slug: "klbd",
    name: "KLBD",
    country: "Reino Unido · internacional",
    countryCode: null,
    about: "London Beth Din. Certificación de productos distribuidos en Europa y otros mercados.",
    website: "https://www.klbdkosher.org",
  },
];
// creado por pato dev y askforvini
