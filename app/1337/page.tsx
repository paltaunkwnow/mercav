"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Dossier = {
  ip?: string;
  caseId?: string | null;
  at?: string;
  account?: { name: string | null; email: string | null } | null;
};

function stamp(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function caseCode(id?: string | null, ip?: string) {
  if (id) return `MCV-${id.slice(0, 8).toUpperCase()}`;
  const seed = (ip || "LOCAL").replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "LOCAL";
  return `MCV-${seed.padStart(8, "0")}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-baseline justify-between gap-3 px-3 py-2 md:min-h-11 md:gap-4 md:px-4 md:py-3">
      <dt className="shrink-0 text-[13px] font-medium text-[#C7C7CC]">{label}</dt>
      <dd className="min-w-0 break-words text-right font-mono text-[13px] leading-5 text-[#F5F5F7]">{value}</dd>
    </div>
  );
}

const WAG_START = 6.04;
const WAG_END = 8.8;

function VideoBackdrop() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let raf = 0;
    let seeking = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const wrap = () => {
      if (seeking || video.currentTime < WAG_END) return;
      seeking = true;
      video.currentTime = WAG_START;
    };

    const tick = () => {
      wrap();
      raf = requestAnimationFrame(tick);
    };

    const onSeeked = () => {
      seeking = false;
    };

    const sync = () => {
      cancelAnimationFrame(raf);
      if (motion.matches) {
        video.pause();
        return;
      }
      raf = requestAnimationFrame(tick);
      void video.play().catch(() => undefined);
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", wrap);
    sync();
    motion.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", wrap);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div
      className="relative z-0 mx-[-1rem] aspect-video w-[calc(100%+2rem)] shrink-0 overflow-hidden md:pointer-events-none md:fixed md:inset-0 md:z-0 md:mx-0 md:aspect-auto md:w-full"
      aria-hidden
    >
      <video
        ref={ref}
        className="h-full w-full object-contain object-center motion-reduce:hidden md:object-cover"
        src="/videos/1337.webm"
        muted
        playsInline
        autoPlay
        preload="auto"
      />
      <div className="absolute inset-0 hidden bg-gradient-to-b from-[#0B0B0C]/70 via-[#0B0B0C]/25 to-[#0B0B0C]/80 md:block" />
    </div>
  );
}

function UnusualTrafficNotice() {
  const search = useSearchParams();
  const [file, setFile] = useState<Dossier>({});

  useEffect(() => {
    const reason = search?.get("src") === "proxy" ? "proxy" : "inspect";
    const payload = {
      reason,
      path: document.referrer || "/1337",
      fingerprint: [navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone].join("|").slice(0, 160),
    };
    const apply = (data: Dossier) => setFile((prev) => ({ ...prev, ...data }));
    void fetch("/api/security/unusual")
      .then((res) => res.json())
      .then(apply)
      .catch(() => undefined);
    void fetch("/api/security/unusual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((res) => res.json())
      .then(apply)
      .catch(() => undefined);
  }, [search]);

  const account = file.account?.email || file.account?.name || "Visitante, sin cuenta";

  return (
    <main className="relative isolate flex min-h-dvh flex-col bg-[#0B0B0C] px-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.65rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] font-sans md:px-5 md:pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.85rem))] md:pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))]">
      <header className="relative z-10 w-full max-w-[280px] md:max-w-[320px]">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#2C2C2E]/90 px-3 py-1 text-[12px] font-medium text-[#EBEBF5] backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" aria-hidden />
          Mercav Security
        </p>
        <h1 className="mt-3 font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-[#F5F5F7] md:mt-4 md:text-[34px]">
          Por acá no.
        </h1>
        <p className="mt-1.5 text-[15px] font-normal leading-[1.35] text-[#AEAEB2] md:mt-2 md:text-[17px] md:leading-[1.4]">
          Esta sesión quedó registrada. Cerrar esto no borra el expediente.
        </p>
      </header>

      <VideoBackdrop />

      <section className="relative z-10 ml-auto mt-auto w-[min(100%,16.25rem)]">
        <dl className="overflow-hidden rounded-[14px] bg-[#2C2C2E]/92 backdrop-blur-md" aria-label="Datos del registro">
          <Row label="Caso" value={caseCode(file.caseId, file.ip)} />
          <div className="mx-3 h-px bg-white/10 md:mx-4" />
          <Row label="IP" value={file.ip || "…"} />
          <div className="mx-3 h-px bg-white/10 md:mx-4" />
          <Row label="Cuenta" value={account} />
          <div className="mx-3 h-px bg-white/10 md:mx-4" />
          <Row label="Hora" value={stamp(file.at)} />
        </dl>
        <Link
          href="/"
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-[12px] bg-[#F5F5F7] px-5 text-[17px] font-semibold text-[#1C1C1E] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#C9A227] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0C]"
        >
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}

export default function UnusualTrafficPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#1C1C1E]" />}>
      <UnusualTrafficNotice />
    </Suspense>
  );
}
// creado por pato dev y askforvini
