import { Wrench } from "lucide-react";
import { Container } from "@/components/site/primitives";

export default function Maintenance() {
  return (
    <section aria-labelledby="maint-title" className="relative flex min-h-[80svh] w-full items-center overflow-hidden pb-16 pt-28 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <div className="relative w-full">
        <Container width="narrow" className="flex flex-col items-center text-center">
          <span className="mv-panel grid h-14 w-14 place-items-center rounded-2xl text-gold">
            <Wrench className="h-6 w-6" aria-hidden />
          </span>
          <p className="mv-kicker mt-8">Mantenimiento</p>
          <h1 id="maint-title" className="mv-h1 mt-4">
            Mercav está en mantenimiento.
          </h1>
          <p className="mv-lead mx-auto mt-5">
            Estamos aplicando mejoras en la plataforma. Tus datos y tus operaciones en curso no se ven afectados. Volvé a intentar en unos minutos.
          </p>
          <p className="mt-9 text-sm text-[var(--text-tertiary)]">
            ¿Es urgente? Escribinos a{" "}
            <a href="mailto:soporte@mercav.lat" className="mv-link mv-data font-normal">
              soporte@mercav.lat
            </a>
          </p>
        </Container>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
