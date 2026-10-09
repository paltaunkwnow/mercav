"use client"

import { useState, useEffect } from "react"
import { KeyRound, Smartphone, Loader2, CheckCircle2, AlertTriangle } from "@/components/icons"
import { BodyPortal } from "@/components/auth/BodyPortal"

export function TwoFactorSetup({ isEnabledInitial }: { isEnabledInitial: boolean }) {
  const [isEnabled, setIsEnabled] = useState(isEnabledInitial)
  const [setupData, setSetupData] = useState<{ qrCodeUrl: string, secret: string } | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Sync state if initial prop changes (e.g. after profile fetch)
  useEffect(() => {
    setIsEnabled(isEnabledInitial);
  }, [isEnabledInitial]);

  const startSetup = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/2fa/setup")
      const data = await res.json()
      if (res.ok) {
        setSetupData(data)
      } else {
        setError(data.error || "Error al generar el código QR")
      }
    } catch (e) {
      setError("Error conectando con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const verifySetup = async () => {
    if (token.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setIsEnabled(true)
        setSetupData(null)
      } else {
        setError(data.error || "Código inválido")
      }
    } catch (e) {
      setError("Error verificando el código")
    } finally {
      setLoading(false)
    }
  }

  const [showConfirmDisable, setShowConfirmDisable] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [disableCode, setDisableCode] = useState("")

  const disable2FA = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      })
      if (res.ok) {
        setIsEnabled(false)
        setSuccess(false)
        setShowConfirmDisable(false)
        setDisablePassword("")
        setDisableCode("")
      } else {
        const data = await res.json()
        setError(data.error || "Error al desactivar")
      }
    } catch (e) {
      setError("Error conectando con el servidor")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mv-panel p-6 sm:p-8" role="status">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green-500/10 text-green-400">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="mv-h3">Verificación en dos pasos activada</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Desde ahora, al iniciar sesión te vamos a pedir el código de tu app de autenticación.
            </p>
            <button type="button" onClick={() => setSuccess(false)} className="mv-btn mv-btn-secondary mv-btn-sm mt-5">Entendido</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mv-panel p-5 sm:p-7">
      {/* Disable confirmation dialog */}
      {showConfirmDisable && (
        <BodyPortal>
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <div className="mv-fade absolute inset-0 bg-black/50" onClick={() => setShowConfirmDisable(false)} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="disable-2fa-title"
              aria-describedby="disable-2fa-desc"
              onKeyDown={(e) => e.key === "Escape" && setShowConfirmDisable(false)}
              className="mv-pop mv-menu relative w-full max-w-md rounded-[1.75rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-6 w-6" aria-hidden />
              </span>
              <h3 id="disable-2fa-title" className="mv-h3 mt-5">¿Desactivar la verificación en dos pasos?</h3>
              <p id="disable-2fa-desc" className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                Tu cuenta quedará protegida solo con la contraseña. Confirmá con tu contraseña y un código de tu app.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="disable-2fa-password" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Contraseña</label>
                  <input
                    id="disable-2fa-password"
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="mv-input"
                    autoComplete="current-password"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="disable-2fa-code" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Código de 6 dígitos</label>
                  <input
                    id="disable-2fa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="mv-input mv-data tracking-[0.3em]"
                  />
                </div>
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={() => setShowConfirmDisable(false)} className="mv-btn mv-btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={disable2FA}
                  disabled={loading}
                  aria-busy={loading}
                  className="mv-btn flex-1 bg-red-500 text-white hover:bg-red-600"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </BodyPortal>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${isEnabled ? 'bg-green-500/10 text-green-400' : 'bg-[var(--mv-gold-wash)] text-gold'}`}>
            <KeyRound className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="mv-h3">Verificación en dos pasos</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Pedí un código de tu app de autenticación además de la contraseña.</p>
          </div>
        </div>
        <span className={`mv-chip w-fit shrink-0 ${isEnabled ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'mv-chip-gold'}`}>
          {isEnabled ? 'Activa' : 'Recomendada'}
        </span>
      </div>

      {!isEnabled && !setupData && (
        <div className="mt-6 flex flex-col gap-4 rounded-[1.25rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
            Funciona con Google Authenticator, 1Password, Authy u otra app compatible con TOTP.
          </p>
          <button type="button" onClick={startSetup} disabled={loading} aria-busy={loading} className="mv-btn mv-btn-primary mv-btn-sm w-full shrink-0 sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {loading ? "Generando…" : "Configurar"}
          </button>
        </div>
      )}
      {!isEnabled && !setupData && error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}

      {setupData && (
        <ol className="mt-6 grid gap-6 md:grid-cols-2">
          <li className="rounded-[1.25rem] border border-[var(--mv-hairline)] p-5">
            <p className="text-sm font-semibold text-[var(--text-primary)]"><span className="mv-data mr-2 text-gold">1</span>Escaneá el código QR</p>
            <div className="mt-4 w-fit rounded-2xl bg-white p-3">
              <img src={setupData.qrCodeUrl} alt="Código QR para tu app de autenticación" width={160} height={160} className="h-40 w-40" />
            </div>
            <p className="mt-4 text-xs text-[var(--text-secondary)]">¿No podés escanear? Ingresá esta clave a mano:</p>
            <code className="mv-data mt-1 block break-all text-sm text-gold">{setupData.secret}</code>
          </li>
          <li className="flex flex-col rounded-[1.25rem] border border-[var(--mv-hairline)] p-5">
            <label htmlFor="setup-2fa-code" className="text-sm font-semibold text-[var(--text-primary)]"><span className="mv-data mr-2 text-gold">2</span>Ingresá el código de la app</label>
            <input
              id="setup-2fa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              aria-describedby={error ? "setup-2fa-error" : undefined}
              className="mv-input mv-data mt-4 h-14 text-center text-2xl tracking-[0.5em]"
            />
            {error && <p id="setup-2fa-error" role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-auto flex gap-2 pt-5">
              <button type="button" onClick={() => setSetupData(null)} className="mv-btn mv-btn-secondary mv-btn-sm flex-1">Cancelar</button>
              <button type="button" onClick={verifySetup} disabled={loading || token.length !== 6} aria-busy={loading} className="mv-btn mv-btn-primary mv-btn-sm flex-[2]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {loading ? "Verificando…" : "Activar"}
              </button>
            </div>
          </li>
        </ol>
      )}

      {isEnabled && !success && (
        <div className="mt-6 flex flex-col gap-4 rounded-[1.25rem] border border-red-500/20 bg-red-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Desactivar la verificación</p>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Tu cuenta quedará protegida solo con la contraseña.</p>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); setShowConfirmDisable(true); }}
            disabled={loading}
            className="mv-btn mv-btn-sm w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 sm:w-auto"
          >
            Desactivar
          </button>
        </div>
      )}
    </div>
  )
}
// creado por pato dev y askforvini
