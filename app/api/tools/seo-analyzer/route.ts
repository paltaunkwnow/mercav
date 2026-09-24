import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkToolAccess } from "@/lib/toolAccess";
import { assertPublicHttpUrl } from "@/lib/security/safe-url";

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const access = await checkToolAccess(user.id, "seo-analyzer");
    if (!access.allowed) return NextResponse.json({ success: false, error: access.message }, { status: 403 });

    const body = await req.json();
    const url = assertPublicHttpUrl(normalizeUrl(String(body.url || ""))).toString();

    const response = await fetch(url, {
      headers: { "User-Agent": "MercavSEO/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();
    const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || url;
    const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || "";
    const words = countWords(textOnly);
    const images = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
    const altCount = images.filter((tag) => /alt=["'][^"']*["']/i.test(tag)).length;
    const internalLinks = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).filter((m) => !/^https?:\/\//i.test(m[1])).length;
    const externalLinks = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)).filter((m) => /^https?:\/\//i.test(m[1])).length;

    let hasSitemap = false;
    let hasRobots = false;
    try { hasSitemap = (await fetch(new URL('/sitemap.xml', url).toString())).ok; } catch {}
    try { hasRobots = (await fetch(new URL('/robots.txt', url).toString())).ok; } catch {}

    const frequency: Record<string, number> = {};
    textOnly.toLowerCase().split(/\W+/).filter((word) => word.length > 3).forEach((word) => { frequency[word] = (frequency[word] || 0) + 1; });
    const topWords = Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));

    const pageSpeedScore = process.env.GOOGLE_PAGESPEED_API_KEY ? await (async () => {
      try {
        const ps = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`);
        const psData = await ps.json();
        return Math.round((psData?.lighthouseResult?.categories?.performance?.score || 0) * 100);
      } catch { return null; }
    })() : null;

    const result = {
      title,
      metaDescription,
      loadTimeScore: pageSpeedScore,
      words,
      images: { total: images.length, withAlt: altCount, withoutAlt: images.length - altCount },
      links: { internal: internalLinks, external: externalLinks },
      technical: { hasSitemap, hasRobots },
      topWords,
      scores: {
        speed: pageSpeedScore ?? 60,
        content: Math.min(100, Math.max(30, Math.round((words / 1000) * 100))),
        links: Math.min(100, Math.max(20, Math.round(((internalLinks + externalLinks) / 20) * 100))),
        technical: (hasSitemap ? 25 : 0) + (hasRobots ? 25 : 0) + (altCount === images.length ? 25 : 10) + 25,
      },
    };

    await prisma.toolUsage.create({ data: { userId: user.id, toolName: "seo-analyzer", inputData: body, outputData: result } }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("SEO analyzer error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
