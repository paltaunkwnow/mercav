"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/*
 * Festejo corto cuando entra un sello o puntos: un anillo que se abre, unas chispas doradas y el "+1"
 * que sube. Dura menos de un segundo y no aparece con "reducir movimiento".
 */

const SPARKS = 14;

export function Burst({ burstKey, color = "#d4af37", label }: { burstKey: number; color?: string; label?: string | null }) {
  const reduce = useReducedMotion();
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        // Ángulos parejos con un leve corrimiento por festejo, para que no se vea siempre igual.
        const angle = ((i / SPARKS) * 360 + ((burstKey * 37) % 25)) * (Math.PI / 180);
        const distance = 70 + ((i * 53 + burstKey * 17) % 60);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance * 0.75, size: 5 + ((i * 7) % 5), round: i % 3 !== 0, delay: (i % 4) * 0.02 };
      }),
    [burstKey],
  );

  if (reduce || burstKey === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden>
      <AnimatePresence>
        <motion.span
          key={`ring-${burstKey}`}
          className="absolute h-24 w-24 rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ scale: 0.4, opacity: 0.9 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        />
        {sparks.map((s, i) => (
          <motion.span
            key={`spark-${burstKey}-${i}`}
            className="absolute"
            style={{ width: s.size, height: s.round ? s.size : s.size * 2, borderRadius: s.round ? 999 : 2, backgroundColor: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
            animate={{ x: s.x, y: s.y, opacity: 0, scale: 1, rotate: s.round ? 0 : 140 }}
            transition={{ duration: 0.85, delay: s.delay, ease: [0.23, 1, 0.32, 1] }}
          />
        ))}
        {label ? (
          <motion.span
            key={`label-${burstKey}`}
            className="absolute rounded-full px-4 py-1.5 font-display text-xl font-semibold shadow-lg"
            style={{ backgroundColor: color, color: "#0a0a0a" }}
            initial={{ y: 10, opacity: 0, scale: 0.9 }}
            animate={{ y: [10, -6, -46], opacity: [0, 1, 0], scale: [0.9, 1.05, 1] }}
            transition={{ duration: 1.5, times: [0, 0.25, 1], ease: "easeOut" }}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
// creado por pato dev y askforvini
