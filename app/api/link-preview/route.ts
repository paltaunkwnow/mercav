import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { assertPublicHttpUrlResolved, readTextLimited } from "@/lib/security/ssrf";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("url");
    if (!raw) return NextResponse.json({ success: false, error: "URL requerida" }, { status: 400 });

    if (raw.length > 2048) return NextResponse.json({ success: false, error: "URL demasiado larga" }, { status: 400 });

    // Valida esquema/host y además resuelve DNS: bloquea dominios que apuntan a IPs privadas
    let target: URL;
    try {
      target = await assertPublicHttpUrlResolved(raw);
    } catch {
      return NextResponse.json({ success: false, error: "Destino no permitido" }, { status: 400 });
    }
    const response = await fetch(target.toString(), {
      headers: { "User-Agent": "MercavLinkPreview/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "No se pudo previsualizar el enlace" }, { status: 422 });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json({ success: false, error: "No se pudo previsualizar el enlace" }, { status: 422 });
    }
    // Leer como máximo 200 KB (antes se descargaba todo el cuerpo y luego se recortaba)
    const html = await readTextLimited(response, 200_000);

    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || target.toString();
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ||
      "";
    const rawImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || "";
    // Solo imágenes http(s) absolutas (resueltas contra la página); nada de javascript:/data:
    let image = "";
    try {
      const resolved = rawImage ? new URL(rawImage, target) : null;
      if (resolved && (resolved.protocol === "https:" || resolved.protocol === "http:")) image = resolved.toString().slice(0, 2048);
    } catch {
      image = "";
    }

    return NextResponse.json({ success: true, data: { title: title.slice(0, 300), description: description.slice(0, 500), image, url: target.toString() } });
  } catch (error) {
    console.error("Link preview error:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ success: false, error: "No se pudo previsualizar el enlace" }, { status: 400 });
  }
}
// creado por pato dev y askforvini
