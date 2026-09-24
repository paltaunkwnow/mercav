"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { focusRing } from "@/components/pwn/format";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div role="status" className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-white">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Cargando datos…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-white/5" />
        <div className="h-24 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-3xl border border-white/10 bg-bg-secondary/80 p-6">
      <h2 className="font-display text-xl text-white">No se pudieron cargar los datos</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{message}</p>
      {onRetry ? (
        <Button type="button" onClick={onRetry} className={`mt-4 rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function DisabledState({
  title = "Función no configurada",
  description = "Mercav Pwn no tiene esta integración activa en este entorno.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div role="status" className="rounded-3xl border border-dashed border-white/15 bg-bg-secondary/50 p-6">
      <h2 className="font-display text-xl text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

export function UnauthorizedState({ callbackPath, description }: { callbackPath: string; description?: string }) {
  const href = `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
  return (
    <div role="status" className="rounded-3xl border border-gold/20 bg-bg-secondary/80 p-6">
      <h2 className="font-display text-xl text-white">Inicia sesión para continuar</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-400">
        {description ?? "Esta sección usa los objetivos y alertas de tu cuenta."}
      </p>
      <Button asChild className={`mt-4 rounded-xl bg-gold font-semibold text-black hover:bg-gold-light ${focusRing}`}>
        <Link href={href}>Iniciar sesión</Link>
      </Button>
    </div>
  );
}
