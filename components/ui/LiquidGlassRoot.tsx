"use client";

import { useEffect } from "react";

export function LiquidGlassRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    const chromium = /\b(Chrome|Chromium|Edg)\//.test(navigator.userAgent);
    if (!reduce && chromium) root.dataset.liquidRefract = "1";

    return () => {
      delete root.dataset.liquidRefract;
    };
  }, []);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden" focusable="false">
      <defs>
        <filter id="liquid-lens" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feImage href="/images/liquid-lens.png" result="map" preserveAspectRatio="none" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
// creado por Patodev y Invertilo
