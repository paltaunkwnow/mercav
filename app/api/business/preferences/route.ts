import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionUserId } from "@/lib/calendar/server";
import { getAccountBusinessPreferences, saveLastBusinessWorkspace } from "@/lib/business/preferences";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ success: true, data: await getAccountBusinessPreferences(userId) });
}

export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  const parsed = z.object({ lastWorkspaceId: z.string().min(1).max(64) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Empresa inválida" }, { status: 400 });
  if (!(await saveLastBusinessWorkspace(userId, parsed.data.lastWorkspaceId))) return NextResponse.json({ success: false, error: "No pertenecés a esta empresa" }, { status: 404 });
  return NextResponse.json({ success: true, data: { lastWorkspaceId: parsed.data.lastWorkspaceId } });
}
