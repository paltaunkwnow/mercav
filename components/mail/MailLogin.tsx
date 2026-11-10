"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, ShieldCheck } from "@/components/icons";
import { mailRequest } from "./client";

export function MailBrand() {
  return <div className="mail-brand"><span className="mail-brand-mark"><Mail aria-hidden /></span><span>Mercav Mail<small>Correo del equipo</small></span></div>;
}

export function MailLogin({ onLogin, serviceError }: { onLogin: () => Promise<void>; serviceError?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await mailRequest("/login", { method: "POST", body: JSON.stringify({ email: String(form.get("email") ?? "").trim(), password: form.get("password") }) });
      await onLogin();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos iniciar sesión."); }
    finally { setBusy(false); }
  }

  const mascots = [
    { name: "Mervi", image: "/mervi/pentester.png", alt: "Mervi, el gato de Mercav" },
    { name: "Jaider", image: "/team-mascots/jaider-tuxedo.png", alt: "Gato tuxedo de Jaider" },
    { name: "Sebastian", image: "/team-mascots/sebastian-avocado.png", alt: "Mascota palta de Sebastian" },
    { name: "Alejandro", image: "/team-mascots/alejandro-penguin.png", alt: "Pingüino de Alejandro" },
    { name: "Jose", image: "/team-mascots/jose-crow-cro.png", alt: "Cuervo de Jose" },
  ];

  return <main className="mail-login">
    <section className="mail-login-intro" aria-labelledby="mail-welcome-title">
      <MailBrand />
      <div className="mail-login-copy">
        <span className="mail-login-eyebrow"><span aria-hidden /> ESPACIO PRIVADO DEL EQUIPO</span>
        <h1 id="mail-welcome-title">Todo el equipo,<br />en una misma <span>bandeja.</span></h1>
        <p>El correo interno de Mercav: un espacio seguro para conversar, coordinar y seguir construyendo juntos.</p>
        <div className="mail-private"><ShieldCheck aria-hidden /> Acceso exclusivo para cuentas autorizadas</div>
      </div>
      <div className="mail-mascot-stage" aria-label="Mascotas del equipo Mercav">
        <div className="mail-mascot-orbit mail-mascot-orbit-one" aria-hidden />
        <div className="mail-mascot-orbit mail-mascot-orbit-two" aria-hidden />
        <div className="mail-mascot-glow" aria-hidden />
        <div className="mail-mascot-row">
          {mascots.map((mascot, index) => <div className={`mail-mascot mail-mascot-${index + 1}`} key={mascot.name}>
            <img src={mascot.image} alt={mascot.alt} />
            <span>{mascot.name}</span>
          </div>)}
        </div>
        <div className="mail-mascot-caption"><span className="mail-live-dot" aria-hidden /> La banda de Mercav · siempre en equipo</div>
      </div>
    </section>
    <section className="mail-login-card" aria-labelledby="mail-login-title">
      <div className="mail-login-card-mark"><Mail aria-hidden /></div>
      <span className="mail-login-card-kicker">MERCAV MAIL</span>
      <h2 id="mail-login-title">Entrá a tu correo</h2><p>Usá la cuenta que te asignó el equipo.</p>
      <form onSubmit={login}>
        <label className="mail-field" htmlFor="mail-email">Correo del equipo<input id="mail-email" name="email" type="email" autoComplete="username" placeholder="tu.nombre@mercav.lat" required maxLength={254} className="mail-input" disabled={busy} /></label>
        <label className="mail-field" htmlFor="mail-password">Contraseña<span className="mail-password"><input id="mail-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={512} className="mail-input" disabled={busy} /><button type="button" className="mail-icon-button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</button></span></label>
        {(error || serviceError) && <p className="mail-alert" role="alert">{error || serviceError}</p>}
        <button type="submit" className="mail-button mail-button-primary" style={{ width: "100%" }} disabled={busy}>{busy && <Loader2 className="mail-spin" aria-hidden />}{busy ? "Iniciando sesión…" : "Entrar a Mercav Mail"}</button>
      </form>
      <p className="mail-login-note"><ShieldCheck aria-hidden /> ¿Necesitás acceso o recuperar tu contraseña? Contactá al administrador de correo de Mercav. Las cuentas se habilitan de forma interna.</p>
    </section>
  </main>;
}
