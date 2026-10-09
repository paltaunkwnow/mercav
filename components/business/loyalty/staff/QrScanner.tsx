"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "@/components/icons";

/*
 * Lector de QR de tarjetas para la caja: cámara trasera + BarcodeDetector (Chrome y Edge en Android,
 * Chrome en escritorio). Donde no existe (Safari en iPhone), queda el campo para escribir el código.
 */

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type DetectorCtor = { new (options?: { formats: string[] }): BarcodeDetectorLike; getSupportedFormats?: () => Promise<string[]> };

export function qrCameraSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;
}

export function QrScanner({ onDetected, onClose }: { onDetected: (raw: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(onDetected);
  detectedRef.current = onDetected;
  const [camera] = useState(() => qrCameraSupported());
  const [status, setStatus] = useState<"starting" | "scanning" | "error">(camera ? "starting" : "error");
  const [error, setError] = useState(camera ? "" : "Este navegador no lee QR con la cámara. Escribí el código que figura debajo del QR.");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let done = false;
    let last = 0;

    (async () => {
      try {
        const Detector = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
        const formats = (await Detector.getSupportedFormats?.().catch(() => [] as string[])) ?? [];
        if (formats.length && !formats.includes("qr_code")) {
          setStatus("error");
          setError("Este navegador no lee QR con la cámara. Escribí el código que figura debajo del QR.");
          return;
        }
        const detector = new Detector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const video = videoRef.current;
        if (done || !video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setStatus("scanning");
        const loop = async (t: number) => {
          if (done) return;
          if (t - last > 160 && video.readyState >= 2) {
            last = t;
            const codes = await detector.detect(video).catch(() => [] as DetectedBarcode[]);
            const value = codes.find((c) => c.rawValue)?.rawValue;
            if (value && !done) {
              done = true;
              detectedRef.current(value);
              return;
            }
          }
          frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
      } catch (err) {
        if (done) return;
        const name = (err as { name?: string })?.name;
        setStatus("error");
        setError(
          name === "NotAllowedError" || name === "SecurityError"
            ? "Permití el uso de la cámara en el navegador para escanear, o escribí el código."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "No encontramos una cámara en este equipo. Escribí el código."
              : "No pudimos abrir la cámara. Escribí el código.",
        );
      }
    })();

    return () => {
      done = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const showVideo = camera && status !== "error";

  return (
    <div
      className="fixed inset-0 z-[600] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      <div className="mv-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="mv-pop mv-menu relative w-full max-w-md overflow-hidden rounded-[1.75rem]">
        <div className="flex items-center justify-between gap-3 py-3 pl-5 pr-3">
          <div className="min-w-0">
            <p id="qr-scanner-title" className="text-base font-semibold text-[var(--text-primary)]">
              {showVideo ? "Escanear tarjeta" : "Código de la tarjeta"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{showVideo ? "Apuntá al QR de la tarjeta del cliente." : error}</p>
          </div>
          <button
            type="button"
            autoFocus={showVideo}
            onClick={onClose}
            aria-label="Cerrar escáner"
            className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        {showVideo ? (
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-[18%]" aria-hidden>
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map(
                (c) => (
                  <span key={c} className={`absolute h-10 w-10 border-gold ${c}`} />
                ),
              )}
            </div>
            {status === "starting" ? (
              <div className="absolute inset-0 grid place-items-center text-white/80">
                <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none" aria-label="Abriendo la cámara" />
              </div>
            ) : null}
          </div>
        ) : null}
        <form
          className="flex gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const value = manual.trim();
            if (value) onDetected(value);
          }}
        >
          <label htmlFor="qr-manual" className="sr-only">
            Código de la tarjeta
          </label>
          <input
            id="qr-manual"
            autoFocus={!showVideo}
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={showVideo ? "O escribí el código" : "ABCD EFGH IJKL MNOP QRST UVWX"}
            className="mv-input mv-data h-12 min-w-0 flex-1 uppercase placeholder:font-sans placeholder:normal-case"
          />
          <button type="submit" disabled={!manual.trim()} className="mv-btn mv-btn-primary h-12 shrink-0 px-5">
            Abrir
          </button>
        </form>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
