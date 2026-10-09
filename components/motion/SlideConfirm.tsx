"use client";

import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check } from "@/components/icons";

const GRIP = 48;
const GRIP_GOLD = 64;

export function SlideConfirm({
  label = "Deslizá para confirmar",
  onConfirm,
  disabled,
  variant = "default",
  className = "",
}: {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: "default" | "gold";
  className?: string;
}) {
  const grip = variant === "gold" ? GRIP_GOLD : GRIP;
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const dragging = useRef(false);
  const origin = useRef(0);
  const start = useRef(0);
  const [done, setDone] = useState(false);

  const travel = () => {
    const track = trackRef.current;
    if (!track) return 280;
    const knob = track.querySelector("[data-grip]") as HTMLElement | null;
    const knobWidth = knob?.offsetWidth ?? grip;
    return Math.max(0, track.clientWidth - knobWidth - 8);
  };
  const progress = useTransform(x, (value) => {
    const span = travel();
    return span ? Math.min(1, value / span) : 0;
  });
  const labelOpacity = useTransform(progress, [0, 0.55], [1, 0]);

  function finish() {
    if (done || disabled) return;
    const span = travel();
    setDone(true);
    animate(x, span, { type: "spring", stiffness: 460, damping: 34 });
    onConfirm();
  }

  function release() {
    if (!dragging.current) return;
    dragging.current = false;
    if (x.get() > travel() * 0.82) finish();
    else animate(x, 0, { type: "spring", stiffness: 380, damping: 30 });
  }

  return (
    <div
      ref={trackRef}
      className={`relative w-full overflow-hidden rounded-full ${
        variant === "gold"
          ? "h-16 min-w-[18rem] border-none bg-gradient-to-r from-gold to-yellow-300 shadow-[0_0_40px_rgba(212,175,55,0.28)] md:h-20 sm:min-w-[24rem]"
          : "h-14 border border-white/10 bg-white/[0.06]"
      } ${className}`}
    >
      <motion.span
        style={{ opacity: done ? 0 : labelOpacity }}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
          variant === "gold"
            ? "pl-10 text-xs font-black uppercase tracking-widest text-black md:text-sm"
            : "pl-8 text-sm text-gray-400"
        }`}
      >
        {label}
      </motion.span>
      {done ? (
        <motion.div
          initial={{ width: grip }}
          animate={{ width: "calc(100% - 8px)" }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={`absolute top-1 right-1 flex items-center justify-end rounded-full pr-4 ${
            variant === "gold" ? "h-[calc(100%-8px)] bg-black text-gold" : "h-12 bg-white pr-3.5 text-black"
          }`}
        >
          <Check className="h-5 w-5" />
        </motion.div>
      ) : (
        <motion.button
          type="button"
          disabled={disabled}
          aria-label={label}
          className={`absolute top-1 left-1 flex cursor-grab items-center justify-center rounded-full border-0 active:cursor-grabbing ${
            variant === "gold"
              ? "liquid-glass liquid-glass-clear liquid-glass-lens aspect-square h-[calc(100%-8px)] text-black"
              : "h-12 w-12 bg-white text-black shadow-lg"
          }`}
          data-grip
          style={{ x }}
          onPointerDown={(event) => {
            if (disabled) return;
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            start.current = event.clientX;
            origin.current = x.get();
          }}
          onPointerMove={(event) => {
            if (!dragging.current) return;
            const next = Math.min(travel(), Math.max(0, origin.current + event.clientX - start.current));
            x.set(next);
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={(event) => {
            if (disabled) return;
            const span = travel();
            if (event.key === "ArrowRight") {
              event.preventDefault();
              const next = Math.min(span, x.get() + span * 0.25);
              animate(x, next, { type: "spring", stiffness: 400, damping: 30 });
              if (next > span * 0.82) finish();
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              animate(x, Math.max(0, x.get() - span * 0.25), { type: "spring", stiffness: 400, damping: 30 });
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              finish();
            }
          }}
        >
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
