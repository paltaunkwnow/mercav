import { WifiOff } from "lucide-react";
import { Container, buttonClass } from "@/components/site/primitives";

export default function Offline() {
  return (
    <section aria-labelledby="offline-title" className="relative flex min-h-[80svh] w-full items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <div className="relative w-full">
        <Container width="narrow" className="flex flex-col items-center text-center">
          <span className="mv-panel grid h-14 w-14 place-items-center rounded-2xl text-[var(--text-secondary)]">
            <WifiOff className="h-6 w-6" aria-hidden />
          </span>
          <p className="mv-kicker mt-8">Sin conexión</p>
          <h1 id="offline-title" className="mv-h1 mt-4">
            No hay conexión a internet.
          </h1>
          <p className="mv-lead mx-auto mt-5">
            Algunas funciones no están disponibles mientras tanto. Revisá tu wifi o tus datos móviles y volvé a cargar la página.
          </p>
          {/* Full document load (not client navigation) so the browser really retries the network. */}
          <a href="/" className={buttonClass("primary", "md", "mt-9 w-full sm:w-auto")}>
            Reintentar conexión
          </a>
        </Container>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
