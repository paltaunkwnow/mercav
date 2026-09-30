const EMAIL_RE = /^[^\s@]+@[^\s@]+$/;
const HOST_CHARS_RE = /^[^\s/?#:@[\]\\]+$/;
const DOMAIN_LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;
const CVE_RE = /^CVE-\d{4}-\d{4,}$/;

// Validates a bare hostname and converts IDNs to punycode. Rejects IP literals.
function toAsciiHost(value: string): string | null {
  if (value.length === 0 || !HOST_CHARS_RE.test(value)) return null;

  let host: string;
  try {
    host = new URL(`http://${value}`).hostname;
  } catch {
    return null;
  }

  if (host.length === 0 || host.length > 253) return null;
  const labels = host.split(".");
  if (labels.length < 2) return null;
  if (!labels.every((label) => DOMAIN_LABEL_RE.test(label))) return null;
  if (!TLD_RE.test(labels[labels.length - 1])) return null;
  return host;
}

/** Lowercased, trimmed email with a punycode domain, or null if invalid. */
export function normalizeEmail(input: string): string | null {
  const value = String(input ?? "").trim().toLowerCase();
  if (value.length === 0 || value.length > 254 || !EMAIL_RE.test(value)) return null;

  const at = value.lastIndexOf("@");
  const local = value.slice(0, at);
  if (local.length > 64) return null;

  const domain = toAsciiHost(value.slice(at + 1));
  if (!domain) return null;
  return `${local}@${domain}`;
}

/**
 * Bare punycode hostname: strips scheme, credentials, path, port, trailing
 * dot, a leading "*." wildcard and "www.". Returns null if invalid or an IP.
 */
export function normalizeDomain(input: string): string | null {
  let value = String(input ?? "").trim().toLowerCase();
  if (value.length === 0) return null;

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split(/[/?#]/)[0];
  value = value.slice(value.lastIndexOf("@") + 1);
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.$/, "");
  value = value.replace(/^\*\./, "");
  value = value.replace(/^www\./, "");
  return toAsciiHost(value);
}

/** "cve-2024-3094" -> "CVE-2024-3094", or null if not a valid CVE identifier. */
export function normalizeCve(input: string): string | null {
  const value = String(input ?? "").trim().toUpperCase().replace(/[\u2010-\u2015]/g, "-");
  return CVE_RE.test(value) ? value : null;
}
// creado por pato dev y askforvini
