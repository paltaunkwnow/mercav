import { NextRequest, NextResponse } from "next/server";
import { disabledResponse, internalError, isCronAuthorized } from "../../_lib/http";
import { syncForumFeeds } from "../../_lib/forum-sync";

export const maxDuration = 60;

// Comparación en tiempo constante del CRON_SECRET (ver _lib/http).
const authorized = isCronAuthorized;

/** Keeps the Pwn archive warm so a visit is never an empty first scrape. */
export async function GET(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  try {
    const forums = await syncForumFeeds();
    return NextResponse.json({ success: true, data: { forums } });
  } catch (error) {
    return internalError("pwn forum cycle", error);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
// creado por pato dev y askforvini
