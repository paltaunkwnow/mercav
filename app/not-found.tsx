import Link from "next/link";
import { StatusPage } from "@/components/site/cartel/StatusPage";
import { BackButton } from "@/components/site/cartel/BackButton";

const SUGGESTIONS = [
  { href: "/anuncios", label: "Publicidad" },
  { href: "/servicios", label: "Servicios" },
  { href: "/empleos", label: "Empleos" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/preguntas-frecuentes", label: "Ayuda" },
];

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      label="Página no encontrada"
      pose="pensativo"
      ink="yellow"
      title="No encontramos esta página."
      lead="Puede que el enlace esté mal escrito, que la página se haya movido o que ya no exista. Revisá la dirección o seguí desde el inicio."
      actions={
        <>
          <Link href="/" className="c-btn">
            Ir al inicio
          </Link>
          <BackButton />
        </>
      }
    >
      <nav aria-label="Secciones de Mercav" className="mt-4">
        <p className="c-label text-[1rem] text-[var(--c-muted)]">O andá directo a</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="c-label inline-flex min-h-11 items-center rounded-full px-4 text-[1.05rem] text-[var(--c-soft)] shadow-[inset_0_0_0_2px_var(--c-line-strong)] transition-colors hover:text-[var(--c-text)]"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </StatusPage>
  );
}
// creado por pato dev y askforvini
