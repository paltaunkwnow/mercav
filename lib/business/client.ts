/** fetch JSON para los formularios de Business. Devuelve { ok, data, error } sin tirar. */
export async function sendJson<T = unknown>(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: string } | null;
    if (!res.ok || !json?.success) return { ok: false as const, error: json?.error ?? "Algo salió mal. Probá de nuevo.", data: json?.data };
    return { ok: true as const, data: json.data as T };
  } catch {
    return { ok: false as const, error: "Sin conexión. Probá de nuevo." };
  }
}
// creado por pato dev y askforvini
