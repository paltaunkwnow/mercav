const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "::", "metadata.google.internal", "metadata"]);

function isPrivateIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, b, Number(m[3]), Number(m[4])].some((n) => n > 255)) return true;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata de nubes (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast / reservado
  return false;
}

/** true si `ip` (v4 o v6 literal, sin corchetes) no es una dirección pública. */
export function isPrivateIp(ip: string): boolean {
  const host = ip.toLowerCase();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return isPrivateIpv4(host);
  if (!host.includes(":")) return false;
  if (host === "::" || host === "::1") return true;
  // IPv4 mapeada/compatible en IPv6 (::ffff:127.0.0.1 o ::ffff:7f00:1)
  const mapped = /^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/.exec(host);
  if (mapped) return isPrivateIpv4(mapped[1]);
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isPrivateIpv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  // fc00::/7 (ULA), fe80::/10 (link-local), ff00::/8 (multicast)
  return /^f[cd][0-9a-f]{0,2}:/.test(host) || /^fe[89ab][0-9a-f]?:/.test(host) || host.startsWith("ff");
}

/** Allows only public http(s) URLs. Rejects private networks and metadata hosts. */
export function assertPublicHttpUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("URL inválida");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Solo se permiten enlaces http(s)");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Destino no permitido");
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Destino no permitido");
  }
  // Antes `host.startsWith("fc")` bloqueaba dominios legítimos (p. ej. fcbarcelona.com);
  // ahora solo se evalúan IPs literales.
  if (isPrivateIp(host)) {
    throw new Error("Destino no permitido");
  }
  return parsed;
}

export function safeCallbackPath(raw: string | null | undefined): string {
  if (!raw) return "/inicio";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) {
    return "/inicio";
  }
  return raw;
}
// creado por pato dev y askforvini
