"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPinned, MessagesSquare } from "lucide-react";
import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { TiltCard } from "@/components/motion/TiltCard";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";

const WORDS = [
  { text: "kosher", lang: "es" },
  { text: "כשר", lang: "he" },
  { text: "casher", lang: "es" },
];

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduce) {
      node.textContent = value.toLocaleString("es");
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = Math.round(v).toLocaleString("es");
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return <span ref={ref}>0</span>;
}

export type KosherPreviewPlace = { slug: string; name: string; city: string; type: KosherPlaceType; status: KosherStatus; verified: boolean };

const PINS = [
  { x: 82, y: 14 },
  { x: 90, y: 27 },
  { x: 12, y: 45 },
  { x: 22, y: 58 },
  { x: 86, y: 78 },
  { x: 93, y: 91 },
];

export function KosherAtlasPreview({ preview }: { preview: KosherPreviewPlace[] }) {
  const reduce = useReducedMotion();
  const cards = preview.slice(0, 3);
  const spots = [
    { left: "7%", top: "6%" },
    { right: "7%", top: "36.5%" },
    { left: "12%", top: "67%" },
  ];
  return (
    <TiltCard className="rounded-[2.5rem]">
      <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-border bg-bg-secondary">
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
        <div aria-hidden className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/20 blur-[90px]" />

        {PINS.map((pin, i) => (
          <span key={i} aria-hidden className="absolute" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
            {!reduce && (
              <motion.span
                className="absolute -inset-3 rounded-full bg-gold/25"
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
              />
            )}
            <span className="relative block h-3 w-3 rounded-full border-2 border-white bg-gold shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
          </span>
        ))}

        {cards.map((p, i) => (
          <motion.div
            key={p.slug}
            className="liquid-glass liquid-glass-lens absolute w-[62%] rounded-3xl p-3 xl:p-4"
            style={spots[i]}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -6, 0] }}
            transition={
              reduce
                ? undefined
                : { opacity: { duration: 0.6, delay: 0.3 + i * 0.15 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 } }
            }
          >
            <Link href={`/kosher/lugar/${p.slug}`} className="flex items-center gap-3 outline-none">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold xl:h-10 xl:w-10">
                <PlaceIcon type={p.type} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{p.city}</span>
              </span>
            </Link>
            <StatusBadge status={p.status} type={p.type} verified={p.verified} className="mt-2 xl:mt-3" />
          </motion.div>
        ))}
      </div>
    </TiltCard>
  );
}

export function KosherHero({
  stats,
  messageCount,
  preview,
}: {
  stats: { value: number; label: string }[];
  messageCount: number;
  preview: KosherPreviewPlace[];
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2600);
    return () => window.clearInterval(id);
  }, [reduce]);

  const word = WORDS[index];

  return (
    <section className="relative pt-6 md:pt-12" aria-labelledby="kosher-hero-title">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 rounded-full border border-techelet/30 bg-techelet-dim px-3.5 py-1.5 text-xs font-medium text-techelet"
      >
        Nuevo en Mercav · kosher.mercav.lat
      </motion.div>

      <h1 id="kosher-hero-title" aria-label="Dónde hay kosher." className="mt-7 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--text-primary)] sm:text-6xl md:text-7xl xl:text-[5.25rem]">
        Dónde hay{" "}
        <span className="relative inline-grid align-baseline">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={word.text}
              lang={word.lang}
              dir={word.lang === "he" ? "rtl" : "ltr"}
              initial={{ opacity: 0, y: "0.35em", filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: "-0.35em", filter: "blur(10px)" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="col-start-1 row-start-1 bg-gradient-to-br from-gold via-gold-light to-gold bg-clip-text text-transparent"
            >
              {word.text}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="text-gold">.</span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
        El atlas de lugares kosher, sinagogas y kehilot de Mercav. Con valoraciones de la comunidad, stock por sucursal y un
        chat propio para cada ciudad.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/kosher/mapa"
          className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gold px-8 text-base font-semibold text-black shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-transform active:scale-[0.98]"
        >
          <MapPinned className="h-5 w-5" aria-hidden />
          Abrir el mapa
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <Link
          href="/kosher/chat"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border bg-bg-secondary/60 px-8 text-base font-semibold text-[var(--text-primary)] transition-colors hover:border-gold/50"
        >
          <MessagesSquare className="h-5 w-5" aria-hidden />
          Chat de la comunidad
          {messageCount > 0 && <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-xs text-gold">{messageCount}</span>}
        </Link>
      </div>
      </div>
      {preview.length > 0 && (
        <div className="hidden lg:block">
          <KosherAtlasPreview preview={preview} />
        </div>
      )}
      </div>

      <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-secondary px-6 py-6">
            <dt className="text-xs text-[var(--text-tertiary)]">{s.label}</dt>
            <dd className="mt-1 font-display text-4xl font-semibold tabular-nums text-[var(--text-primary)]">
              <CountUp value={s.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
