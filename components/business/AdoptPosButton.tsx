"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "@/components/icons";

/** Trae la caja personal de antes a la empresa y abre la caja. */
export function AdoptPosButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function adopt() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/pos/adopt`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || "No pudimos traer la caja");
      router.replace(`/business/${slug}/caja`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos traer la caja");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={adopt} disabled={busy} className="mv-btn mv-btn-primary mv-focus">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {busy ? "Trayendo la caja…" : "Traer mi caja"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-400 [.light_&]:text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
