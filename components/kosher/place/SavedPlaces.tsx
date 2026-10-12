import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PLACE_TYPES } from "@/lib/kosher/labels";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { placePath } from "@/components/kosher/place/urls";

/** "Guardados" de /kosher/perfil (componente de servidor). */
export async function SavedPlaces({ userId }: { userId: string }) {
  const rows = await prisma.kosherFavorite.findMany({
    where: { userId, place: { published: true } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { place: { select: { slug: true, name: true, type: true, status: true, verifiedAt: true, city: true, country: true } } },
  });

  return (
    <section aria-labelledby="k-saved" className="mv-panel mb-4 p-6 md:p-8">
      <h2 id="k-saved" className="mv-h3">
        Guardados
      </h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Todavía no guardaste lugares. En la ficha de cada lugar tocá Guardar y lo vas a tener acá.{" "}
          <Link href="/kosher/mapa" className="mv-link">
            Abrir el mapa
          </Link>
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--mv-hairline)]">
          {rows.map(({ place: p }) => (
            <li key={p.slug}>
              <Link href={placePath(p.slug)} className="mv-focus -mx-2 flex items-start gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-[var(--mv-panel-hover)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
                  <PlaceIcon type={p.type} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                    <span>
                      {PLACE_TYPES[p.type]} · {p.city}, {p.country}
                    </span>
                    <StatusBadge status={p.status} type={p.type} verified={!!p.verifiedAt} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
// creado por pato dev y askforvini
