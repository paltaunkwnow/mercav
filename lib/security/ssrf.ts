import { lookup } from "dns/promises";
import { assertPublicHttpUrl, isPrivateIp } from "./safe-url";

/**
 * Como assertPublicHttpUrl, pero además resuelve el DNS y rechaza si CUALQUIER dirección
 * del host es privada (p. ej. un dominio que apunta a 127.0.0.1 o a 169.254.169.254).
 * Solo servidor. Queda una ventana de DNS rebinding entre esta resolución y el fetch.
 */
export async function assertPublicHttpUrlResolved(raw: string): Promise<URL> {
  const url = assertPublicHttpUrl(raw);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error("No se pudo resolver el destino");
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error("Destino no permitido");
  }
  return url;
}

/** Lee como texto como máximo `maxBytes` del cuerpo, sin cargar respuestas enormes en memoria. */
export async function readTextLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return text.slice(0, maxBytes);
}
// creado por pato dev y askforvini
