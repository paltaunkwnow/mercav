export function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

/** True when a catalog breach belongs to this registrable host. */
export function matchesBreachDomain(breachDomain: string | null | undefined, query: string): boolean {
  if (!breachDomain) return false;
  const a = normalizeHost(breachDomain);
  const b = normalizeHost(query);
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

export function breachesForDomain<T extends { domain: string | null }>(breaches: T[], query: string): T[] {
  return breaches.filter((item) => matchesBreachDomain(item.domain, query));
}
// creado por pato dev y askforvini
