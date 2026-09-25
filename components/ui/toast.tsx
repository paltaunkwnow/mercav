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
          initial={{ opacity: 0, y: -50, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
          role="status"
          className={cn(
            "fixed z-[999999] flex items-center gap-4 lg:gap-6 rounded-2xl lg:rounded-[3rem] border p-4 lg:p-5 lg:pr-8 shadow-[0_40px_100px_rgba(0,0,0,0.9)] backdrop-blur-[40px] no-print transition-all",
            "top-6 left-6 right-6 lg:top-12 lg:right-12 lg:left-auto lg:w-auto lg:min-w-[380px]",
            type === "success" ? "border-green-500/40 bg-[#0A0D0A]/98 text-green-400" :
            type === "error" ? "border-red-500/40 bg-[#0D0A0A]/98 text-red-400" :
            "border-gold/30 bg-[#0D0D0A]/98 text-gold"
          )}
        >
          <div className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] shadow-2xl",
            type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" :
            type === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
            "bg-gold/10 border border-gold/20 text-gold"
          )}>
            {type === "success" && <CheckCircle2 className="h-7 w-7" />}
            {type === "error" && <AlertCircle className="h-7 w-7" />}
            {type === "info" && <Info className="h-7 w-7" />}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Sistema Mercav</p>
            <p className="text-base font-bold tracking-tight text-white leading-tight">{message}</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-2xl p-2.5 bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 opacity-40" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
// creado por Patodev y Invertilo
