/** "Probá de nuevo en 40 s" / "en 3 min" / "en 2 h", redondeando para arriba. */
export function retryAfterCopy(seconds: number): string {
  const safe = Math.max(1, Math.ceil(Number.isFinite(seconds) ? seconds : 60));
  if (safe < 60) return `Probá de nuevo en ${safe} s.`;
  const minutes = Math.ceil(safe / 60);
  if (minutes < 60) return `Probá de nuevo en ${minutes} min.`;
  const hours = Math.ceil(minutes / 60);
  return `Probá de nuevo en ${hours} h.`;
}

/** Segundos hasta tener una ficha completa en un balde de fichas. */
export function secondsUntilToken(tokens: number, refillPerMinute: number): number {
  if (refillPerMinute <= 0) return 3600;
  return Math.max(1, Math.ceil(((1 - tokens) / refillPerMinute) * 60));
}
// creado por pato dev y askforvini
