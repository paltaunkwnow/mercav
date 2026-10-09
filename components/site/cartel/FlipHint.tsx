/** Flecha dibujada a mano que señala una tarjeta que se da vuelta al tocarla. Solo visual: la tarjeta ya lo dice en su aria-label. */
export function FlipHint() {
  return (
    <p aria-hidden className="c-label flex items-center gap-1.5 text-[1rem]">
      <svg viewBox="0 0 40 32" className="c-nudge h-7 w-9" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 27c9 1 20-3 26-17" />
        <path d="M24 11.5 31.5 8l2.5 8" />
      </svg>
      Tocala para darla vuelta
    </p>
  );
}
// creado por pato dev y askforvini
