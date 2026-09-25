"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Lock, Smartphone, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      <div className="p-6 rounded-3xl bg-green-500/10 border border-green-500/20 text-center">
        <div className="h-16 w-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">¡Seguridad Activada!</h3>
        <p className="text-sm text-green-200/70 mb-6">Tu cuenta ahora está protegida.</p>
        <Button onClick={() => setSuccess(false)} variant="outline">Entendido</Button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-bg-secondary p-8 overflow-hidden relative">
      {/* Custom Confirmation Modal */}
      {showConfirmDisable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-secondary border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-3">¿Desactivar 2FA?</h3>
            <p className="text-gray-400 text-center text-sm leading-relaxed mb-4">
              Confirma con tu contraseña y un código de tu app de autenticación.
            </p>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Contraseña"
              className="mb-3 h-11 w-full rounded-xl border border-white/10 bg-[#141416] px-3 text-sm text-white"
              autoComplete="current-password"
            />
            <input
              type="text"
              inputMode="numeric"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Código 2FA"
              className="mb-6 h-11 w-full rounded-xl border border-white/10 bg-[#141416] px-3 text-sm text-white"
            />
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowConfirmDisable(false)} 
                variant="outline" 
                className="flex-1 rounded-xl h-12 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                onClick={disable2FA} 
                className="flex-1 rounded-xl h-12 bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                Desactivar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isEnabled ? 'bg-green-500/10 text-green-500' : 'bg-gold/10 text-gold'}`}>
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Autenticación en Dos Pasos (2FA)</h3>
            <p className="text-sm text-gray-500 mt-1">Protege tu cuenta con Google Authenticator.</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${isEnabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
          {isEnabled ? 'ACTIVO' : 'RECOMENDADO'}
        </div>
      </div>

      {!isEnabled && !setupData && (
        <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex-1">
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              La verificación en dos pasos solicita un código único al iniciar sesión.
            </p>
            <Button onClick={startSetup} disabled={loading} className="bg-gold text-black font-bold rounded-xl h-11 px-6">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Configurar 2FA ahora"}
            </Button>
            {error && <p className="text-red-500 text-xs mt-3 italic">{error}</p>}
          </div>
          <div className="h-32 w-32 bg-bg-tertiary rounded-2xl flex items-center justify-center text-gray-700">
            <Smartphone className="h-16 w-16 opacity-20" />
          </div>
        </div>
      )}

      {setupData && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-sm font-bold text-white">1. Escanea el código QR</p>
              <div className="bg-white p-3 rounded-2xl w-fit">
                <img src={setupData.qrCodeUrl} alt="QR" className="w-40 h-40" />
              </div>
              <p className="text-[10px] text-gray-500">Manual: <code className="text-gold">{setupData.secret}</code></p>
            </div>
            <div className="space-y-6">
              <p className="text-sm font-bold text-white">2. Introduce el código</p>
              <input 
                type="text" maxLength={6} placeholder="000000" value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none"
              />
              <div className="flex gap-3">
                <Button onClick={() => setSetupData(null)} variant="outline" className="flex-1">Cancelar</Button>
                <Button onClick={verifySetup} disabled={loading || token.length !== 6} className="flex-[2] bg-gold text-black font-bold">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Activar"}
                </Button>
              </div>
              {error && <p className="text-red-500 text-xs italic">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {isEnabled && !success && (
        <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Lock className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-bold text-white text-sm">Protección activa</p>
              <p className="text-xs text-gray-500">Tu cuenta está segura.</p>
            </div>
          </div>
          <Button onClick={() => setShowConfirmDisable(true)} disabled={loading} variant="ghost" className="text-red-400 hover:text-red-500 text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Desactivar"}
          </Button>
        </div>
      )}
    </div>
  )
}
// creado por Patodev y Invertilo
