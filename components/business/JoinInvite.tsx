"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { sendJson } from "@/lib/business/client";

export function JoinInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function accept() {
    setBusy(true);
    setError(null);
    const res = await sendJson<{ slug: string }>("/api/business/join", "POST", { token });
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    router.push(`/business/${res.data!.slug}`);
    router.refresh();
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <button type="button" onClick={accept} disabled={busy} className={buttonClass("primary", "md")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Aceptar invitación
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
