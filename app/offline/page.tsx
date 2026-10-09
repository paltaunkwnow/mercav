import { StatusPage } from "@/components/site/cartel/StatusPage";

export default function Offline() {
  return (
    <StatusPage
      label="Sin conexión"
      pose="durmiendo"
      ink="yellow"
      tilt="2deg"
      title="No hay conexión a internet."
      lead="Algunas funciones no están disponibles mientras tanto. Revisá tu wifi o tus datos móviles y volvé a cargar la página."
      actions={
        // Carga completa del documento (no navegación del cliente) para que el navegador reintente de verdad.
        <a href="/" className="c-btn">
          Reintentar conexión
        </a>
      }
    />
  );
}
// creado por pato dev y askforvini
