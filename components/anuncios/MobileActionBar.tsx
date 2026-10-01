"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile action bar for detail pages (reservar / contratar / postular).
 * Fixed above the floating bottom nav and the safe area; steps aside when the footer
 * comes into view so it never covers its links. Hidden from lg up, where the sidebar takes over.
 */
export function MobileActionBar({ children, label = "Acciones" }: { children: ReactNode; label?: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("[data-site-footer]");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Reserve room so the last content is never under the bar */}
      <div aria-hidden className="h-24 lg:hidden" />
      <div
        role="region"
        aria-label={label}
        className={cn(
          "fixed z-40 transition-[transform,opacity,visibility] duration-200 [transition-timing-function:var(--ease-out)] lg:hidden",
          "left-[max(0.75rem,env(safe-area-inset-left,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))]",
          "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+4.25rem)]",
          hidden ? "invisible translate-y-3 opacity-0" : "visible translate-y-0 opacity-100",
        )}
      >
        <div className="mv-menu mx-auto flex max-w-xl items-center gap-3 rounded-[1.5rem] p-2 pl-4">{children}</div>
      </div>
    </>
  );
}
// creado por pato dev y askforvini
