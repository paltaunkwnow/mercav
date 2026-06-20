import { NextResponse } from "next/server";
import { verifyRecaptchaToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;
    const result = await verifyRecaptchaToken(token);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Verification failed' }, { status: 400 });
    }
    return NextResponse.json({ success: true, score: result.score ?? null, data: result.data });
  } catch (err) {
    console.error('verify-recaptcha error', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
