"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger"
}: ConfirmationModalProps) {
  const colors = {
    danger: "text-red-500 bg-red-500/10 border-red-500/20",
    warning: "text-gold bg-gold/10 border-gold/20",
    info: "text-blue-400 bg-blue-400/10 border-blue-400/20"
  };

  const btnColors = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-gold hover:bg-gold-light text-black font-black",
    info: "bg-blue-500 hover:bg-blue-600 text-white"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-bg-secondary border border-white/10 rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-20 rounded-full ${variant === 'danger' ? 'bg-red-500' : 'bg-gold'}`} />

              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${colors[variant]}`}>
                  <AlertTriangle size={32} />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>

                <div className="flex gap-3 w-full">
                  <Button 
                    variant="ghost" 
                    onClick={onClose}
                    className="flex-1 h-14 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
                  >
                    {cancelText}
                  </Button>
                  <Button 
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] ${btnColors[variant]}`}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
