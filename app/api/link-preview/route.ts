import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) return NextResponse.json({ success: false, error: "URL requerida" }, { status: 400 });

    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Mercav" } });
    const html = await response.text();

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || url;
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim()
      || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim()
      || "";
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || "";

    return NextResponse.json({ success: true, data: { title, description, image, url } });
  } catch (error) {
    console.error("Link preview error:", error);
    return NextResponse.json({ success: false, error: "No se pudo previsualizar el enlace" }, { status: 500 });
  }
}
