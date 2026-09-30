"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "framer-motion";
import { TiltCard } from "@/components/motion/TiltCard";

const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({ to, start, delay = 0, className }: { to: number; start: boolean; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!start || reduce) return;
    const controls = animate(0, to, { duration: 1.4, delay, ease: EASE, onUpdate: setValue });
    return () => controls.stop();
  }, [start, to, delay, reduce]);
  return <span className={className}>$ {value.toFixed(2)}</span>;
}

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
};

export function TransactionCard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const shown = reduce || inView;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(py, [0, 1], ["0%", "100%"]);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgba(212,175,55,0.16), transparent 55%)`;
  const [hovering, setHovering] = useState(false);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }

  return (
    <div className="relative w-full flex-1" ref={ref}>
      <div className="absolute inset-0 -z-10 mx-auto aspect-square max-w-md rounded-full bg-gradient-to-tr from-gold/20 to-transparent opacity-50 blur-3xl" />

      <motion.div
        className="relative mx-auto max-w-md"
        initial={reduce ? false : { opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-gold/40 via-gold/10 to-gold/30 blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovering ? 0.35 : shown ? 0.15 : 0 }}
          transition={{ duration: 0.4 }}
        />

        <TiltCard className="rounded-3xl">
          <div
            onPointerMove={onMove}
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => {
              setHovering(false);
              px.set(0.5);
              py.set(0.5);
            }}
            className="relative overflow-hidden rounded-3xl border border-border bg-bg-secondary/90 p-8 shadow-2xl backdrop-blur-2xl"
          >
            {!reduce && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: glare, opacity: hovering ? 1 : 0 }}
              />
            )}

            {!reduce && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-gold/10 to-transparent"
                initial={{ top: "-30%" }}
                animate={shown ? { top: ["-30%", "130%"] } : undefined}
                transition={{ duration: 2.2, delay: 0.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
              />
            )}

            <motion.div variants={list} initial={reduce ? false : "hidden"} animate={shown ? "show" : "hidden"}>
              <motion.div variants={item} className="relative mb-8 flex items-center justify-between border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <h4 className="text-[12px] font-bold uppercase tracking-tight text-white">Certificado de Transacción</h4>
                  </div>
                  <p className="font-mono text-[10px] text-gray-500">ID: MRC-5592-X90-GOLD</p>
                </div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <motion.circle cx="12" cy="12" r="10" initial={reduce ? false : { pathLength: 0 }} animate={shown ? { pathLength: 1 } : undefined} transition={{ duration: 0.9, delay: 0.35, ease: EASE }} />
                    <motion.path d="m9 12 2 2 4-4" initial={reduce ? false : { pathLength: 0 }} animate={shown ? { pathLength: 1 } : undefined} transition={{ duration: 0.5, delay: 1.1, ease: EASE }} />
                  </svg>
                  <div className="absolute inset-0 animate-ping rounded-full border border-gold/40 opacity-20" />
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div variants={item} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Activo Digital</p>
                  <h5 className="text-lg font-medium text-white">Valla en Av. Principal</h5>
                </motion.div>

                <div className="relative space-y-4 pt-4">
                  <motion.div
                    aria-hidden
                    className="absolute left-0 right-0 top-0 h-px origin-left bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={shown ? { scaleX: 1 } : undefined}
                    transition={{ duration: 1, delay: 0.45, ease: EASE }}
                  />

                  <motion.div variants={item} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Precio Base</span>
                    <CountUp to={500} start={shown} delay={0.5} className="font-mono font-medium text-white" />
                  </motion.div>

                  <motion.div variants={item} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-400">Comisión Mercav</span>
                      <motion.span
                        className="mt-1 w-fit rounded border border-gold/10 bg-gold/5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter text-gold"
                        initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -8 }}
                        animate={shown ? { scale: 1, opacity: 1, rotate: 0 } : undefined}
                        transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.95 }}
                      >
                        Primer alquiler • Free
                      </motion.span>
                    </div>
                    <span className="font-mono font-medium text-green-500">$ 0.00</span>
                  </motion.div>

                  <motion.div variants={item} className="flex items-center gap-2 py-4 opacity-30">
                    <div className="h-[2px] flex-1 border-t border-dashed border-gold/30" />
                    <div className="h-2 w-2 rounded-full bg-gold/40" />
                    <div className="h-[2px] flex-1 border-t border-dashed border-gold/30" />
                  </motion.div>

                  <motion.div variants={item} className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Neto Final</p>
                      <span className="text-sm font-bold text-white">Total a recibir</span>
                    </div>
                    <motion.div
                      className="text-right"
                      animate={shown && !reduce ? { textShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 22px rgba(212,175,55,0.55)", "0 0 12px rgba(212,175,55,0.3)"] } : undefined}
                      transition={{ duration: 1.2, delay: 1.5 }}
                    >
                      <CountUp to={500} start={shown} delay={0.8} className="font-mono text-3xl font-black text-gold" />
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              <motion.div variants={item} className="mt-8 flex items-center justify-center gap-2 border-t border-white/5 pt-6">
                <motion.p
                  className="text-[8px] font-black uppercase text-white"
                  initial={reduce ? false : { opacity: 0, letterSpacing: "0.1em" }}
                  animate={shown ? { opacity: 0.35, letterSpacing: "0.4em" } : undefined}
                  transition={{ duration: 1.2, delay: 1.3, ease: EASE }}
                >
                  Verified by Mercav Security
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
