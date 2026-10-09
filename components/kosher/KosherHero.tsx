"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPinned, MessagesSquare } from "@/components/icons";
import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { TiltCard } from "@/components/motion/TiltCard";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { Container, buttonClass } from "@/components/site/primitives";
import { HostLink } from "@/components/layout/HostContext";

const EASE = [0.23, 1, 0.32, 1] as const;

export type KosherPreviewPlace = { slug: string; name: string; city: string; type: KosherPlaceType; status: KosherStatus; verified: boolean };

/* Decorative pin positions on the stylised map (not geographic). */
const PINS = [
  { x: 82, y: 14 },
  { x: 90, y: 27 },
  { x: 12, y: 45 },
  { x: 22, y: 58 },
  { x: 86, y: 78 },
  { x: 93, y: 91 },
];

const SPOTS = [
  { left: "7%", top: "6%" },
  { right: "7%", top: "36.5%" },
  { left: "12%", top: "67%" },
];

/** Atlas showcase used by the Kosher landing and the Mercav home. Shows real places passed in `preview`. */
export function KosherAtlasPreview({ preview }: { preview: KosherPreviewPlace[] }) {
  const reduce = useReducedMotion();
  const cards = preview.slice(0, 3);
  return (
    <TiltCard className="rounded-[2rem] md:rounded-[2.5rem]">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-[var(--mv-hairline)] bg-bg-secondary md:rounded-[2.5rem]">
        <svg aria-hidden className="absolute inset-0 h-full w-full text-[var(--text-tertiary)]" preserveAspectRatio="none" viewBox="0 0 100 125">
          <defs>
            <pattern id="k-dots" width="3" height="3" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.28" fill="currentColor" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100" height="125" fill="url(#k-dots)" />
          <path d="M-5 40 C 25 30, 45 55, 105 38" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.6" fill="none" />
          <path d="M-5 85 C 30 70, 60 100, 105 80" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.6" fill="none" />
          <path d="M35 -5 C 42 40, 30 80, 48 130" stroke="currentColor" strokeOpacity="0.14" strokeWidth="0.5" fill="none" />
          <path d="M72 -5 C 66 50, 80 90, 70 130" stroke="currentColor" strokeOpacity="0.14" strokeWidth="0.5" fill="none" />
        </svg>
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-techelet/20 blur-[90px]" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/15 blur-[90px]" />

        {PINS.map((pin, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold shadow-[0_0_0_6px_rgba(212,175,55,0.18),0_2px_8px_rgba(0,0,0,0.3)]"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          />
        ))}

        {cards.map((p, i) => (
          <motion.div
            key={p.slug}
            className="liquid-glass liquid-glass-lens absolute w-[64%] rounded-3xl p-3 xl:p-4"
            style={SPOTS[i]}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 + i * 0.1, ease: EASE }}
          >
            {/* Also shown on the mercav.lat landing, where /kosher/… lives on kosher.mercav.lat. */}
            <HostLink href={`/kosher/lugar/${p.slug}`} className="mv-focus -m-1 flex items-center gap-3 rounded-2xl p-1">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold xl:h-10 xl:w-10">
                <PlaceIcon type={p.type} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{p.city}</span>
              </span>
            </HostLink>
            <StatusBadge status={p.status} type={p.type} verified={p.verified} className="mt-2 xl:mt-3" />
          </motion.div>
        ))}
      </div>
    </TiltCard>
  );
}

export function KosherHero({ messageCount, preview }: { messageCount: number; preview: KosherPreviewPlace[] }) {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } };

  return (
    <section aria-labelledby="kosher-hero-title" className="relative pb-20 pt-12 md:pb-28 md:pt-16">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <motion.p {...rise(0)} className="mv-kicker !text-techelet">
              Atlas comunitario de Latinoamérica
            </motion.p>
            <motion.h1
              id="kosher-hero-title"
              initial={reduce ? false : { y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="mv-display mt-6"
            >
              Dónde hay kosher,{" "}
              <span className="mv-gold-text">en cada ciudad.</span>
            </motion.h1>
            <motion.p {...rise(0.15)} className="mv-lead mt-6">
              Restaurantes, tiendas, sinagogas, mikvaot y kehilot en un solo mapa, con la fuente de cada estado a la vista, stock por sucursal y una
              conversación propia para cada ciudad.
            </motion.p>
            <motion.div {...rise(0.25)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/kosher/mapa" className={buttonClass("primary", "lg", "group w-full sm:w-auto")}>
                <MapPinned className="h-5 w-5" aria-hidden />
                Abrir el mapa
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/kosher/chat" className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
                <MessagesSquare className="h-5 w-5" aria-hidden />
                Chat de la comunidad
                {messageCount > 0 && (
                  <span className="mv-data rounded-full bg-techelet-dim px-2 py-0.5 text-xs text-techelet" aria-label={`${messageCount} mensajes`}>
                    {messageCount.toLocaleString("es")}
                  </span>
                )}
              </Link>
            </motion.div>
            <motion.p {...rise(0.32)} className="mt-6 text-sm text-[var(--text-tertiary)]">
              Entrás con tu cuenta Mercav de siempre. Mercav Kosher muestra fuentes y reportes; no emite hechsher ni psak.
            </motion.p>
          </div>

          {preview.length > 0 && (
            <motion.div {...rise(0.2)} className="mx-auto w-full max-w-md lg:max-w-none">
              <KosherAtlasPreview preview={preview} />
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}
