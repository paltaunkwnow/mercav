import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PRIVATE_PREFIXES, SITE_URL } from "@/lib/seo/site";

// One robots.txt per host. On pwn.* and kosher.* the paths are served without the /pwn or /kosher prefix.
export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host")?.split(":")[0]?.toLowerCase();
  const sub = host === "pwn.mercav.lat" ? "/pwn" : host === "kosher.mercav.lat" ? "/kosher" : null;

  const disallow = sub
    ? ["/api/", ...PRIVATE_PREFIXES.filter((p) => p.startsWith(`${sub}/`)).map((p) => `${p.slice(sub.length)}`)]
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
    host: sub ? `https://${host}` : SITE_URL,
  };
}
// creado por pato dev y askforvini
