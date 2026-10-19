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

  return <div className="mail-login">
    <section className="mail-login-intro"><MailBrand /><h1>Tu equipo.<br />Tu correo.<br /><span>Todo en su lugar.</span></h1><p>Un espacio de trabajo para conversar, coordinar y seguir construyendo Mercav.</p><div className="mail-private"><ShieldCheck aria-hidden /> Acceso exclusivo del equipo Mercav</div></section>
    <section className="mail-login-card" aria-labelledby="mail-login-title">
      <h2 id="mail-login-title">Entrá a tu correo</h2><p>Usá la cuenta que te asignó el equipo.</p>
      <form onSubmit={login}>
        <label className="mail-field" htmlFor="mail-email">Correo del equipo<input id="mail-email" name="email" type="email" autoComplete="username" placeholder="tu.nombre@mercav.lat" required maxLength={254} className="mail-input" disabled={busy} /></label>
        <label className="mail-field" htmlFor="mail-password">Contraseña<span className="mail-password"><input id="mail-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={512} className="mail-input" disabled={busy} /><button type="button" className="mail-icon-button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</button></span></label>
        {(error || serviceError) && <p className="mail-alert" role="alert">{error || serviceError}</p>}
        <button type="submit" className="mail-button mail-button-primary" style={{ width: "100%" }} disabled={busy}>{busy && <Loader2 className="mail-spin" aria-hidden />}{busy ? "Iniciando sesión…" : "Entrar a Mercav Mail"}</button>
      </form>
      <p className="mail-login-note">¿Necesitás acceso o recuperar tu contraseña?<br />Contactá al administrador de correo de Mercav. Las cuentas se habilitan de forma interna.</p>
    </section>
  </div>;
}
