import { LockKeyhole } from "@/components/icons";
import { Container, ButtonLink } from "@/components/site/primitives";

export default function Forbidden() {
  return (
    <section aria-labelledby="forbidden-title" className="relative flex min-h-[80svh] w-full items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <div className="relative w-full">
        <Container width="narrow" className="flex flex-col items-center text-center">
          <span className="mv-panel grid h-14 w-14 place-items-center rounded-2xl text-gold">
            <LockKeyhole className="h-6 w-6" aria-hidden />
          </span>
          <p className="mv-kicker mt-8">
            Error <span className="mv-data">403</span>
          </p>
          <h1 id="forbidden-title" className="mv-h1 mt-4">
            No tenés acceso a esta sección.
          </h1>
          <p className="mv-lead mx-auto mt-5">
            Tu cuenta no tiene los permisos que pide este contenido. Si creés que es un error, revisá con qué cuenta entraste o escribinos a soporte.
          </p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/" className="w-full sm:w-auto">
              Ir al inicio
            </ButtonLink>
            <ButtonLink href="/soporte" tone="ghost" className="w-full sm:w-auto">
              Contactar soporte
            </ButtonLink>
          </div>
        </Container>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
