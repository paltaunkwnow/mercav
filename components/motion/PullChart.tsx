"use client";

import { useId, useMemo, useRef, useState } from "react";

export function PullChart({
  title,
  caption,
  points,
  formatValue,
  accent = "#D4AF37",
  onRefresh,
}: {
  title: string;
  caption?: string;
  points: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  accent?: string;
  onRefresh?: () => void;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const gradientId = useId().replace(/:/g, "");
  const gesture = useRef<{ x: number; y: number; mode: "none" | "scrub" | "pull" } | null>(null);
  const [index, setIndex] = useState(() => Math.max(0, points.length - 1));
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const safeIndex = Math.min(index, Math.max(0, points.length - 1));

  const geometry = useMemo(() => {
    const width = 640;
    const height = 180;
    if (!points.length) return { line: "", area: "", width, height };
    const max = Math.max(...points.map((point) => point.value), 1);
    const step = points.length === 1 ? 0 : width / (points.length - 1);
    const coords = points.map((point, i) => {
      const x = i * step;
      const y = height - 12 - (point.value / max) * (height - 28);
      return [x, y] as const;
    });
    const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return { line, area: `${line} L${width},${height} L0,${height} Z`, width, height, coords };
  }, [points]);

  const current = points[safeIndex];
  const first = points[0]?.value ?? 0;
  const delta = (current?.value ?? 0) - first;
  const pct = first ? (delta / first) * 100 : 0;
  const format = formatValue ?? ((value: number) => value.toLocaleString("es-BO"));
  const threshold = 72;
  const drawn = (700 * pull) / (700 + pull);

  function indexFromEvent(clientX: number) {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || points.length < 2) return points.length - 1;
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    return Math.round(ratio * (points.length - 1));
  }

  if (!points.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="mt-8 text-sm text-gray-500">Todavía no hay datos para esta gráfica.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          {caption ? <p className="text-xs text-gray-500">{caption}</p> : null}
        </div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{current?.label}</p>
      </div>
      <p className="font-mono text-3xl font-bold tracking-tighter text-white">{format(current?.value ?? 0)}</p>
      <p className={`mt-1 text-xs ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {delta >= 0 ? "+" : ""}
        {format(delta)} · {pct >= 0 ? "+" : ""}
        {pct.toFixed(1)}%
      </p>

      <div
        ref={plotRef}
        className="relative mt-4 h-48 touch-none"
        onPointerDown={(event) => {
          gesture.current = { x: event.clientX, y: event.clientY, mode: "none" };
          event.currentTarget.setPointerCapture(event.pointerId);
          setIndex(indexFromEvent(event.clientX));
        }}
        onPointerMove={(event) => {
          const start = gesture.current;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (start.mode === "none" && Math.hypot(dx, dy) > 6) {
            start.mode = Math.abs(dy) > Math.abs(dx) && dy > 0 ? "pull" : "scrub";
          }
          if (start.mode === "scrub") setIndex(indexFromEvent(event.clientX));
          if (start.mode === "pull") setPull(Math.max(0, dy));
        }}
        onPointerUp={() => {
          if (gesture.current?.mode === "pull" && pull > threshold && onRefresh) {
            setRefreshing(true);
            Promise.resolve(onRefresh()).finally(() => setRefreshing(false));
          }
          gesture.current = null;
          setPull(0);
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setPull(0);
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          style={{ transform: `translateY(${Math.min(drawn, 86)}px)`, opacity: pull > 4 || refreshing ? 1 : 0 }}
        >
          <div className={`flex h-8 items-center gap-1 ${refreshing ? "animate-spin" : ""}`} style={{ animationDuration: "1.1s" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{
                  background: accent,
                  transform: `translateY(${(1 - Math.min(pull / threshold, 1)) * (i - 2) * 8}px)`,
                }}
              />
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="h-full w-full" role="img" aria-label={title}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={geometry.area} fill={`url(#${gradientId})`} />
          <path d={geometry.line} fill="none" stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          {geometry.coords ? (
            <line
              x1={geometry.coords[safeIndex][0]}
              x2={geometry.coords[safeIndex][0]}
              y1="0"
              y2={geometry.height}
              stroke={accent}
              strokeOpacity="0.45"
            />
          ) : null}
        </svg>
        <p className="sr-only">Arrastrá en horizontal para recorrer la serie. Arrastrá hacia abajo para actualizar.</p>
      </div>
    </div>
  );
}
