"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, AlertTriangle } from "@/components/icons"

import { cn } from "@/lib/utils"
import { SlideConfirm } from "@/components/motion/SlideConfirm"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "mv-menu fixed left-[50%] top-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-[1.75rem] p-6 sm:p-8 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-bg-tertiary data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export interface ConfirmModalProps {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({ 
  title, 
  description, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar", 
  onConfirm, 
  onCancel,
  isOpen,
  setIsOpen,
  variant = 'info'
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center mb-6",
            variant === 'danger' ? "bg-red-500/10 text-red-500" : 
            variant === 'warning' ? "bg-yellow-500/10 text-yellow-500" : 
            "bg-gold/10 text-gold"
          )}>
            <AlertTriangle className="h-8 w-8" />
          </div>
          <DialogPrimitive.Title className="mv-h3 mb-2">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mv-body mb-8">
            {description}
          </DialogPrimitive.Description>
          
          <div className="flex w-full flex-col gap-3">
            <SlideConfirm
              label={confirmText}
              onConfirm={() => {
                onConfirm()
                window.setTimeout(() => setIsOpen(false), 480)
              }}
            />
            <button
              onClick={() => {
                onCancel?.()
                setIsOpen(false)
              }}
              className="mv-btn mv-btn-ghost w-full border border-[var(--mv-hairline-strong)]"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
// creado por pato dev y askforvini
