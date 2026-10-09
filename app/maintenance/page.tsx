import { StatusPage } from "@/components/site/cartel/StatusPage";

export default function Maintenance() {
  return (
    <StatusPage
      label="Mantenimiento"
      pose="programador"
      ink="green"
      title="Mercav está en mantenimiento."
      lead="Estamos aplicando mejoras en la plataforma. Tus datos y tus operaciones en curso no se ven afectados. Volvé a intentar en unos minutos."
    >
      <p className="text-[0.95rem] text-[var(--c-muted)]">
        ¿Es urgente? Escribinos a{" "}
        <a href="mailto:soporte@mercav.lat" className="c-link font-semibold text-[var(--c-text)]">
          soporte@mercav.lat
        </a>
      </p>
    </StatusPage>
  );
}
// creado por pato dev y askforvini
