export const INTERCEPTOR_UA = /burp|owasp[\s-]?zap|mitmproxy|fiddler|charles/i;

export function looksLikeInterceptor(userAgent: string | null | undefined) {
  return INTERCEPTOR_UA.test(userAgent || "");
}

export function displayIp(ip: string) {
  return ip.replace(/^::ffff:/i, "");
}

export function clip(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export const REASON_LABELS: Record<string, string> = {
  inspect: "Inspección / herramientas de desarrollo",
  shortcut: "Atajo de inspección",
  proxy: "Cliente de intercepción",
  webdriver: "Automatización",
};
// creado por pato dev y askforvini
