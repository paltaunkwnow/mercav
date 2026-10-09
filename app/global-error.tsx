"use client";

import { useEffect } from "react";
import "./cartel.css";
import "./globals.css";
import "./mervi.css";
import { StatusPage } from "@/components/site/cartel/StatusPage";

/**
 * Error del layout raíz: reemplaza todo el documento (sin header ni proveedores), así que trae su propio
 * <html> y sus estilos. Misma página de estado que el resto.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="min-h-dvh bg-[#0b0a09]">
        <StatusPage
          code="500"
          label="Error del servidor"
          pose="sorprendido"
          ink="magenta"
          tilt="2deg"
          title="Algo falló de nuestro lado."
          lead="No es algo que hayas hecho vos. Probá cargar la página de nuevo; si el problema sigue, escribinos a soporte@mercav.lat."
          actions={
            <>
              <button type="button" onClick={() => reset()} className="c-btn">
                Reintentar
              </button>
              {/* Carga completa: el layout raíz falló y la navegación del cliente puede no estar. */}
              <a href="/" className="c-btn c-btn-ghost">
                Ir al inicio
              </a>
            </>
          }
        >
          {error.digest ? (
            <p className="text-[0.9rem] text-[var(--c-muted)]">
              Código para soporte: <span className="c-num font-semibold text-[var(--c-text)]">{error.digest}</span>
            </p>
          ) : null}
        </StatusPage>
      </body>
    </html>
  );
}
// creado por pato dev y askforvini
