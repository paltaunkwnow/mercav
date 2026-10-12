"use client";

import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "@/components/icons";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { fieldClass, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { CAPTION_MAX, MAX_PHOTOS, type PhotoDTO } from "@/components/kosher/manage/details";
import { prepareImage } from "@/components/kosher/manage/resizeImage";
import { cn } from "@/lib/utils";

type Synced = { photos: PhotoDTO[]; coverPhotoId: string | null };

const iconButton =
  "mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40";
const overlayChip = "inline-flex h-6 items-center rounded-full bg-black/60 px-2.5 text-xs font-semibold text-white backdrop-blur";

/** multipart: kosherFetch fija Content-Type JSON, acá el navegador pone el boundary. */
async function uploadPhoto(slug: string, blob: Blob, width: number, height: number) {
  const body = new FormData();
  body.append("file", blob, "foto.jpg");
  body.append("width", String(width));
  body.append("height", String(height));
  const res = await fetch(`/api/kosher/places/${slug}/photos`, { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as Partial<Synced> & { success?: boolean; error?: string };
  if (!res.ok || !data.success || !data.photos) throw new Error(data.error || "No pudimos subir la foto. Probá de nuevo.");
  return data as Synced;
}

export function PhotoManager({ slug, placeName, initial, initialCover }: { slug: string; placeName: string; initial: PhotoDTO[]; initialCover: string | null }) {
  const viewer = useKosherViewer();
  const base = useId();
  const input = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const [photos, setPhotos] = useState(initial);
  const [cover, setCover] = useState(initialCover);
  const [progress, setProgress] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const locked = viewer.shabbatLocked;
  const left = MAX_PHOTOS - photos.length;

  const sync = (data: Synced) => {
    setPhotos(data.photos);
    setCover(data.coverPhotoId);
  };

  async function upload(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (input.current) input.current.value = "";
    if (!files.length) return;
    if (files.length > left) toast.error(left === 1 ? "Entra una foto más: subimos la primera." : `Entran ${left} fotos más: subimos las primeras.`);
    const batch = files.slice(0, left);
    let done = 0;
    for (const [i, file] of batch.entries()) {
      const step = batch.length > 1 ? ` ${i + 1} de ${batch.length}` : "";
      try {
        setProgress(`Preparando la foto${step}…`);
        const ready = await prepareImage(file);
        setProgress(`Subiendo la foto${step}…`);
        sync(await uploadPhoto(slug, ready.blob, ready.width, ready.height));
        done++;
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setProgress(null);
    if (done) toast.success(done === 1 ? "Foto subida." : `${done} fotos subidas.`);
  }

  async function patch(id: string, json: Record<string, unknown>) {
    sync(await kosherFetch<Synced>(`/api/kosher/photos/${id}`, { method: "PATCH", json }));
  }

  async function move(id: string, dir: -1 | 1) {
    const from = photos.findIndex((p) => p.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= photos.length) return;
    const before = photos;
    const next = [...photos];
    [next[from], next[to]] = [next[to], next[from]];
    // Se aplica ya y se devuelve el foco al botón: al mover el nodo, el navegador lo pierde.
    flushSync(() => setPhotos(next));
    const keep = document.getElementById(`${base}-${id}-${dir < 0 ? "prev" : "next"}`) as HTMLButtonElement | null;
    const other = document.getElementById(`${base}-${id}-${dir < 0 ? "next" : "prev"}`) as HTMLButtonElement | null;
    (keep && !keep.disabled ? keep : other)?.focus();
    setAnnounce(`Foto movida al lugar ${to + 1} de ${photos.length}.`);
    try {
      await patch(id, { position: to });
    } catch (e) {
      setPhotos(before);
      toast.error((e as Error).message);
    }
  }

  async function run(id: string, action: () => Promise<void>, success: string) {
    setBusy(id);
    try {
      await action();
      toast.success(success);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setConfirming(null);
    await run(
      id,
      async () => {
        sync(await kosherFetch<Synced>(`/api/kosher/photos/${id}`, { method: "DELETE" }));
        uploadButton.current?.focus();
      },
      "Foto borrada.",
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="mv-data font-semibold text-[var(--text-primary)]">{photos.length}</span> de {MAX_PHOTOS} fotos
        </p>
        <button
          ref={uploadButton}
          type="button"
          onClick={() => input.current?.click()}
          disabled={locked || !!progress || left <= 0}
          aria-describedby={`${base}-upload-hint`}
          className={cn(primaryButton, "w-full sm:w-auto")}
        >
          <ImagePlus className="h-4 w-4" aria-hidden /> {left <= 0 ? `Llegaste a ${MAX_PHOTOS} fotos` : "Subir fotos"}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>
      <p id={`${base}-upload-hint`} className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        JPG, PNG o WebP de hasta 10 MB. Las achicamos en tu navegador antes de subirlas. Subí fotos propias del lugar o con permiso de quien las
        sacó: fachada, salón, mostrador, platos.
      </p>
      <p aria-live="polite" className={cn("text-sm font-medium text-[var(--text-primary)]", progress && "mt-4")}>
        {progress}
      </p>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {photos.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-[1.5rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-techelet-dim text-techelet">
            <ImagePlus className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">Todavía no hay fotos. La primera que subas queda de portada.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2" aria-label={`Fotos de ${placeName}`}>
          {photos.map((photo, index) => {
            const isCover = cover === photo.id;
            const working = busy === photo.id;
            return (
              <li key={photo.id} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)]">
                <div className="relative aspect-[4/3] bg-[var(--mv-panel-hover)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || `Foto ${index + 1} de ${placeName}`}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 flex gap-1.5">
                    <span className={cn(overlayChip, "mv-data")}>
                      {index + 1}/{photos.length}
                    </span>
                    {isCover && (
                      <span className={cn(overlayChip, "gap-1")}>
                        <Star className="h-3 w-3" aria-hidden /> Portada
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <CaptionField
                    id={`${base}-${photo.id}-caption`}
                    initial={photo.caption ?? ""}
                    disabled={locked}
                    onSave={(caption) => run(photo.id, () => patch(photo.id, { caption: caption || null }), "Epígrafe guardado.")}
                  />
                  {confirming === photo.id ? (
                    <div role="group" aria-label="Confirmar borrado" className="mt-auto flex flex-wrap items-center gap-2">
                      <p className="mr-auto text-sm font-medium text-[var(--text-primary)]">¿Borrar esta foto?</p>
                      <button type="button" autoFocus onClick={() => setConfirming(null)} className={secondaryButton}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(photo.id)}
                        className={cn(secondaryButton, "!border-red-500/50 text-red-500 [.light_&]:text-red-700")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden /> Borrar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <button
                        id={`${base}-${photo.id}-prev`}
                        type="button"
                        disabled={locked || index === 0}
                        onClick={() => move(photo.id, -1)}
                        aria-label={`Mover antes la foto ${index + 1}`}
                        title="Mover antes"
                        className={iconButton}
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        id={`${base}-${photo.id}-next`}
                        type="button"
                        disabled={locked || index === photos.length - 1}
                        onClick={() => move(photo.id, 1)}
                        aria-label={`Mover después la foto ${index + 1}`}
                        title="Mover después"
                        className={iconButton}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled={locked || working || isCover}
                        aria-pressed={isCover}
                        onClick={() => run(photo.id, () => patch(photo.id, { cover: true }), "Portada actualizada.")}
                        className={cn(secondaryButton, "disabled:!opacity-70")}
                      >
                        <Star className="h-4 w-4" aria-hidden /> {isCover ? "Es la portada" : "Usar de portada"}
                      </button>
                      <button
                        type="button"
                        disabled={locked || working}
                        onClick={() => setConfirming(photo.id)}
                        aria-label={`Borrar la foto ${index + 1}`}
                        className="mv-focus ml-auto inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-red-500 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden /> Borrar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {locked && <p className="mt-4 text-xs text-[var(--text-secondary)]">Modo Shabat activo: vas a poder cambiar las fotos después de Havdalá.</p>}
    </div>
  );
}

/** Se guarda al salir del campo o con Enter, solo si cambió. */
function CaptionField({ id, initial, disabled, onSave }: { id: string; initial: string; disabled?: boolean; onSave: (caption: string) => Promise<boolean> }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  async function commit() {
    const next = value.trim();
    if (next === saved) return;
    if (await onSave(next)) setSaved(next);
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
        Epígrafe <span className="text-[var(--text-tertiary)]">· opcional</span>
      </label>
      <input
        id={id}
        type="text"
        maxLength={CAPTION_MAX}
        disabled={disabled}
        value={value}
        placeholder="Ej.: El salón para eventos"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        className={cn(fieldClass, "h-10 text-sm")}
      />
    </div>
  );
}
// creado por pato dev y askforvini
