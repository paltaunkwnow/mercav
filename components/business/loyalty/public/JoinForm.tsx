"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "@/components/icons";
import { sendJson } from "@/lib/business/client";
import type { LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { cn } from "@/lib/utils";
import { REAL_DATA_NOTICE_CUSTOMER } from "@/lib/business/loyalty/notice";
import { MONTHS, daysInMonth, units } from "./format";

type FieldKey = "name" | "phone" | "email" | "birthday";

function Label({ htmlFor, children, optional }: { htmlFor: string; children: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-[var(--text-primary)]">
      {children}
      {optional ? <span className="text-xs font-medium text-[var(--text-tertiary)]">Opcional</span> : null}
    </label>
  );
}

/** Formulario para sumarse al club. Sin cuenta de Mercav: nombre y, si quiere, celular, correo y cumpleaños. */
export function JoinForm({
  slug,
  businessName,
  type,
  birthdayBonus,
  refCode,
  next,
  code,
}: {
  slug: string;
  businessName: string;
  type: LoyaltyTypeKey;
  birthdayBonus: number;
  refCode: string | null;
  next: "sellar" | null;
  code: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: FieldKey | null; message: string } | null>(null);
  const refs = { name: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), birthday: useRef<HTMLSelectElement>(null) };

  const maxDay = month ? daysInMonth(Number(month)) : 31;

  function invalid(field: FieldKey, message: string) {
    setError({ field, message });
    refs[field].current?.focus();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return invalid("name", "Contanos tu nombre.");
    if (phone.trim() && phone.replace(/\D/g, "").length < 7) return invalid("phone", "Revisá el número de celular.");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return invalid("email", "Revisá el correo.");
    if ((day && !month) || (!day && month)) return invalid("birthday", "Elegí el día y el mes de tu cumpleaños.");
    if (day && month && Number(day) > daysInMonth(Number(month))) return invalid("birthday", "Ese día no existe en ese mes.");

    setError(null);
    setBusy(true);
    const birthday = day && month ? `${month.padStart(2, "0")}-${day.padStart(2, "0")}` : null;
    const res = await sendJson<{ url: string }>("/api/loyalty/join", "POST", {
      slug,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      birthday,
      marketingConsent: consent,
      ref: refCode,
    });
    if (!res.ok) {
      setBusy(false);
      const field: FieldKey | null = /celular/i.test(res.error) ? "phone" : /correo/i.test(res.error) ? "email" : /cumple/i.test(res.error) ? "birthday" : /nombre/i.test(res.error) ? "name" : null;
      setError({ field, message: res.error });
      if (field) refs[field].current?.focus();
      return;
    }
    // Si venía del QR del mostrador, sigue directo a sumar su sello.
    router.replace(next === "sellar" && code ? `/c/${slug}/sellar?code=${code}` : res.data.url);
  }

  const errorFor = (field: FieldKey) => (error?.field === field ? error.message : null);
  const describedBy = (field: FieldKey, hint?: boolean) => [hint ? `join-${field}-hint` : null, errorFor(field) ? "join-error" : null].filter(Boolean).join(" ") || undefined;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-name">Nombre y apellido</Label>
        <input
          ref={refs.name}
          id="join-name"
          name="name"
          autoComplete="name"
          enterKeyHint="next"
          maxLength={60}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errorFor("name")}
          aria-describedby={describedBy("name")}
          placeholder="Como figura en tu documento"
          className={cn("mv-input", errorFor("name") && "border-red-500/60")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-phone" optional>
          Celular
        </Label>
        <input
          ref={refs.phone}
          id="join-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!errorFor("phone")}
          aria-describedby={describedBy("phone", true)}
          placeholder="Ej: +591 70000000"
          className={cn("mv-input", errorFor("phone") && "border-red-500/60")}
        />
        <p id="join-phone-hint" className="text-xs leading-snug text-[var(--text-secondary)]">
          Si perdés el link de tu tarjeta, el negocio te encuentra con tu número.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-email" optional>
          Correo
        </Label>
        <input
          ref={refs.email}
          id="join-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errorFor("email")}
          aria-describedby={describedBy("email")}
          placeholder="tu@correo.com"
          className={cn("mv-input", errorFor("email") && "border-red-500/60")}
        />
      </div>

      <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy("birthday", true)}>
        <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2 text-sm font-semibold text-[var(--text-primary)]">
          Cumpleaños
          <span className="text-xs font-medium text-[var(--text-tertiary)]">Opcional</span>
        </legend>
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
          <label htmlFor="join-day" className="sr-only">
            Día
          </label>
          <select
            ref={refs.birthday}
            id="join-day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            aria-invalid={!!errorFor("birthday")}
            className={cn("mv-input pr-3", !day && "text-[var(--text-tertiary)]", errorFor("birthday") && "border-red-500/60")}
          >
            <option value="">Día</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
              <option key={d} value={d} disabled={Number(d) > maxDay}>
                {d}
              </option>
            ))}
          </select>
          <label htmlFor="join-month" className="sr-only">
            Mes
          </label>
          <select
            id="join-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-invalid={!!errorFor("birthday")}
            className={cn("mv-input pr-3", !month && "text-[var(--text-tertiary)]", errorFor("birthday") && "border-red-500/60")}
          >
            <option value="">Mes</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <p id="join-birthday-hint" className="text-xs leading-snug text-[var(--text-secondary)]">
          {birthdayBonus > 0 ? `Te regalamos ${units(type, birthdayBonus)} en tu cumpleaños.` : "Para saludarte en tu día."}
        </p>
      </fieldset>

      <label htmlFor="join-consent" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-3.5">
        <input
          id="join-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mv-focus mt-0.5 h-5 w-5 shrink-0 rounded accent-[var(--color-gold)]"
        />
        <span className="text-sm leading-snug text-[var(--text-primary)]">Quiero recibir promociones de {businessName}</span>
      </label>

      {error ? (
        <p id="join-error" role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
          {error.message}
        </p>
      ) : null}

      <p className="rounded-[1rem] bg-[var(--mv-gold-wash)] px-4 py-3 text-sm leading-snug text-[var(--text-primary)]">
        {REAL_DATA_NOTICE_CUSTOMER.replace("el negocio", businessName)}
      </p>

      <button type="submit" disabled={busy} className="mv-btn mv-btn-primary mv-btn-lg w-full">
        {busy ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
        {busy ? "Creando tu tarjeta…" : next === "sellar" ? "Crear mi tarjeta y sumar el sello" : "Crear mi tarjeta"}
      </button>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        <span>
          Tus datos son solo para tu tarjeta. Podés pedirle a {businessName} que la borre cuando quieras. No necesitás app; si querés, después la guardás en tu cuenta Mercav.
        </span>
      </p>
    </form>
  );
}
// creado por pato dev y askforvini
