"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CircleCheck, Clock3, Loader2, QrCode, RotateCcw } from "@/components/icons";
import { resolvePalette } from "@/lib/business/loyalty/templates";
import type { LoyaltyCardView } from "@/lib/business/loyalty/types";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { Burst } from "./Celebration";
import { cardVisualProps, firstName, type PublicProgram } from "./format";

type State =
  | { kind: "loading" }
  | { kind: "done"; card: LoyaltyCardView; replayed: boolean }
  | { kind: "error"; message: string; code: string | null; card: LoyaltyCardView; retry: boolean };

/** Autoservicio: al abrir el QR del mostrador, suma el sello solo y festeja. */
export function SelfStamp({ program, initialCard, code, cardUrl, joinUrl }: { program: PublicProgram; initialCard: LoyaltyCardView; code: string; cardUrl: string; joinUrl: string }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>({ kind: "loading" });
  const started = useRef(false);
  const accent = resolvePalette(program.design).accent;

  const claim = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/loyalty/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slug: program.slug, code }),
      });
      const json = (await res.json().catch(() => null)) as { success?: boolean; data?: { card: LoyaltyCardView; replayed: boolean }; error?: string; code?: string } | null;
      if (res.ok && json?.success && json.data) {
        setState({ kind: "done", card: json.data.card, replayed: json.data.replayed });
        try {
          navigator.vibrate?.(30);
        } catch {
          /* sin vibración */
        }
        return;
      }
      setState({ kind: "error", message: json?.error ?? "No pudimos sumar tu sello. Probá de nuevo.", code: json?.code ?? null, card: initialCard, retry: res.status >= 500 || res.status === 429 });
    } catch {
      setState({ kind: "error", message: "Sin conexión. Revisá tu señal y probá de nuevo.", code: null, card: initialCard, retry: true });
    }
  }, [program.slug, code, initialCard]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void claim();
  }, [claim]);

  const shown = state.kind === "loading" ? initialCard : state.card;
  const visual = cardVisualProps(program, shown);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative w-full">
        <motion.div
          key={state.kind}
          initial={reduce || state.kind !== "done" ? false : { scale: 0.96, rotate: -1.5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex justify-center"
        >
          <LoyaltyCard {...visual} side="back" size="lg" />
        </motion.div>
        <Burst burstKey={state.kind === "done" && !state.replayed ? 1 : 0} label="+1" color={accent} />
      </div>

      <div className="flex min-h-[7.5rem] w-full flex-col items-center gap-3" aria-live="polite" role="status">
        {state.kind === "loading" ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-gold motion-reduce:animate-none" aria-hidden />
            <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Sumando tu sello…</p>
          </>
        ) : state.kind === "done" ? (
          <>
            <CircleCheck className="h-9 w-9 text-gold" aria-hidden />
            <p className="font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
              {state.replayed ? "Este sello ya está en tu tarjeta" : `¡Listo, ${firstName(state.card.customerName)}! Sumaste 1 sello`}
            </p>
            <p className="text-[15px] text-[var(--text-secondary)]">{state.card.progress.label}</p>
            {state.card.progress.available.length ? (
              <p className="mv-chip mv-chip-gold h-auto py-1.5 text-[13px]">Mostrá tu tarjeta en caja para canjearlo</p>
            ) : null}
          </>
        ) : (
          <>
            {state.code === "DAILY_LIMIT" || state.code === "COOLDOWN" ? (
              <Clock3 className="h-8 w-8 text-gold" aria-hidden />
            ) : (
              <QrCode className="h-8 w-8 text-[var(--text-secondary)]" aria-hidden />
            )}
            <p className="font-display text-xl font-semibold leading-snug text-[var(--text-primary)]">{state.message}</p>
            {state.code === "CODE_EXPIRED" ? <p className="text-sm text-[var(--text-secondary)]">El código del mostrador cambia cada 30 segundos.</p> : null}
          </>
        )}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {state.kind === "error" && state.code === "NO_CARD" ? (
          <Link href={joinUrl} className="mv-btn mv-btn-primary mv-btn-lg w-full">
            Sumarme al club
          </Link>
        ) : null}
        {state.kind === "error" && state.retry ? (
          <button type="button" onClick={claim} className="mv-btn mv-btn-primary mv-btn-lg w-full">
            <RotateCcw className="h-4 w-4" aria-hidden />
            Probar de nuevo
          </button>
        ) : null}
        <Link href={cardUrl} className={`mv-btn mv-btn-lg w-full ${state.kind === "done" ? "mv-btn-primary" : "mv-btn-secondary"}`}>
          Ver mi tarjeta
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
