import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { assertPublicHttpUrl } from "@/lib/security/safe-url";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("url");
    if (!raw) return NextResponse.json({ success: false, error: "URL requerida" }, { status: 400 });

    const target = assertPublicHttpUrl(raw);
    const response = await fetch(target.toString(), {
      headers: { "User-Agent": "MercavLinkPreview/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "No se pudo previsualizar el enlace" }, { status: 422 });
    }
    const html = (await response.text()).slice(0, 200_000);

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || target.toString();
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
      "";
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || "";

    return NextResponse.json({ success: true, data: { title, description, image, url: target.toString() } });
  } catch (error) {
    console.error("Link preview error:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ success: false, error: "No se pudo previsualizar el enlace" }, { status: 400 });
  }
}
// creado por pato dev y askforvini
