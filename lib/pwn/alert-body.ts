/**
 * Convierte el cuerpo de una alerta (líneas separadas por \n, ver alert-engine) en partes para la UI:
 * párrafos, pasos de la recomendación como lista y enlaces http(s) que se pueden abrir.
 */
export type AlertBodyView = {
  paragraphs: string[];
  steps: string[];
  links: { href: string; label: string }[];
};

const FACT_PREFIXES = ["Severidad:", "Fuente:", "Estado de verificación:"];

function safeLink(raw: string): { href: string; label: string } | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { href: url.toString(), label: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function splitSteps(text: string): string[] {
  return text
    .replace(/\.\s*$/, "")
    .split(/,\s+|\s+y\s+/)
    .map((step) => capitalize(step.trim()))
    .filter(Boolean);
}

export function parseAlertBody(body: string | null | undefined): AlertBodyView {
  const view: AlertBodyView = { paragraphs: [], steps: [], links: [] };
  if (!body) return view;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^Recomendaci[oó]n:/i.test(line)) {
      view.steps.push(...splitSteps(line.replace(/^Recomendaci[oó]n:\s*/i, "")));
      continue;
    }
    const linkMatch = /^Enlace externo:\s*(\S+)/i.exec(line);
    if (linkMatch) {
      const link = safeLink(linkMatch[1]);
      if (link) view.links.push(link);
      continue;
    }
    // Severidad, fuente y verificación ya se ven como insignias.
    if (FACT_PREFIXES.some((prefix) => line.startsWith(prefix))) continue;
    view.paragraphs.push(line);
  }
  return view;
}
// creado por pato dev y askforvini
