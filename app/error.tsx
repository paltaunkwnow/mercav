"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "@/components/icons";
import { StatusPage } from "@/components/site/cartel/StatusPage";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      label="Error del servidor"
      pose="sorprendido"
      ink="magenta"
      tilt="2deg"
      title="Algo falló de nuestro lado."
      lead="No es algo que hayas hecho vos. Probá cargar la página de nuevo; si el problema sigue, volvé al inicio o escribinos a soporte."
      actions={
        <>
          <button type="button" onClick={() => reset()} className="c-btn">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reintentar
          </button>
          <Link href="/" className="c-btn c-btn-ghost">
            Ir al inicio
          </Link>
        </>
      }
    >
      {error.digest ? (
        <p className="text-[0.9rem] text-[var(--c-muted)]">
          Si escribís a soporte, incluí este código: <span className="c-num font-semibold text-[var(--c-text)]">{error.digest}</span>
        </p>
      ) : null}
    </StatusPage>
  );
}
// creado por pato dev y askforvini
