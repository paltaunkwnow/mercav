"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Check } from "@/components/icons";

const fieldClass = "mt-2 min-h-12 w-full border-2 border-[var(--c-line)] bg-[var(--c-ground)] px-4 py-3 text-[var(--c-text)] outline-none transition focus:border-[var(--c-yellow)] focus-visible:ring-2 focus-visible:ring-[var(--c-yellow)]";
const services = [
  { value: "Pentesting autorizado", note: "Pruebas ofensivas con permiso y alcance definidos." },
  { value: "Auditoría de seguridad", note: "Revisión de controles, configuraciones y riesgos." },
  { value: "Respuesta a incidentes", note: "Acompañamiento coordinado ante un incidente." },
  { value: "Remediación y retest", note: "Correcciones y verificación de hallazgos." },
  { value: "Otra consulta", note: "Contanos qué necesita tu equipo." },
] as const;

export function CybersecurityContactForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [service, setService] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceOpensAbove, setServiceOpensAbove] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [serviceError, setServiceError] = useState(false);
  const serviceSelectRef = useRef<HTMLDivElement>(null);
  const serviceTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!serviceOpen) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!serviceSelectRef.current?.contains(event.target as Node)) setServiceOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [serviceOpen]);

  function openServices(index = Math.max(0, services.findIndex((item) => item.value === service))) {
    const triggerBounds = serviceTriggerRef.current?.getBoundingClientRect();
    if (triggerBounds) {
      const menuHeight = Math.min(window.innerHeight * 0.48, 20 * 16);
      setServiceOpensAbove(window.innerHeight - triggerBounds.bottom < menuHeight + 12 && triggerBounds.top > menuHeight + 12);
    }
    setActiveService(index);
    setServiceOpen(true);
  }

  function handleServiceKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!serviceOpen) openServices();
      else setActiveService((index) => (index + 1) % services.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!serviceOpen) openServices(services.length - 1);
      else setActiveService((index) => (index - 1 + services.length) % services.length);
    } else if (serviceOpen && event.key === "Home") {
      event.preventDefault();
      setActiveService(0);
    } else if (serviceOpen && event.key === "End") {
      event.preventDefault();
      setActiveService(services.length - 1);
    } else if (serviceOpen && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setService(services[activeService].value);
      setServiceError(false);
      setServiceOpen(false);
    } else if (serviceOpen && event.key === "Escape") {
      event.preventDefault();
      setServiceOpen(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service) {
      setServiceError(true);
      setResult({ ok: false, text: "Elegí el servicio que mejor describe tu consulta." });
      serviceTriggerRef.current?.focus();
      return;
    }
    setBusy(true);
    setResult(null);
    setServiceError(false);
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
      setService("");
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
        <div className="cyber-service-field text-sm font-semibold" ref={serviceSelectRef}>
          <span id="cyber-service-label">Servicio de interés</span>
          <input type="hidden" name="service" value={service} />
          <button
            id="cyber-service"
            ref={serviceTriggerRef}
            type="button"
            role="combobox"
            aria-labelledby="cyber-service-label cyber-service-value"
            aria-haspopup="listbox"
            aria-expanded={serviceOpen}
            aria-controls="cyber-service-options"
            aria-activedescendant={serviceOpen ? `cyber-service-option-${activeService}` : undefined}
            aria-required="true"
            aria-invalid={serviceError}
            aria-describedby={serviceError ? "cyber-service-error" : undefined}
            className="cyber-service-trigger mt-2 w-full"
            onClick={() => serviceOpen ? setServiceOpen(false) : openServices()}
            onKeyDown={handleServiceKeyDown}
            onBlur={() => setServiceOpen(false)}
          >
            <span id="cyber-service-value" className={service ? "cyber-service-value" : "cyber-service-placeholder"}>
              {service || "Seleccioná una opción"}
            </span>
            <svg className={`cyber-service-chevron ${serviceOpen ? "is-open" : ""}`} viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {serviceOpen ? (
            <div id="cyber-service-options" role="listbox" aria-labelledby="cyber-service-label" className={`cyber-service-menu ${serviceOpensAbove ? "is-above" : ""}`}>
              {services.map((option, index) => (
                <div
                  id={`cyber-service-option-${index}`}
                  key={option.value}
                  role="option"
                  aria-selected={service === option.value}
                  className={`cyber-service-option ${activeService === index ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveService(index)}
                  onClick={() => {
                    setService(option.value);
                    setServiceError(false);
                    setServiceOpen(false);
                    serviceTriggerRef.current?.focus();
                  }}
                >
                  <span className="cyber-service-option-copy">
                    <span className="cyber-service-option-title">{option.value}</span>
                    <span className="cyber-service-option-note">{option.note}</span>
                  </span>
                  <svg className="cyber-service-check" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m4.5 10.2 3.5 3.4 7.5-7.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>
          ) : null}
          {serviceError ? <span id="cyber-service-error" className="cyber-service-error">Seleccioná el servicio que necesitás.</span> : null}
        </div>
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
