import { NextResponse } from "next/server";
import { z } from "zod";
import { SOURCE_KEYS } from "@/lib/calendar/sources";
import { regionsFor } from "@/lib/calendar";
import { LATAM_CODES } from "@/lib/geo/latam";
import { getCalendarPrefs, saveCalendarPrefs, sessionUserId } from "@/lib/calendar/server";

const PrefsSchema = z.object({
  country: z.enum(LATAM_CODES as [string, ...string[]]),
  region: z.string().max(24).nullable(),
  sources: z.array(z.enum(SOURCE_KEYS as [string, ...string[]])).max(SOURCE_KEYS.length),
  israel: z.boolean(),
  hidden: z.array(z.string().min(1).max(80)).max(300),
});

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  const prefs = await getCalendarPrefs(userId);
  return NextResponse.json({ success: true, data: prefs }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = PrefsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Preferencias inválidas" }, { status: 400 });
  // La región tiene que existir en ese país; si no, se descarta.
  const region = parsed.data.region && regionsFor(parsed.data.country).some((r) => r.code === parsed.data.region) ? parsed.data.region : null;
  const prefs = await saveCalendarPrefs(userId, { ...parsed.data, region } as Parameters<typeof saveCalendarPrefs>[1]);
  return NextResponse.json({ success: true, data: prefs });
}
// creado por pato dev y askforvini
