"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import { ReportModal } from "./ReportModal"

interface ReportButtonProps {
  targetId: string
  targetType: "POST" | "SERVICE" | "SPACE" | "JOB" | "USER"
  variant?: "flag" | "dots" | "button"
}

export function ReportButton({ targetId, targetType, variant = "flag" }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {variant === "flag" && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-yellow-500 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all shadow-md group"
          title="Reportar Contenido"
        >
          <ShieldAlert className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {variant === "button" && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-yellow-500 hover:border-yellow-500/20 hover:bg-yellow-500/5 transition-all"
        >
          <ShieldAlert className="h-4 w-4" /> Reportar
        </button>
      )}

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetId={targetId}
        targetType={targetType}
      />
    </>
  )
}
// creado por pato dev y askforvini
