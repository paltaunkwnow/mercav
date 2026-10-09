import Link from "next/link";
import { StatusPage } from "@/components/site/cartel/StatusPage";

export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      label="Acceso restringido"
      pose="cool"
      ink="orange"
      title="No tenés acceso a esta sección."
      lead="Tu cuenta no tiene los permisos que pide este contenido. Si creés que es un error, revisá con qué cuenta entraste o escribinos a soporte."
      actions={
        <>
          <Link href="/" className="c-btn">
            Ir al inicio
          </Link>
          <Link href="/soporte" className="c-btn c-btn-ghost">
            Contactar soporte
          </Link>
        </>
      }
    />
  );
}
// creado por pato dev y askforvini
