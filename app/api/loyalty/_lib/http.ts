import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";

/** Respuestas JSON de la API de Fidelización ({ success, data | error }) y límite por IP. Solo rutas. */

const NO_STORE = { "Cache-Control": "private, no-store" };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: NO_STORE });
}

export function fail(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error, ...extra }, { status, headers: NO_STORE });
}

/** Solo JSON: un formulario de otro sitio (text/plain) no puede disparar estas rutas. */
export function requireJson(req: Request) {
  const type = req.headers.get("content-type") ?? "";
  return type.toLowerCase().startsWith("application/json") ? null : fail("Formato no soportado.", 415);
}

/** Límite con la tabla compartida (por IP, o por usuario si se pasa). Devuelve la respuesta 429 con un texto propio, o null. */
export async function limitByIp(req: NextRequest, route: string, capacity: number, refillPerMinute: number, userId?: string | null) {
  const limited = await checkRateLimit(req, { route, capacity, refillPerMinute, userId: userId ?? null });
  if (!limited) return null;
  const retry = limited.headers.get("Retry-After") ?? "60";
  return NextResponse.json(
    { success: false, error: "Muchos intentos seguidos. Esperá un momento y probá de nuevo." },
    { status: 429, headers: { ...NO_STORE, "Retry-After": retry } },
  );
}
// creado por pato dev y askforvini
