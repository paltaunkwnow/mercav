import { NextRequest, NextResponse } from "next/server";
import { disabledResponse, internalError } from "../../_lib/http";
import { syncForumFeeds } from "../../_lib/forum-sync";

export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

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
