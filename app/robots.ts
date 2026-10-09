import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { KOSHER_HOST, KOSHER_URL, PRIVATE_PREFIXES, SITE_URL } from "@/lib/seo/site";

// Un robots.txt por dominio. En kosher.* las rutas van sin el prefijo /kosher. Los rastreadores (Google, Bing,
// ChatGPT, Perplexity…) pueden entrar a todo lo público; solo quedan afuera la API y las áreas privadas.
export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host")?.split(":")[0]?.toLowerCase();
  const isKosher = host === KOSHER_HOST;
  const sub = "/kosher";

  const disallow = isKosher
    ? ["/api/", ...PRIVATE_PREFIXES.filter((p) => p.startsWith(`${sub}/`)).map((p) => p.slice(sub.length))]
    : PRIVATE_PREFIXES.map((p) => (p === "/api" ? "/api/" : p));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...disallow, "/*?*callbackUrl="],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: isKosher ? KOSHER_URL : SITE_URL,
  };
}
// creado por pato dev y askforvini
