"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, AlertTriangle, Check, Loader2, X } from "lucide-react"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetId: string
  targetType: "POST" | "SERVICE" | "SPACE" | "JOB" | "USER"
  onSuccess?: () => void
}

const REPORT_REASONS = [
  "Contenido falso o engañoso",
  "Intento de transacción fuera de la plataforma",
  "Spam o publicidad no autorizada",
  "Contenido inapropiado u ofensivo",
  "Fraude o estafa",
  "Información incorrecta",
  "Otro"
]

export function ReportModal({ isOpen, onClose, targetId, targetType, onSuccess }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [otherText, setOtherText] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError("Por favor, selecciona un motivo para el reporte.")
      return
    }

    if (selectedReason === "Otro" && !otherText.trim()) {
      setError("Por favor, describe el motivo detalladamente.")
      return
    }

    setLoading(true)
    setError(null)

    const finalReason = selectedReason === "Otro" ? `Otro: ${otherText.trim()}` : selectedReason

    try {
      const res = await fetch("/api/reports/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId,
          targetType,
          reason: finalReason,
          description: description.trim()
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmitted(true)
        if (onSuccess) onSuccess()
      } else {
        setError(data.error || "Hubo un problema al enviar el reporte. Por favor, intenta de nuevo.")
      }
    } catch (e) {
      setError("Error de conexión. Verifica tu red e intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedReason("")
    setOtherText("")
    setDescription("")
    setError(null)
    setSubmitted(false)
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-[20px]"
            style={{ width: "100vw", height: "100vh" }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-8 md:p-12 w-full max-w-lg shadow-[0_0_150px_rgba(255,215,0,0.08)] overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all z-20"
            >
              <X size={18} />
            </button>

            {/* Glowing Accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold/5 blur-[80px] rounded-full pointer-events-none" />

            {!submitted ? (
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-[0_0_30px_rgba(255,215,0,0.05)]">
                    <ShieldAlert size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Reportar Contenido</h3>
                    <p className="text-xs text-gray-500 tracking-wide uppercase font-mono">
                      Ayúdanos a mantener la comunidad segura
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Reasons selector */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">
                      Motivo del Reporte *
                    </label>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                      {REPORT_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setSelectedReason(reason)
                            setError(null)
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                            selectedReason === reason
                              ? "bg-gold/10 border-gold text-gold"
                              : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <span>{reason}</span>
                          {selectedReason === reason && <Check size={14} className="text-gold" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Free text input if 'Otro' is selected */}
                  <AnimatePresence>
                    {selectedReason === "Otro" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">
                          Especifica el motivo *
                        </label>
                        <input
                          type="text"
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value.slice(0, 100))}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-gold/40 transition-all font-medium"
                          placeholder="Describe brevemente la infracción..."
                          maxLength={100}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Optional Description */}
                  <div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">
                      <span>Descripción Adicional (Opcional)</span>
                      <span className="font-mono">{description.length}/300</span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-gold/40 h-24 resize-none transition-all placeholder:text-gray-700"
                      placeholder="Proporciona detalles adicionales para ayudarnos a entender el problema..."
                      maxLength={300}
                    />
                  </div>

                  {/* Error display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-bold flex items-center gap-3"
                      >
                        <AlertTriangle size={16} className="shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 h-14 rounded-2xl border border-white/10 text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-2 h-14 px-8 rounded-2xl bg-gold text-black font-black uppercase tracking-widest text-[11px] hover:bg-yellow-500 transition-all disabled:opacity-40 shadow-[0_0_30px_rgba(255,215,0,0.1)] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Enviar Reporte"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Success Screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                  <Check size={40} className="animate-bounce" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">¡Reporte Enviado!</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                    Tu reporte fue recibido. Lo revisaremos en las próximas 24 horas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-10 h-14 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                >
                  Entendido
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
