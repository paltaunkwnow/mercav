import { NextResponse } from "next/server";
import { getKosherViewer, kosherError } from "@/lib/kosher/server";
import { loadPlaceDetail } from "@/components/kosher/place/detail";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const viewer = await getKosherViewer();
  const detail = await loadPlaceDetail(params.slug, viewer);
  if (!detail) return kosherError(404, "Lugar no encontrado");
  return NextResponse.json({ success: true, ...detail }, { headers: { "Cache-Control": "private, no-store" } });
}
// creado por pato dev y askforvini
