"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/site/Reveal";

/** Kept for existing call sites; delegates to the shared CSS reveal. `delay` is in seconds. */
export function KosherReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal className={className} delay={Math.min(300, Math.round(delay * 1000))}>
      {children}
    </Reveal>
  );
}
