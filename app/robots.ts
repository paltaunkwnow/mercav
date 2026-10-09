import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { APP_HOST, APP_URL, KOSHER_HOST, KOSHER_URL, PRIVATE_PREFIXES, SITE_URL } from "@/lib/seo/site";

// One robots.txt per host. On kosher.* the paths are served without the /kosher prefix.
// pwn.mercav.lat has no host of its own anymore: it redirects to app.mercav.lat/pwn.
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
    host: isKosher ? KOSHER_URL : host === APP_HOST ? APP_URL : SITE_URL,
  };
}
// creado por pato dev y askforvini
