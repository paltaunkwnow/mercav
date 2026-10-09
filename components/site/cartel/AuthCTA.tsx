"use client";

import { useSession } from "next-auth/react";
import { ArrowRight, LayoutGrid } from "@/components/icons";
import { HostLink } from "@/components/layout/HostContext";
import { APP_HOME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

/**
 * La acción principal del sitio: crear la cuenta, o abrir la app si ya hay sesión.
 * Mismo tamaño en todos los estados, así nada se mueve mientras se lee la sesión.
 * `tone="ink"` es la versión para campos de tinta (botón negro).
 */
export function AuthCTA({
  tone = "yellow",
  size = "lg",
  className,
  secondary = true,
  stack = false,
}: {
  tone?: "yellow" | "ink";
  size?: "md" | "lg";
  className?: string;
  secondary?: boolean;
  /** Siempre en columna (para columnas angostas). */
  stack?: boolean;
}) {
  const { data: session, status } = useSession();
  const signedIn = !!session?.user;
  const btn = cn("c-btn", size === "lg" && "c-btn-lg", tone === "ink" && "c-btn-ink");

  return (
    <div className={cn("flex flex-col gap-4", !stack && "sm:flex-row sm:items-center sm:gap-6", stack && "items-start", className)}>
      {signedIn ? (
        <HostLink href={APP_HOME} className={btn}>
          <LayoutGrid className="h-5 w-5" aria-hidden />
          Abrir la app
        </HostLink>
      ) : (
        <HostLink href="/register" className={cn(btn, status === "loading" && "pointer-events-none")} aria-disabled={status === "loading" || undefined}>
          Creá tu cuenta gratis
          <ArrowRight className="h-5 w-5" aria-hidden />
        </HostLink>
      )}
      {secondary && !signedIn ? (
        <p className="text-[0.95rem] text-[var(--c-soft)]">
          ¿Ya tenés cuenta?{" "}
          <HostLink href="/login" className="c-link font-semibold text-[var(--c-text)]">
            Entrá
          </HostLink>
        </p>
      ) : null}
    </div>
  );
}
// creado por pato dev y askforvini
