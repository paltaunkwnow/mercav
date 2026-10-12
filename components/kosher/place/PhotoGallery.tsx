"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "@/components/icons";
import type { PlacePhoto } from "@/components/kosher/place/types";
import { photoUrl } from "@/components/kosher/place/urls";
import { cn } from "@/lib/utils";

/** Una panorámica o un retrato extremo no deforman la tira: se recortan dentro de este rango. */
const ratio = (p: PlacePhoto) => Math.min(Math.max(p.width / Math.max(p.height, 1), 0.75), 1.8);

const iconButton =
  "mv-focus grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]";

/** Tira con scroll-snap y una vista ampliada en un <dialog> (foco atrapado, Escape cierra, flechas pasan de foto). */
export function PhotoGallery({ photos, name }: { photos: PlacePhoto[]; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  if (!photos.length) return null;

  const single = photos.length === 1;
  const alt = (p: PlacePhoto, i: number) => (p.caption ? `${name}: ${p.caption}` : `${name}, foto ${i + 1} de ${photos.length}`);
  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length));
  const current = index === null ? null : photos[index];

  function open(i: number) {
    setIndex(i);
    dialog.current?.showModal();
  }

  return (
    <>
      <ul aria-label={`Fotos de ${name}`} className="scrollbar-hide -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 md:-mx-6 md:scroll-px-6 md:px-6">
        {photos.map((p, i) => (
          <li key={p.id} className={cn("shrink-0 snap-start", single && "w-full")}>
            <button type="button" onClick={() => open(i)} className={cn("mv-focus block overflow-hidden rounded-2xl bg-[var(--mv-panel-hover)]", single && "w-full")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(p.id)}
                alt={alt(p, i)}
                width={p.width}
                height={p.height}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className={cn("h-44 object-cover md:h-52", single ? "w-full" : "w-auto")}
                style={single ? undefined : { aspectRatio: ratio(p) }}
              />
              <span className="sr-only">. Ampliar</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={`Fotos de ${name}`}
        onClose={() => setIndex(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (single) return;
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-[var(--color-bg-secondary)] p-0 text-[var(--text-primary)] backdrop:bg-black/80"
      >
        {current && index !== null && (
          <figure className="flex flex-col">
            <div className="grid place-items-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(current.id)}
                alt={alt(current, index)}
                width={current.width}
                height={current.height}
                decoding="async"
                className="max-h-[calc(100dvh-8rem)] w-auto max-w-full object-contain"
              />
            </div>
            <figcaption className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="min-w-0 text-sm text-[var(--text-secondary)]">
                {current.caption && <span className="block truncate text-[var(--text-primary)]">{current.caption}</span>}
                <span className="mv-data text-xs">
                  {index + 1} de {photos.length}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {!single && (
                  <>
                    <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className={iconButton}>
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    </button>
                    <button type="button" onClick={() => step(1)} aria-label="Foto siguiente" className={iconButton}>
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar fotos" className={iconButton}>
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
// creado por pato dev y askforvini
