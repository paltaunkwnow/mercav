"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark } from "@/components/icons";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";

/** Guardar / Guardado. Sin sesión lleva al login y vuelve a `callbackUrl`. */
export function SaveButton({ slug, initialSaved, callbackUrl, className }: { slug: string; initialSaved: boolean; callbackUrl: string; className?: string }) {
  const viewer = useKosherViewer();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  // La ficha se recarga después de valorar o reportar stock: el estado guardado viene de nuevo del servidor.
  useEffect(() => setSaved(initialSaved), [initialSaved]);

  if (!viewer.signedIn) {
    return (
      <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className={className}>
        <Bookmark className="h-4 w-4" aria-hidden />
        Guardar
      </Link>
    );
  }

  async function toggle() {
    if (busy) return;
    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      await kosherFetch("/api/kosher/favorites", { method: next ? "POST" : "DELETE", json: { slug } });
      toast.success(next ? "Guardado. Lo tenés en Mi perfil." : "Lo sacaste de tus guardados.");
    } catch (err) {
      setSaved(!next);
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={viewer.shabbatLocked}
      aria-busy={busy || undefined}
      title={viewer.shabbatLocked ? "Disponible después de Havdalá" : undefined}
      className={className}
    >
      <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden />
      {saved ? "Guardado" : "Guardar"}
    </button>
  );
}
// creado por pato dev y askforvini
