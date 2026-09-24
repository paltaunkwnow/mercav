"use client";

import { useRef, type ReactNode } from "react";

export function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);

  function paint(x: number, y: number, active: boolean) {
    const node = ref.current;
    if (!node) return;
    const rx = active ? -y * 7 : 0;
    const ry = active ? x * 7 : 0;
    node.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${active ? -12 : 0}px)`;
    if (shade.current) {
      shade.current.style.background = active
        ? `radial-gradient(circle at ${(x + 1) * 50}% ${(y + 1) * 50}%, rgba(0,0,0,0.32), transparent 58%), radial-gradient(circle at ${(-x + 1) * 50}% ${(-y + 1) * 50}%, rgba(212,175,55,0.18), transparent 52%)`
        : "transparent";
    }
  }

  return (
    <div
      ref={ref}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || !ref.current) return;
        ref.current.style.transition = "transform 70ms linear";
        const box = ref.current.getBoundingClientRect();
        paint(
          ((event.clientX - box.left) / box.width) * 2 - 1,
          ((event.clientY - box.top) / box.height) * 2 - 1,
          true,
        );
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transition = "transform 560ms cubic-bezier(0.22, 0.9, 0.28, 1)";
        paint(0, 0, false);
      }}
      className={`relative ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      <div ref={shade} aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" />
    </div>
  );
}
