import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { APP_HOST, APP_URL, KOSHER_HOST, KOSHER_URL, PRIVATE_PREFIXES, SITE_URL } from "@/lib/seo/site";

// Un robots.txt por dominio. En kosher.* las rutas van sin el prefijo /kosher. Los rastreadores (Google, Bing,
// ChatGPT, Perplexity…) pueden entrar a todo lo público; solo quedan afuera la API y las áreas privadas.
export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host")?.split(":")[0]?.toLowerCase();
  const isKosher = host === KOSHER_HOST;
  const sub = "/kosher";

  const prefixes = isKosher
    ? ["/api", ...PRIVATE_PREFIXES.filter((p) => p.startsWith(`${sub}/`)).map((p) => p.slice(sub.length))]
    : PRIVATE_PREFIXES;
  // robots.txt compara por prefijo de texto: "Disallow: /c" también bloqueaba /caja, /cookies, /contacto y /changelog.
  // Cada ruta privada va como la ruta exacta ($), con parámetros (?) y lo que cuelga de ella (/), igual que isPrivatePath.
  const disallow = prefixes.flatMap((p) => [`${p}$`, `${p}?`, `${p}/`]);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...disallow, "/*?*callbackUrl="],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: isKosher ? KOSHER_URL : host === APP_HOST ? APP_URL : SITE_URL,
  };
}
// creado por pato dev y askforvini
