"use client";

import { useEffect } from "react";

export function LiquidGlassRoot() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chromium = /\b(Chrome|Chromium|Edg)\//.test(navigator.userAgent);
    if (!reduce && !reduceMotion && chromium) root.dataset.liquidRefract = "1";

    return () => {
      delete root.dataset.liquidRefract;
    };
  }, []);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden" focusable="false">
      <defs>
        <filter id="liquid-lens" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feImage href="/images/liquid-lens.png" result="map" preserveAspectRatio="none" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
// creado por pato dev y askforvini
