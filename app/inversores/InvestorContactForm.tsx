"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "@/components/icons";

/** Campo del formulario sobre la tinta: filete de 2px, esquinas de 2px y foco negro. */
const fieldCls =
  "block w-full rounded-[2px] bg-transparent px-4 py-3 text-[1rem] text-[var(--c-text)] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-shadow duration-150 placeholder:text-[color-mix(in_srgb,var(--c-text)_55%,transparent)] focus:shadow-[inset_0_0_0_2px_var(--c-text)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--c-text)]";
const labelCls = "c-label mb-2 block text-[1.05rem]";

/** Contacto para inversores: manda nombre, correo, empresa y mensaje a /api/contact/investors. */
export function InvestorContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/contact/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSent(true);
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 border-y-2 border-[var(--c-text)] py-10">
        <CheckCircle2 className="h-10 w-10" aria-hidden />
        <h3 className="c-h3">Mensaje enviado</h3>
        <p className="text-[1.0625rem] leading-relaxed text-[var(--c-soft)]">Te vamos a responder a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
      <div>
        <label htmlFor="inv-name" className={labelCls}>
          Nombre completo
        </label>
        <input
          id="inv-name"
          name="name"
          required
          autoComplete="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Tu nombre"
          className={fieldCls}
        />
      </div>
      <div>
        <label htmlFor="inv-email" className={labelCls}>
          Correo electrónico
        </label>
        <input
          id="inv-email"
          name="email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="tu@email.com"
          className={fieldCls}
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="inv-company" className={labelCls}>
          Empresa u organización <span className="text-[0.9rem] font-normal normal-case tracking-normal text-[var(--c-soft)] [font-family:var(--c-font-body)]">(opcional)</span>
        </label>
        <input
          id="inv-company"
          name="company"
          autoComplete="organization"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Nombre de tu empresa"
          className={fieldCls}
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="inv-message" className={labelCls}>
          Mensaje
        </label>
        <textarea
          id="inv-message"
          name="message"
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="¿Por qué te interesa invertir en Mercav?"
          className={`${fieldCls} min-h-40 resize-y`}
        />
      </div>
      <div className="flex flex-col items-start gap-4 pt-1 md:col-span-2">
        <p className="text-[0.875rem] text-[var(--c-soft)]">Todos los campos son obligatorios salvo la empresa.</p>
        <button type="submit" disabled={sending} aria-busy={sending} className="c-btn c-btn-ink w-full disabled:pointer-events-none disabled:opacity-70 sm:w-auto">
          {sending ? (
            "Enviando…"
          ) : (
            <>
              Quiero saber más
              <ArrowRight className="h-5 w-5" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
// creado por pato dev y askforvini
