"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

/*
 * Hero backdrop: Latin America drawn as a field of gold points, the Mercav network on top,
 * and a slow aurora behind. One canvas, no libraries. Everything that moves is cheap:
 * the dots are placed once per resize and only their brightness changes per frame.
 */

type City = { id: string; label: string; lon: number; lat: number; hub?: boolean };
type Route = { a: string; b: string };
type Packet = { a: string; b: string; u: number; speed: number };
type Dot = { x: number; y: number; base: number; seed: number; lon: number; lat: number };

const CITIES: City[] = [
  { id: "tij", label: "Tijuana", lon: -117.04, lat: 32.51 },
  { id: "mty", label: "Monterrey", lon: -100.32, lat: 25.67 },
  { id: "gdl", label: "Guadalajara", lon: -103.35, lat: 20.66 },
  { id: "mex", label: "Ciudad de México", lon: -99.13, lat: 19.43, hub: true },
  { id: "gua", label: "Guatemala", lon: -90.51, lat: 14.63 },
  { id: "sjo", label: "San José", lon: -84.09, lat: 9.93 },
  { id: "pty", label: "Panamá", lon: -79.52, lat: 8.98 },
  { id: "ccs", label: "Caracas", lon: -66.9, lat: 10.48 },
  { id: "bog", label: "Bogotá", lon: -74.07, lat: 4.71, hub: true },
  { id: "med", label: "Medellín", lon: -75.56, lat: 6.25 },
  { id: "uio", label: "Quito", lon: -78.47, lat: -0.18 },
  { id: "lim", label: "Lima", lon: -77.04, lat: -12.05, hub: true },
  { id: "lpz", label: "La Paz", lon: -68.15, lat: -16.5 },
  { id: "scz", label: "Santa Cruz", lon: -63.18, lat: -17.78, hub: true },
  { id: "rec", label: "Recife", lon: -34.88, lat: -8.05 },
  { id: "bsb", label: "Brasília", lon: -47.88, lat: -15.79 },
  { id: "rio", label: "Rio", lon: -43.17, lat: -22.91 },
  { id: "sao", label: "São Paulo", lon: -46.63, lat: -23.55, hub: true },
  { id: "asu", label: "Asunción", lon: -57.58, lat: -25.26 },
  { id: "scl", label: "Santiago", lon: -70.67, lat: -33.45, hub: true },
  { id: "cba", label: "Córdoba", lon: -64.18, lat: -31.42 },
  { id: "bue", label: "Buenos Aires", lon: -58.38, lat: -34.6, hub: true },
  { id: "mvd", label: "Montevideo", lon: -56.16, lat: -34.9 },
];

const ROUTES: Route[] = [
  { a: "tij", b: "mty" },
  { a: "mty", b: "mex" },
  { a: "gdl", b: "mex" },
  { a: "mex", b: "gua" },
  { a: "gua", b: "sjo" },
  { a: "sjo", b: "pty" },
  { a: "pty", b: "bog" },
  { a: "bog", b: "med" },
  { a: "bog", b: "ccs" },
  { a: "bog", b: "uio" },
  { a: "uio", b: "lim" },
  { a: "lim", b: "lpz" },
  { a: "lpz", b: "scz" },
  { a: "scz", b: "sao" },
  { a: "scz", b: "asu" },
  { a: "lim", b: "scl" },
  { a: "scz", b: "bue" },
  { a: "scl", b: "bue" },
  { a: "bue", b: "cba" },
  { a: "bue", b: "mvd" },
  { a: "bue", b: "sao" },
  { a: "sao", b: "rio" },
  { a: "sao", b: "bsb" },
  { a: "bsb", b: "rec" },
  { a: "asu", b: "sao" },
  { a: "mex", b: "bog" },
  { a: "bog", b: "sao" },
  { a: "mex", b: "sao" },
  { a: "lim", b: "scz" },
];

// Simplified coastline (lon, lat), clockwise from Tijuana. Enough detail for a silhouette, not a map.
const COAST: [number, number][] = [
  [-117.1, 32.5], [-114.7, 32.7], [-111.0, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103.0, 29.0],
  [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.8, 22.3], [-96.1, 19.2], [-94.4, 18.2], [-91.5, 18.8],
  [-90.4, 21.0], [-88.0, 21.5], [-86.8, 21.3], [-87.5, 18.5], [-88.3, 15.7], [-86.5, 15.9], [-84.9, 15.9],
  [-83.4, 15.0], [-83.5, 11.0], [-82.5, 9.5], [-79.9, 9.3], [-77.4, 8.6], [-76.9, 8.0], [-75.5, 10.4],
  [-74.2, 11.3], [-72.2, 11.8], [-71.6, 12.4], [-71.0, 11.5], [-70.0, 11.7], [-68.2, 10.5], [-66.9, 10.6],
  [-64.2, 10.6], [-62.0, 10.7], [-61.0, 9.0], [-60.0, 8.6], [-58.2, 6.8], [-57.0, 6.0], [-55.2, 5.8],
  [-53.5, 5.6], [-52.3, 4.9], [-51.0, 1.5], [-50.0, 0.2], [-48.5, -1.4], [-46.5, -1.0], [-44.3, -2.5],
  [-41.8, -2.9], [-39.5, -3.0], [-38.5, -3.7], [-37.0, -4.8], [-35.2, -5.8], [-34.9, -8.1], [-35.4, -9.6],
  [-37.0, -11.0], [-38.5, -13.0], [-39.0, -15.5], [-39.0, -17.7], [-39.7, -19.0], [-40.3, -20.3], [-41.0, -21.6],
  [-43.2, -22.9], [-45.0, -23.5], [-47.0, -24.6], [-48.6, -26.3], [-48.5, -28.5], [-49.7, -29.4], [-50.5, -30.0],
  [-51.3, -31.3], [-52.0, -32.1], [-53.4, -33.7], [-54.9, -34.9], [-56.0, -34.9], [-57.5, -34.5], [-58.4, -34.6],
  [-57.0, -36.3], [-57.5, -38.1], [-59.0, -38.8], [-62.3, -38.8], [-62.2, -39.8], [-64.0, -40.8], [-65.0, -42.0],
  [-64.3, -42.6], [-65.3, -43.3], [-66.0, -45.0], [-67.5, -46.0], [-65.8, -47.8], [-67.5, -49.0], [-68.5, -50.0],
  [-69.3, -52.0], [-68.4, -53.3], [-68.3, -54.8], [-67.0, -55.0], [-71.0, -55.0], [-73.5, -53.0], [-74.5, -51.5],
  [-75.0, -50.0], [-75.5, -48.5], [-75.5, -47.0], [-74.5, -45.5], [-73.5, -43.0], [-73.8, -41.8], [-73.2, -39.8],
  [-73.4, -38.3], [-73.1, -36.8], [-72.3, -35.3], [-71.6, -33.0], [-71.5, -31.5], [-71.4, -30.0], [-71.2, -28.5],
  [-70.6, -26.3], [-70.5, -25.0], [-70.3, -23.6], [-70.1, -21.5], [-70.2, -20.2], [-70.3, -18.4], [-71.5, -17.0],
  [-73.0, -16.3], [-75.1, -15.4], [-76.2, -13.6], [-76.9, -12.1], [-77.7, -11.0], [-78.7, -9.1], [-79.6, -7.0],
  [-80.6, -5.8], [-81.3, -4.6], [-80.3, -3.4], [-80.9, -2.2], [-80.5, -0.5], [-79.8, 0.6], [-78.9, 1.5],
  [-77.8, 2.6], [-77.5, 4.0], [-77.3, 5.6], [-78.3, 6.5], [-78.5, 8.0], [-79.5, 8.9], [-80.3, 7.3],
  [-81.5, 8.0], [-83.0, 8.4], [-84.8, 9.9], [-85.8, 11.0], [-86.7, 11.9], [-87.5, 12.8], [-88.5, 13.2],
  [-90.0, 13.9], [-92.2, 14.6], [-93.6, 15.6], [-94.5, 16.2], [-96.0, 15.8], [-97.0, 15.9], [-98.6, 16.4],
  [-100.0, 16.8], [-101.5, 17.6], [-102.2, 17.9], [-103.7, 18.5], [-105.2, 20.5], [-105.5, 22.5], [-106.4, 23.2],
  [-107.4, 24.5], [-108.0, 25.5], [-109.5, 27.0], [-110.9, 28.0], [-112.3, 29.3], [-113.0, 31.0], [-114.8, 31.3],
  [-114.3, 30.0], [-114.0, 29.5], [-113.0, 28.0], [-112.3, 27.0], [-111.3, 26.0], [-110.7, 25.0], [-110.3, 24.2],
  [-110.0, 23.3], [-109.9, 22.9], [-110.4, 23.3], [-111.0, 24.0], [-112.1, 25.0], [-112.3, 26.0], [-113.2, 26.8],
  [-114.0, 27.5], [-114.5, 28.0], [-115.0, 29.0], [-115.5, 29.5], [-116.0, 30.3], [-116.3, 30.8], [-116.7, 31.7],
  [-117.1, 32.5],
];

function insidePolygon(lon: number, lat: number) {
  let inside = false;
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
    const [xi, yi] = COAST[i];
    const [xj, yj] = COAST[j];
    const cross = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (cross) inside = !inside;
  }
  return inside;
}

// Map window in lon/lat and where it sits on screen (fractions of the viewport).
const LON0 = -118;
const LON_SPAN = 84;
const LAT0 = 33;
const LAT_SPAN = 89;

export function HeroBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    const onMotion = () => {
      reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    const isDark = theme !== "light";
    const gold = isDark ? ([212, 175, 55] as const) : ([150, 112, 20] as const);
    const goldHi = isDark ? ([236, 210, 120] as const) : ([176, 136, 36] as const);
    const rgba = (c: readonly [number, number, number], a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

    const size = { w: 0, h: 0 };
    const camera = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let t = 0;
    let dots: Dot[] = [];
    let onScreen = true;

    const frameBox = () => {
      const wide = size.w >= 1024;
      return wide
        ? { left: 0.34, span: 0.64, top: 0.06, height: 1.0 }
        : { left: 0.04, span: 0.92, top: 0.3, height: 0.72 };
    };

    // Projection without parallax; the camera offset is added when drawing.
    const project = (lon: number, lat: number) => {
      const f = frameBox();
      return {
        x: size.w * (f.left + ((lon - LON0) / LON_SPAN) * f.span),
        y: size.h * (f.top + ((LAT0 - lat) / LAT_SPAN) * f.height),
      };
    };
    const geo = (lon: number, lat: number) => {
      const p = project(lon, lat);
      return { x: p.x + camera.x, y: p.y + camera.y };
    };

    const cityById = new Map(CITIES.map((c) => [c.id, c]));

    const buildDots = () => {
      const f = frameBox();
      // Spacing scales with the map so density reads the same on every screen.
      const spacing = Math.max(6, Math.min(12, (size.w * f.span) / 110));
      const next: Dot[] = [];
      const a = project(LON0, LAT0);
      const b = project(LON0 + LON_SPAN, LAT0 - LAT_SPAN);
      for (let y = a.y; y <= b.y; y += spacing) {
        for (let x = a.x; x <= b.x; x += spacing) {
          const lon = LON0 + ((x / size.w - f.left) / f.span) * LON_SPAN;
          const lat = LAT0 - ((y / size.h - f.top) / f.height) * LAT_SPAN;
          if (!insidePolygon(lon, lat)) continue;
          // Brighter near cities, darker in the interior.
          let near = 0;
          for (const c of CITIES) {
            const d = Math.hypot(c.lon - lon, (c.lat - lat) * 1.1);
            near = Math.max(near, (c.hub ? 1 : 0.7) * Math.max(0, 1 - d / (c.hub ? 9 : 6)));
          }
          next.push({ x, y, lon, lat, base: 0.24 + near * 0.5, seed: Math.random() * Math.PI * 2 });
        }
      }
      dots = next;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.w = window.innerWidth;
      size.h = window.innerHeight;
      canvas.width = Math.floor(size.w * dpr);
      canvas.height = Math.floor(size.h * dpr);
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDots();
    };
    resize();

    const packets: Packet[] = ROUTES.slice(0, 9).map((r, i) => ({
      a: r.a,
      b: r.b,
      u: (i * 0.11) % 1,
      speed: 0.00016 + (i % 4) * 0.00004,
    }));

    const onMove = (e: MouseEvent) => {
      camera.tx = (e.clientX / size.w - 0.5) * 14;
      camera.ty = (e.clientY / size.h - 0.5) * 8;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    // Everything fades under the headline so the type stays legible.
    const titleMask = (x: number, y: number) => {
      const wide = size.w >= 1024;
      const cx = wide ? 0.27 : 0.5;
      const dx = (x - size.w * cx) / (size.w * (wide ? 0.3 : 0.5));
      const dy = (y - size.h * 0.42) / (size.h * 0.26);
      const d = dx * dx + dy * dy;
      return Math.min(1, Math.max(0.05, (d - 0.25) / 0.8));
    };

    const arc = (a: { x: number; y: number }, b: { x: number; y: number }, u = 0.5) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const lift = Math.min(70, len * 0.16);
      const cx = (a.x + b.x) / 2 + (-dy / len) * lift;
      const cy = (a.y + b.y) / 2 + (dx / len) * lift;
      const om = 1 - u;
      return { x: om * om * a.x + 2 * om * u * cx + u * u * b.x, y: om * om * a.y + 2 * om * u * cy + u * u * b.y, cx, cy };
    };

    // Two slow lights drifting behind the map.
    const drawAurora = (time: number) => {
      const k = reduced ? 0 : time * 0.00008;
      const lights = [
        { x: 0.62 + Math.sin(k) * 0.08, y: 0.42 + Math.cos(k * 0.8) * 0.08, r: 0.55, a: isDark ? 0.14 : 0.1 },
        { x: 0.84 + Math.cos(k * 1.3) * 0.06, y: 0.78 + Math.sin(k * 0.9) * 0.06, r: 0.4, a: isDark ? 0.08 : 0.06 },
      ];
      for (const l of lights) {
        const x = size.w * l.x + camera.x * 0.5;
        const y = size.h * l.y + camera.y * 0.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, size.w * l.r);
        g.addColorStop(0, rgba(gold, l.a));
        g.addColorStop(0.55, rgba(gold, l.a * 0.35));
        g.addColorStop(1, rgba(gold, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size.w, size.h);
      }
    };

    // Dots are batched by brightness so the whole continent costs a handful of fills.
    const drawDots = (time: number) => {
      const buckets = new Array<Path2D>(10);
      for (let i = 0; i < buckets.length; i++) buckets[i] = new Path2D();
      const wave = reduced ? 0 : time * 0.0006;
      const r = Math.max(1, Math.min(1.6, size.w / 1000));
      for (const d of dots) {
        const x = d.x + camera.x;
        const y = d.y + camera.y;
        const shimmer = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(wave + d.seed + d.lon * 0.12 + d.lat * 0.08);
        const a = d.base * (0.7 + 0.3 * shimmer) * titleMask(x, y);
        const b = Math.min(9, Math.floor(a * 10));
        if (b <= 0) continue;
        buckets[b].moveTo(x + r, y);
        buckets[b].arc(x, y, r, 0, Math.PI * 2);
      }
      for (let i = 1; i < buckets.length; i++) {
        ctx.fillStyle = rgba(gold, (i / 10) * (isDark ? 0.9 : 0.75));
        ctx.fill(buckets[i]);
      }
    };

    const drawRoutes = () => {
      for (const route of ROUTES) {
        const ca = cityById.get(route.a);
        const cb = cityById.get(route.b);
        if (!ca || !cb) continue;
        const a = geo(ca.lon, ca.lat);
        const b = geo(cb.lon, cb.lat);
        const m = arc(a, b, 0.5);
        const fade = titleMask((a.x + b.x) / 2, (a.y + b.y) / 2);
        const major = ca.hub && cb.hub;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(m.cx, m.cy, b.x, b.y);
        ctx.strokeStyle = rgba(goldHi, (major ? 0.26 : 0.12) * fade);
        ctx.lineWidth = major ? 1.1 : 0.7;
        ctx.stroke();
      }
    };

    const drawPackets = (moving: boolean) => {
      packets.forEach((pk, i) => {
        if (moving) {
          pk.u += pk.speed * 16;
          if (pk.u >= 1) {
            const next = ROUTES[(i * 3 + Math.floor(t / 700)) % ROUTES.length];
            pk.a = next.a;
            pk.b = next.b;
            pk.u = 0;
          }
        }
        const ca = cityById.get(pk.a);
        const cb = cityById.get(pk.b);
        if (!ca || !cb) return;
        const from = geo(ca.lon, ca.lat);
        const to = geo(cb.lon, cb.lat);
        const p = arc(from, to, pk.u);
        const tail = arc(from, to, Math.max(0, pk.u - 0.08));
        const fade = titleMask(p.x, p.y);
        const grad = ctx.createLinearGradient(tail.x, tail.y, p.x, p.y);
        grad.addColorStop(0, rgba(goldHi, 0));
        grad.addColorStop(1, rgba(goldHi, 0.8 * fade));
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = rgba(goldHi, 0.95 * fade);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawCities = (time: number) => {
      CITIES.forEach((city, i) => {
        const p = geo(city.lon, city.lat);
        const fade = titleMask(p.x, p.y);
        const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(time * 0.0014 + i * 1.7);
        const r = city.hub ? 2.6 : 1.6;
        if (city.hub) {
          ctx.strokeStyle = rgba(goldHi, 0.28 * fade * (1 - pulse));
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 4 + pulse * 9, 0, Math.PI * 2);
          ctx.stroke();
        }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
        g.addColorStop(0, rgba(goldHi, 0.45 * fade));
        g.addColorStop(1, rgba(gold, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(goldHi, (city.hub ? 1 : 0.8) * fade);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawCaption = () => {
      if (size.w < 1024) return;
      ctx.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = rgba(gold, isDark ? 0.4 : 0.5);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("RED MERCAV · LATINOAMÉRICA", size.w * 0.95, size.h * 0.84);
    };

    const drawVignette = () => {
      const g = ctx.createRadialGradient(size.w * 0.55, size.h * 0.45, size.h * 0.1, size.w * 0.55, size.h * 0.5, size.w * 0.72);
      const edge = isDark ? "rgba(5,5,5,0.7)" : "rgba(250,249,246,0.6)";
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.45, "rgba(0,0,0,0)");
      g.addColorStop(1, edge);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
    };

    const frame = (now: number) => {
      if (!reduced) t = now;
      camera.x += (camera.tx - camera.x) * 0.04;
      camera.y += (camera.ty - camera.y) * 0.04;
      ctx.clearRect(0, 0, size.w, size.h);
      drawAurora(t);
      drawDots(t);
      drawRoutes();
      drawPackets(!reduced);
      drawCities(t);
      drawCaption();
      drawVignette();
      if (!reduced && !document.hidden && onScreen) raf = requestAnimationFrame(frame);
    };

    // Stop drawing while the hero is scrolled away or the tab is hidden.
    const io = new IntersectionObserver(([entry]) => {
      const was = onScreen;
      onScreen = entry.isIntersecting;
      if (onScreen && !was && !reduced && !document.hidden) raf = requestAnimationFrame(frame);
      if (!onScreen) cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    frame(performance.now());

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced && onScreen) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      motion.removeEventListener("change", onMotion);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" aria-hidden style={{ pointerEvents: "none" }} />;
}
// creado por pato dev y askforvini
