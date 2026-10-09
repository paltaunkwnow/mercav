"use client";

import type { ReactNode } from "react";
import { PosScopeContext, setPosWorkspace, type PosSection } from "@/lib/pos/client";

/**
 * Fija de quién es la caja para las pantallas del POS. La variable del navegador (para posFetch) se asigna durante el
 * render porque los efectos de los hijos corren antes que los del padre; no se borra al desmontar (StrictMode
 * desmonta y vuelve a montar en desarrollo). Cada caja fija la suya.
 */
export function PosWorkspaceScope({ slug, allowed, children }: { slug: string; allowed: PosSection[]; children: ReactNode }) {
  setPosWorkspace(slug);
  return <PosScopeContext.Provider value={{ slug, allowed }}>{children}</PosScopeContext.Provider>;
}

/** La caja personal de antes (/dashboard/pos): sin empresa. */
export function PosPersonalScope({ children }: { children: ReactNode }) {
  setPosWorkspace(null);
  return <PosScopeContext.Provider value={{ slug: null, allowed: null }}>{children}</PosScopeContext.Provider>;
}
// creado por pato dev y askforvini
