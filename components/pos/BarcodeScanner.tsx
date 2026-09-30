"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> }

export function canScanWithCamera() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;
}

export default function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Escanear código de barras">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <p className="font-bold text-white">Apuntá al código de barras</p>
          <button onClick={onClose} aria-label="Cerrar escáner" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-2xl border-2 border-gold/80 pointer-events-none" />
        </div>
        {error && <p className="p-5 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
