'use client';

import { useEffect } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Container, ButtonLink, buttonClass } from '@/components/site/primitives';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section aria-labelledby="err-title" className="relative flex min-h-[80svh] w-full items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container width="narrow" className="relative flex flex-col items-center text-center">
        <span className="mv-panel grid h-14 w-14 place-items-center rounded-2xl text-red-400 light:text-red-600">
          <TriangleAlert className="h-6 w-6" aria-hidden />
        </span>
        <p className="mv-kicker mt-8">Error inesperado</p>
        <h1 id="err-title" className="mv-h1 mt-4">
          Algo falló de nuestro lado.
        </h1>
        <p className="mv-lead mx-auto mt-5">
          No es algo que hayas hecho vos. Probá cargar la página de nuevo; si el problema sigue, volvé al inicio o escribinos a soporte.
        </p>
        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button type="button" onClick={() => reset()} className={buttonClass('primary', 'md', 'w-full sm:w-auto')}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Reintentar
          </button>
          <ButtonLink href="/" tone="secondary" className="w-full sm:w-auto">
            Ir al inicio
          </ButtonLink>
        </div>
        {error.digest ? (
          <p className="mt-10 text-xs text-[var(--text-tertiary)]">
            Si escribís a soporte, incluí este código: <span className="mv-data text-[var(--text-secondary)]">{error.digest}</span>
          </p>
        ) : null}
      </Container>
    </section>
  );
}
// creado por pato dev y askforvini
