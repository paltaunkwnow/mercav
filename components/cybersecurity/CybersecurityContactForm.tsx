"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "@/components/icons";

const fieldClass = "mt-2 min-h-12 w-full border-2 border-[var(--c-line)] bg-[var(--c-ground)] px-4 py-3 text-[var(--c-text)] outline-none transition focus:border-[var(--c-yellow)] focus-visible:ring-2 focus-visible:ring-[var(--c-yellow)]";

export function CybersecurityContactForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/contact/cybersecurity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo enviar la consulta. Probá de nuevo más tarde.");
      formElement.reset();
      setResult({ ok: true, text: "Recibimos tu consulta. El equipo de seguridad se pondrá en contacto con vos." });
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "No se pudo enviar la consulta. Probá de nuevo más tarde." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" aria-describedby="cyber-form-privacy">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold" htmlFor="cyber-name">Nombre y apellido
          <input id="cyber-name" name="name" autoComplete="name" required minLength={2} maxLength={100} className={fieldClass} />
        </label>
        <label className="block text-sm font-semibold" htmlFor="cyber-email">Correo de trabajo
          <input id="cyber-email" name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold" htmlFor="cyber-company">Empresa <span className="font-normal text-[var(--c-muted)]">(opcional)</span>
          <input id="cyber-company" name="company" autoComplete="organization" maxLength={160} className={fieldClass} />
        </label>
        <label className="block text-sm font-semibold" htmlFor="cyber-service">Servicio de interés
          <select id="cyber-service" name="service" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Seleccioná una opción</option>
            <option value="Pentesting autorizado">Pentesting autorizado</option>
            <option value="Auditoría de seguridad">Auditoría de seguridad</option>
            <option value="Respuesta a incidentes">Respuesta a incidentes</option>
            <option value="Remediación y retest">Remediación y retest</option>
            <option value="Otra consulta">Otra consulta</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold" htmlFor="cyber-message">¿Qué necesitás evaluar? <span className="font-normal text-[var(--c-muted)]">(descripción general)</span>
        <textarea id="cyber-message" name="message" required minLength={10} maxLength={800} rows={5} placeholder="Por ejemplo: queremos revisar la seguridad de nuestra aplicación antes de lanzarla." className={`${fieldClass} min-h-36 resize-y`} />
      </label>
      <div className="sr-only" aria-hidden="true"><label htmlFor="cyber-website">No completar</label><input id="cyber-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <p id="cyber-form-privacy" className="text-sm leading-relaxed text-[var(--c-muted)]">No incluyas dominios, IP, credenciales, archivos, evidencias ni detalles técnicos de incidentes. Antes de intercambiar ese tipo de información, acordaremos el alcance y un contrato de confidencialidad.</p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="c-btn disabled:cursor-wait disabled:opacity-60">{busy ? "Enviando…" : "Enviar consulta"} {result?.ok ? <Check className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}</button>
        {result ? <p role={result.ok ? "status" : "alert"} className={`text-sm ${result.ok ? "text-[var(--c-green-text)]" : "text-red-400"}`}>{result.text}</p> : null}
      </div>
    </form>
  );
}
