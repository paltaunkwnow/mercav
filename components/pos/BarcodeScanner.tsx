"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from '@/components/icons';

interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> }

export function canScanWithCamera() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;
}

export default function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  // Safari on iPhone has no BarcodeDetector: fall back to typing the number under the bars.
  const [camera] = useState(() => canScanWithCamera());
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let done = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        const video = videoRef.current;
        if (!video || done) return;
        video.srcObject = stream;
        await video.play();
        const Detector = (window as unknown as { BarcodeDetector: new () => BarcodeDetectorLike }).BarcodeDetector;
        const detector = new Detector();
        timer = setInterval(async () => {
          if (done || video.readyState < 2) return;
          const codes = await detector.detect(video).catch(() => []);
          if (codes[0]?.rawValue && !done) {
            done = true;
            onDetected(codes[0].rawValue);
          }
        }, 250);
      } catch {
        setError('No pudimos abrir la cámara. Revisá los permisos del navegador.');
      }
    })();

    return () => {
      done = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected, camera]);

  // Escape closes the scanner (camera stops through the effect cleanup)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
      <div className="mv-fade absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="mv-pop mv-menu relative w-full max-w-md overflow-hidden rounded-[1.75rem]">
        <div className="flex items-center justify-between gap-3 py-3 pl-5 pr-3">
          <div>
            <p id="scanner-title" className="text-base font-semibold text-[var(--text-primary)]">{camera ? 'Escanear código' : 'Ingresar código'}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {camera ? 'Centrá el código de barras dentro del recuadro.' : 'Este navegador no lee códigos con la cámara. Escribí el número que figura debajo de las barras.'}
            </p>
          </div>
          <button autoFocus={camera} onClick={onClose} aria-label="Cerrar escáner" className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <X size={20} aria-hidden />
          </button>
        </div>
        {camera && (
          <div className="relative aspect-[4/3] bg-[#000]">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-2xl border-2 border-gold/80" aria-hidden />
          </div>
        )}
        {error && <p role="alert" className="px-5 pt-4 text-sm font-medium text-red-400">{error}</p>}
        <form
          className="flex gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const code = manual.trim();
            if (code) onDetected(code);
          }}
        >
          <label htmlFor="manual-code" className="sr-only">Código de barras o SKU</label>
          <input
            id="manual-code"
            autoFocus={!camera}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={camera ? 'O escribí el código' : 'Ej: 7790001234567'}
            className="mv-input mv-data h-12 min-w-0 flex-1 placeholder:font-sans"
          />
          <button type="submit" disabled={!manual.trim()} className="mv-btn mv-btn-primary h-12 shrink-0 px-5">Agregar</button>
        </form>
        {!camera && (
          <p className="px-5 pb-4 text-xs text-[var(--text-secondary)]">También podés conectar un lector USB o Bluetooth: lo que escanee se agrega solo.</p>
        )}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
