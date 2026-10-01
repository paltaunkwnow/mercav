// Fetch defensivo para feeds y foros allowlisted.
// - Solo HTTPS y hosts de la allowlist (también en cada salto de redirect).
// - Redirects manuales (máx. 3): nunca seguimos a un host fuera de la lista.
// - Timeout total y tope de bytes para que un feed gigante no tumbe el ciclo.

const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export function isAllowlistedHttpsUrl(raw: string, allowedHosts: readonly string[]): URL | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    if (!allowedHosts.includes(parsed.hostname.toLowerCase())) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<string | null> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    return null;
  }
  if (!response.body) return await response.text();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

/**
 * Devuelve el cuerpo como texto o null ante cualquier problema (host no permitido,
 * redirect fuera de la allowlist, status no-OK, timeout, cuerpo demasiado grande).
 */
export async function fetchAllowlistedText(
  url: string,
  allowedHosts: readonly string[],
  init: { headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number } = {},
): Promise<string | null> {
  const signal = AbortSignal.timeout(init.timeoutMs ?? 15_000);
  let current = isAllowlistedHttpsUrl(url, allowedHosts);
  try {
    for (let hop = 0; current && hop <= MAX_REDIRECTS; hop += 1) {
      const response = await fetch(current.toString(), {
        cache: "no-store",
        redirect: "manual",
        signal,
        headers: init.headers,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location) return null;
        let next: string;
        try {
          next = new URL(location, current).toString();
        } catch {
          return null;
        }
        current = isAllowlistedHttpsUrl(next, allowedHosts);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        return null;
      }
      return await readCapped(response, init.maxBytes ?? DEFAULT_MAX_BYTES);
    }
    return null;
  } catch {
    return null;
  }
}
// creado por pato dev y askforvini
