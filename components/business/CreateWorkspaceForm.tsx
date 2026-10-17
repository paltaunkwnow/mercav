"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { LATAM_COUNTRIES } from "@/lib/geo/latam";
import { sendJson } from "@/lib/business/client";
import { Field } from "./ui";

export function CreateWorkspaceForm({ defaultCountry }: { defaultCountry: string }) {
  const router = useRouter();
  const [country, setCountry] = useState(defaultCountry);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await sendJson<{ slug: string }>("/api/business/workspaces", "POST", {
      name: form.get("name"),
      country,
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push(`/business/${res.data!.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mv-panel grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
      <p className="sm:col-span-2 text-sm text-[var(--text-secondary)]">Solo necesitamos esto para crear tu espacio. Los datos fiscales, el equipo y la caja se completan cuando los necesites.</p>
      <Field label="Nombre de la empresa" htmlFor="ws-name" className="sm:col-span-2">
        <input id="ws-name" name="name" required minLength={2} maxLength={80} className="mv-input h-11" placeholder="Por ejemplo, Panadería del Centro" />
      </Field>
      <Field label="País" htmlFor="ws-country" hint="Usamos tu país para moneda, impuestos y opciones locales.">
        <select id="ws-country" value={country} onChange={(e) => setCountry(e.target.value)} className="mv-input h-11">
          {LATAM_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-red-500 sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className={buttonClass("primary", "md")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Crear empresa
        </button>
      </div>
    </form>
  );
}
// creado por pato dev y askforvini
