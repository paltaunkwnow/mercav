"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

type City = { id: string; label: string; lon: number; lat: number; hub?: boolean };
type Route = { a: string; b: string };
type Packet = { a: string; b: string; u: number; speed: number };

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
  { a: "lim", b: "scl" },
  { a: "lpz", b: "bue" },
  { a: "scl", b: "bue" },
  { a: "bue", b: "cba" },
  { a: "bue", b: "mvd" },
  { a: "bue", b: "sao" },
  { a: "sao", b: "rio" },
  { a: "sao", b: "bsb" },
  { a: "sao", b: "rec" },
  { a: "sao", b: "asu" },
  { a: "mex", b: "bog" },
  { a: "bog", b: "sao" },
  { a: "mex", b: "sao" },
  { a: "lim", b: "sao" },
];

const COAST: [number, number][] = [
  [-117.0, 32.5], [-106.5, 31.8], [-97.4, 25.9], [-97.2, 21.0], [-90.5, 21.5],
  [-86.8, 21.3], [-88.2, 16.0], [-83.7, 10.0], [-77.3, 8.5], [-71.6, 12.2],
  [-62.0, 10.6], [-51.0, 4.5], [-34.9, -6.8], [-34.9, -8.1], [-38.5, -15.0],
  [-40.3, -22.0], [-43.2, -22.9], [-48.6, -28.0], [-53.2, -34.0], [-54.9, -34.9],
  [-58.4, -38.0], [-62.3, -41.0], [-65.5, -45.0], [-67.2, -54.8], [-68.6, -54.9],
  [-71.3, -51.0], [-75.6, -46.5], [-73.5, -41.5], [-71.6, -33.4], [-71.3, -29.9],
  [-70.4, -18.3], [-76.3, -14.0], [-81.3, -5.2], [-80.0, 0.9], [-77.5, 4.0],
  [-78.8, 8.6], [-83.8, 9.9], [-87.7, 13.4], [-92.2, 14.6], [-96.6, 16.0],
  [-105.2, 20.5], [-109.4, 23.1], [-112.3, 26.8], [-114.8, 31.3], [-117.0, 32.5],
];

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
    const gold = isDark ? ([212, 175, 55] as const) : ([168, 128, 28] as const);
    const goldHi = isDark ? ([232, 204, 106] as const) : ([196, 154, 42] as const);
    const rgba = (c: readonly [number, number, number], a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

    const size = { w: 0, h: 0, dpr: 1 };
    const camera = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.w = window.innerWidth;
      size.h = window.innerHeight;
      size.dpr = dpr;
      canvas.width = Math.floor(size.w * dpr);
      canvas.height = Math.floor(size.h * dpr);
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
    };
    resize();

    const cityById = new Map(CITIES.map((c) => [c.id, c]));
    const packets: Packet[] = ROUTES.slice(0, 8).map((r, i) => ({
      a: r.a,
      b: r.b,
      u: (i * 0.13) % 1,
      speed: 0.00018 + (i % 4) * 0.00004,
    }));

    const onMove = (e: MouseEvent) => {
      camera.tx = (e.clientX / size.w - 0.5) * 22;
      camera.ty = (e.clientY / size.h - 0.5) * 12;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    const geo = (lon: number, lat: number) => {
      const nx = (lon + 118) / 84;
      const ny = (33 - lat) / 89;
      return {
        x: size.w * (0.08 + nx * 0.86) + camera.x,
        y: size.h * (0.24 + ny * 0.68) + camera.y,
      };
    };

    const titleMask = (x: number, y: number) => {
      const dx = (x - size.w * 0.5) / (size.w * 0.32);
      const dy = (y - size.h * 0.4) / (size.h * 0.22);
      const d = dx * dx + dy * dy;
      return Math.min(1, Math.max(0.04, (d - 0.22) / 0.75));
    };

    const arc = (a: { x: number; y: number }, b: { x: number; y: number }, u = 0.5) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const lift = Math.min(90, len * 0.2);
      const cx = (a.x + b.x) / 2 + (-dy / len) * lift;
      const cy = (a.y + b.y) / 2 + (dx / len) * lift;
      const om = 1 - u;
      return {
        x: om * om * a.x + 2 * om * u * cx + u * u * b.x,
        y: om * om * a.y + 2 * om * u * cy + u * u * b.y,
        cx,
        cy,
      };
    };

    const drawWash = () => {
      const g = ctx.createRadialGradient(
        size.w * 0.58 + camera.x * 0.4,
        size.h * 0.55 + camera.y * 0.3,
        0,
        size.w * 0.5,
        size.h * 0.5,
        size.w * 0.55
      );
      g.addColorStop(0, rgba(gold, isDark ? 0.09 : 0.08));
      g.addColorStop(1, rgba(gold, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
    };

    const drawContinent = () => {
      ctx.beginPath();
      COAST.forEach(([lon, lat], i) => {
        const p = geo(lon, lat);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = rgba(gold, isDark ? 0.055 : 0.06);
      ctx.fill();
      ctx.strokeStyle = rgba(gold, isDark ? 0.18 : 0.14);
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawRoutes = () => {
      ROUTES.forEach((r) => {
        const ca = cityById.get(r.a);
        const cb = cityById.get(r.b);
        if (!ca || !cb) return;
        const a = geo(ca.lon, ca.lat);
        const b = geo(cb.lon, cb.lat);
        const m = arc(a, b, 0.5);
        const fade = titleMask((a.x + b.x) / 2, (a.y + b.y) / 2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(m.cx, m.cy, b.x, b.y);
        ctx.strokeStyle = rgba(gold, (ca.hub && cb.hub ? 0.28 : 0.14) * fade);
        ctx.lineWidth = ca.hub && cb.hub ? 1.35 : 0.85;
        ctx.stroke();
      });
    };

    const drawPackets = (moving: boolean) => {
      packets.forEach((pk, i) => {
        if (moving) {
          pk.u += pk.speed * 16;
          if (pk.u >= 1) {
            const next = ROUTES[(i + Math.floor(t / 400)) % ROUTES.length];
            pk.a = next.a;
            pk.b = next.b;
            pk.u = 0;
          }
        }
        const ca = cityById.get(pk.a);
        const cb = cityById.get(pk.b);
        if (!ca || !cb) return;
        const a = geo(ca.lon, ca.lat);
        const b = geo(cb.lon, cb.lat);
        const p = arc(a, b, pk.u);
        const fade = titleMask(p.x, p.y);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
        glow.addColorStop(0, rgba(goldHi, 0.7 * fade));
        glow.addColorStop(1, rgba(gold, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(goldHi, 0.95 * fade);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawCities = (time: number) => {
      CITIES.forEach((city, i) => {
        const p = geo(city.lon, city.lat);
        const fade = titleMask(p.x, p.y);
        const tw = 0.55 + 0.45 * Math.sin(time * 0.0016 + i);
        const r = (city.hub ? 3.2 : 1.8) * (0.85 + tw * 0.2);

        if (city.hub) {
          ctx.strokeStyle = rgba(goldHi, 0.22 * fade * tw);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        g.addColorStop(0, rgba(goldHi, 0.5 * fade));
        g.addColorStop(1, rgba(gold, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(goldHi, (city.hub ? 0.95 : 0.7) * fade);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawCaption = () => {
      if (size.w < 720) return;
      ctx.font = "10px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = rgba(gold, 0.28);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("RED MERCAV  ·  15 PAÍSES", size.w * 0.93, size.h * 0.86);
    };

    const drawVignette = () => {
      const g = ctx.createRadialGradient(
        size.w * 0.5,
        size.h * 0.4,
        size.h * 0.08,
        size.w * 0.5,
        size.h * 0.45,
        size.w * 0.7
      );
      const edge = isDark ? "rgba(5,5,5,0.62)" : "rgba(250,249,246,0.5)";
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.42, "rgba(0,0,0,0)");
      g.addColorStop(1, edge);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
    };

    const frame = (now: number) => {
      if (!reduced) t = now;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);

      if (!reduced) {
        camera.x += (camera.tx - camera.x) * 0.04;
        camera.y += (camera.ty - camera.y) * 0.04;
      }

      drawWash();
      drawContinent();
      drawRoutes();
      drawPackets(!reduced);
      drawCities(t);
      drawCaption();
      drawVignette();

      if (!reduced && !document.hidden) raf = requestAnimationFrame(frame);
    };

    frame(performance.now());

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      motion.removeEventListener("change", onMotion);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      aria-hidden
      style={{ pointerEvents: "none" }}
    />
  );
}
// creado por pato dev y askforvini
