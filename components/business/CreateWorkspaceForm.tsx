"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { DEPARTMENTS } from "@/lib/calendar/sources";
import { LATAM_COUNTRIES } from "@/lib/geo/latam";
import { idLabels, payrollSupported } from "@/lib/business/countries";
import { sendJson } from "@/lib/business/client";
import { Field } from "./ui";

export function CreateWorkspaceForm({ defaultCountry }: { defaultCountry: string }) {
  const router = useRouter();
  const [country, setCountry] = useState(defaultCountry);
  const [productive, setProductive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const labels = idLabels(country);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await sendJson<{ slug: string }>("/api/business/workspaces", "POST", {
      name: form.get("name"),
      legalName: form.get("legalName") || null,
      nit: form.get("nit") || null,
      country,
      region: form.get("region") || null,
      city: form.get("city") || null,
      productive,
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
      <Field label="Nombre de la empresa" htmlFor="ws-name" className="sm:col-span-2">
        <input id="ws-name" name="name" required minLength={2} maxLength={80} className="mv-input h-11" placeholder="Por ejemplo, Panadería del Centro" />
      </Field>
      <Field label="Razón social" htmlFor="ws-legal" hint="Como figura en tus papeles. Va en la planilla.">
        <input id="ws-legal" name="legalName" maxLength={120} className="mv-input h-11" />
      </Field>
      <Field label={country === "BO" ? "NIT" : "Identificación fiscal"} htmlFor="ws-nit">
        <input id="ws-nit" name="nit" maxLength={20} className="mv-input h-11" inputMode="numeric" />
      </Field>
      <Field label="País" htmlFor="ws-country" hint={payrollSupported(country) ? "Incluye planilla automática con la normativa local." : "Podés cargar a tu equipo ya. La planilla automática para este país llega pronto."}>
        <select id="ws-country" value={country} onChange={(e) => setCountry(e.target.value)} className="mv-input h-11">
          {LATAM_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={labels.region} htmlFor="ws-region">
        {country === "BO" ? (
          <select id="ws-region" name="region" defaultValue="" className="mv-input h-11">
            <option value="">Elegí</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        ) : (
          <input id="ws-region" name="region" maxLength={60} className="mv-input h-11" />
        )}
      </Field>
      <Field label="Ciudad" htmlFor="ws-city">
        <input id="ws-city" name="city" maxLength={60} className="mv-input h-11" />
      </Field>
      {country === "BO" ? (
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">¿Qué hace la empresa?</legend>
          <p className="text-xs text-[var(--text-secondary)]">Define la base del bono de antigüedad: 1 salario mínimo en servicios, 3 en empresas productivas.</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {[
              { value: false, title: "Servicios o comercio", desc: "Vende, atiende o presta servicios" },
              { value: true, title: "Productiva", desc: "Fabrica o transforma bienes" },
            ].map((opt) => (
              <label
                key={opt.title}
                className={`mv-focus flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${productive === opt.value ? "border-gold/60 bg-gold/10" : "border-[var(--mv-hairline)] hover:bg-[var(--mv-panel-hover)]"}`}
              >
                <input type="radio" name="productive" checked={productive === opt.value} onChange={() => setProductive(opt.value)} className="mt-1 accent-[var(--color-gold)]" />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">{opt.title}</span>
                  <span className="block text-xs text-[var(--text-secondary)]">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
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
