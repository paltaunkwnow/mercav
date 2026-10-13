"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { isPrivacyRates, quoteParts, quoteSpeech, quoteTime, type PrivacyRates } from "@/lib/privacy/quote";
import { cn } from "@/lib/utils";

/**
 * "≈ Bs 2.185 · ≈ 1,12 SOL · ≈ 78 XRP" y, debajo, "cotización aprox. de las 14:30 (fuente)". Neutro: hereda color y
 * tipografía del cartel. Recibe la cotización del servidor (getPrivacyRates) y la refresca cada 10 minutos mientras
 * la pestaña está visible. En una página de servidor sin JS, el mismo texto sale de quoteLine/quoteNote (lib/privacy/quote).
 */

const REFRESH_MS = 10 * 60_000;
const CHECK_MS = 60_000;

// Un solo pedido para todas las cotizaciones de la página (una tarjeta por producto).
let shared: PrivacyRates | null = null;
let fetchedAt = 0;
let inflight = false;
const listeners = new Set<(rates: PrivacyRates) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

const stamp = (r: PrivacyRates | null) => (r?.updatedAt ? Date.parse(r.updatedAt) || 0 : 0);
const newer = (a: PrivacyRates, b: PrivacyRates) => (stamp(b) > stamp(a) ? b : a);

async function refresh() {
  if (inflight) return;
  inflight = true;
  try {
    const res = await fetch("/api/privacy/rates", { headers: { Accept: "application/json" } });
    const data: unknown = res.ok ? await res.json() : null;
    if (isPrivacyRates(data) && (data.usdtBob !== null || data.solUsd !== null || data.xrpUsd !== null)) {
      shared = data;
      listeners.forEach((listener) => listener(data));
    }
  } catch {
    // Sin red: queda la cotización que ya se ve.
  } finally {
    fetchedAt = Date.now();
    inflight = false;
  }
}

function tick() {
  if (document.visibilityState === "visible" && Date.now() - fetchedAt >= REFRESH_MS) void refresh();
}

function subscribe(listener: (rates: PrivacyRates) => void, seed: PrivacyRates) {
  if (!fetchedAt) {
    // La primera vez cuenta desde la hora de la cotización que mandó el servidor: si ya es vieja, se pide enseguida.
    const age = seed.updatedAt ? Date.now() - stamp(seed) : REFRESH_MS;
    fetchedAt = Date.now() - Math.min(Math.max(age, 0), REFRESH_MS);
  }
  listeners.add(listener);
  if (shared) listener(newer(seed, shared));
  if (!timer) {
    timer = setInterval(tick, CHECK_MS);
    document.addEventListener("visibilitychange", tick);
  }
  tick();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
      document.removeEventListener("visibilitychange", tick);
    }
  };
}

type Props = {
  priceUsdt: number;
  /** La de getPrivacyRates() en el servidor. */
  initialRates: PrivacyRates;
  /** La línea chica con la hora y la fuente. */
  note?: boolean;
  className?: string;
};

export default function PriceQuote({ priceUsdt, initialRates, note = true, className }: Props) {
  const [rates, setRates] = useState(initialRates);
  const seed = useRef(initialRates);

  useEffect(() => subscribe((next) => setRates((prev) => newer(prev, next)), seed.current), []);
  useEffect(() => setRates((prev) => newer(prev, initialRates)), [initialRates]);

  const parts = quoteParts(priceUsdt, rates);
  if (!parts.length) return null;
  const time = note ? quoteTime(rates.updatedAt) : null;
  const showNote = note && (time || rates.source);

  return (
    <span className={cn("block", className)}>
      <span className="sr-only">{quoteSpeech(priceUsdt, rates)}</span>
      <span aria-hidden="true" className="tabular-nums">
        {parts.map((part, i) => (
          <Fragment key={part.unit}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">≈{" "}{part.text}</span>
          </Fragment>
        ))}
      </span>
      {showNote && (
        // El día solo aparece si la cotización no es de hoy: puede cambiar entre el servidor y el navegador a medianoche.
        <span className="mt-0.5 block text-[0.75em] leading-snug opacity-70" suppressHydrationWarning>
          cotización aprox.
          {time && (
            <>
              {time.day ? ` del ${time.day} a las ` : " de las "}
              <time dateTime={rates.updatedAt ?? undefined}>{time.time}</time>
            </>
          )}
          {rates.source && ` (${rates.source})`}
        </span>
      )}
    </span>
  );
}
// creado por pato dev y askforvini
