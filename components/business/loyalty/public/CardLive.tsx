"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Clock3, Crown, Lock } from "@/components/icons";
import { resolvePalette } from "@/lib/business/loyalty/templates";
import type { LoyaltyCardView } from "@/lib/business/loyalty/types";
import { CardFlip } from "./CardFlip";
import { Burst } from "./Celebration";
import { RewardsList } from "./Rewards";
import { cardChanged, cardVisualProps, shortDay, signedUnits, unitWord, units, type PublicProgram } from "./format";

const POLL_MS = 15_000;

/**
 * Tarjeta del cliente en vivo. Mientras la página está a la vista consulta el estado cada 15 s:
 * cuando la caja suma un sello, la tarjeta vuelve al reverso, festeja y la página se actualiza
 * (actividad y mensajes vienen del servidor con router.refresh()).
 */
export function CardLive({
  program,
  initialCard,
  remember,
  afterCard,
  children,
}: {
  program: PublicProgram;
  initialCard: LoyaltyCardView;
  /** Dejar la tarjeta recordada en este navegador (no cuando la abre alguien del equipo). */
  remember: boolean;
  afterCard?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [card, setCard] = useState(initialCard);
  const cardRef = useRef(initialCard);
  const [showFront, setShowFront] = useState(false);
  const [burst, setBurst] = useState<{ key: number; label: string | null }>({ key: 0, label: null });
  const [announce, setAnnounce] = useState("");
  const accent = resolvePalette(program.design).accent;
  const { slug, type } = program;
  const serial = initialCard.serial;

  const celebrate = useCallback(
    (next: LoyaltyCardView, delta: number) => {
      setShowFront(false);
      setBurst((b) => ({ key: b.key + 1, label: signedUnits(type, delta) }));
      setAnnounce(`Sumaste ${units(type, delta)}. ${next.progress.label}`);
      try {
        navigator.vibrate?.(30);
      } catch {
        /* sin vibración */
      }
    },
    [type],
  );

  // Lo que llega del servidor (router.refresh) manda: puede traer un cumpleaños o un vencimiento aplicado.
  useEffect(() => {
    if (cardChanged(cardRef.current, initialCard)) {
      cardRef.current = initialCard;
      setCard(initialCard);
    }
  }, [initialCard]);

  useEffect(() => {
    if (burst.key && !reduce) void controls.start({ scale: [1, 1.035, 1], transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } });
  }, [burst.key, controls, reduce]);

  useEffect(() => {
    let stopped = false;
    let rememberPending = remember;
    async function tick() {
      if (stopped || document.visibilityState !== "visible") return;
      const params = new URLSearchParams({ slug, serial });
      if (rememberPending) params.set("remember", "1");
      try {
        const res = await fetch(`/api/loyalty/card?${params.toString()}`, { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) return;
        rememberPending = false;
        const json = (await res.json()) as { success?: boolean; data?: { card: LoyaltyCardView } };
        const next = json?.data?.card;
        if (stopped || !json?.success || !next) return;
        const prev = cardRef.current;
        if (!cardChanged(prev, next)) return;
        cardRef.current = next;
        setCard(next);
        if (next.balance > prev.balance) celebrate(next, next.balance - prev.balance);
        else setAnnounce(`Tu saldo ahora es de ${units(type, next.balance)}.`);
        router.refresh();
      } catch {
        /* sin señal: se reintenta en el próximo ciclo */
      }
    }
    void tick();
    const timer = window.setInterval(tick, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug, serial, remember, type, celebrate, router]);

  const visual = cardVisualProps(program, card);
  const { progress, tier } = card;
  const blocked = card.status === "BLOCKED";

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Tu tarjeta" className="flex flex-col items-center gap-3">
        <div className="relative w-full">
          <motion.div animate={controls}>
            <CardFlip {...visual} showFront={showFront} onToggle={() => setShowFront((v) => !v)} />
          </motion.div>
          <Burst burstKey={burst.key} label={burst.label} color={accent} />
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">Tocá la tarjeta para darla vuelta</p>
      </section>

      <section aria-label="Tu progreso" className="mv-panel flex flex-col gap-4 p-5">
        {blocked ? (
          <p className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-[var(--text-primary)]">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            Esta tarjeta está pausada. Consultá en el local.
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          <p className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[1.85rem]">{progress.label}</p>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--mv-gold-wash)]"
            role="progressbar"
            aria-label={progress.nextReward ? `Progreso hacia ${progress.nextReward.name}` : "Progreso"}
            aria-valuemin={0}
            aria-valuemax={progress.goal}
            aria-valuenow={Math.min(progress.current, progress.goal)}
          >
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-sm tabular-nums text-[var(--text-secondary)]">
            {type === "STAMPS" ? `${Math.min(card.balance, progress.goal)} de ${progress.goal} sellos` : `${units("POINTS", card.balance)} en tu tarjeta`}
            {card.visits ? ` · ${card.visits} ${card.visits === 1 ? "visita" : "visitas"}` : null}
          </p>
        </div>

        {tier.current || tier.next ? (
          <div className="flex items-start gap-3 border-t border-[var(--mv-hairline)] pt-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--mv-gold-wash)] text-gold" aria-hidden>
              <Crown className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-sm leading-snug">
              {tier.current ? (
                <p className="font-semibold text-[var(--text-primary)]">
                  Nivel {tier.current.name}
                  {tier.current.perk ? <span className="font-normal text-[var(--text-secondary)]"> · {tier.current.perk}</span> : null}
                </p>
              ) : (
                <p className="font-semibold text-[var(--text-primary)]">Todavía sin nivel</p>
              )}
              {tier.next && tier.toNext !== null ? (
                <p className="text-[var(--text-secondary)]">
                  Te {tier.toNext === 1 ? "falta" : "faltan"} {units(type, tier.toNext)} para {tier.next.name}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {card.expiresOn && card.balance > 0 ? (
          <p className="flex items-start gap-2 border-t border-[var(--mv-hairline)] pt-4 text-sm text-[var(--text-secondary)]">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
            Tus {unitWord(type, 2)} vencen el {shortDay(card.expiresOn)} si no volvés.
          </p>
        ) : null}
      </section>

      {afterCard}

      {program.rewards.length ? (
        <section aria-labelledby="rewards-title" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="rewards-title" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Premios
            </h2>
            {progress.available.length ? <span className="text-xs font-medium text-[var(--text-secondary)]">Pedilo en caja con tu código</span> : null}
          </div>
          <RewardsList rewards={program.rewards} type={type} balance={card.balance} />
        </section>
      ) : null}

      {children}

      <p className="sr-only" aria-live="polite" role="status">
        {announce}
      </p>
    </div>
  );
}
// creado por pato dev y askforvini
