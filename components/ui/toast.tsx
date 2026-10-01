"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type: ToastType
  isVisible: boolean
  onClose: () => void
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.16 } }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          role={type === "error" ? "alert" : "status"}
          aria-live={type === "error" ? "assertive" : "polite"}
          className={cn(
            "mv-menu fixed z-[999999] flex items-center gap-3 rounded-[1.25rem] p-3 pr-2 no-print",
            "left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top,0px))] sm:left-auto sm:right-6 sm:top-6 sm:w-[24rem]"
          )}
        >
          <div className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            type === "success" ? "bg-green-500/10 text-green-400" :
            type === "error" ? "bg-red-500/10 text-red-400" :
            "bg-gold/10 text-gold"
          )}>
            {type === "success" && <CheckCircle2 className="h-5 w-5" aria-hidden />}
            {type === "error" && <AlertCircle className="h-5 w-5" aria-hidden />}
            {type === "info" && <Info className="h-5 w-5" aria-hidden />}
          </div>
          <p className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-[var(--text-primary)]">{message}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
// creado por pato dev y askforvini
