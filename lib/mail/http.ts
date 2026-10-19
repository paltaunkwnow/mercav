import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { MailError } from "./config";

export function mailJson(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
}
export async function mailRoute(fn: () => Promise<Response>): Promise<Response> {
  try { return await fn(); }
  catch (error) {
    const known = error instanceof MailError;
    const status = known ? error.status : error instanceof ZodError || error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error("[mail] request failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ success: false, error: known ? error.message : status === 400 ? "Revisá los datos e intentá de nuevo." : "No pudimos completar la solicitud de correo." }, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) } });
  }
}
export async function readMailJson(request: Request, maxBytes = 300_000): Promise<unknown> {
  if (!(request.headers.get("content-type") || "").startsWith("application/json")) throw new MailError(415, "Se requiere JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new MailError(400, "Faltan datos.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new MailError(413, "La solicitud es demasiado grande."); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
