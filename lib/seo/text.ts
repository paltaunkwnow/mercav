/** Plain-text excerpt for meta descriptions (≈155 chars, no markup, no cut words). */
export function excerpt(text: string | null | undefined, max = 155) {
  const clean = (text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : max).trimEnd()}…`;
}

/** Safe JSON for a <script type="application/ld+json"> block. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
// creado por pato dev y askforvini
