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
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Reportar contenido"
          title="Reportar contenido"
          className="mv-focus grid h-11 w-11 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] transition-colors hover:border-yellow-500/40 hover:text-yellow-500"
        >
          <ShieldAlert className="h-[18px] w-[18px]" aria-hidden />
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mv-btn mv-btn-ghost mv-btn-sm"
        >
          <ShieldAlert className="h-4 w-4" aria-hidden /> Reportar
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
