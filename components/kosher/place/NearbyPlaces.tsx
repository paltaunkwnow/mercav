import Link from "next/link";
import { formatKm } from "@/lib/kosher/geo";
import { PLACE_TYPES } from "@/lib/kosher/labels";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import type { NearbyPlace } from "@/components/kosher/place/types";
import { placePath } from "@/components/kosher/place/urls";

/** Lugares publicados cerca, con distancia en línea recta y su insignia de estado. */
export function NearbyPlaces({ places }: { places: NearbyPlace[] }) {
  return (
    <ul className="space-y-2">
      {places.map((p) => (
        <li key={p.slug}>
          <Link
            href={placePath(p.slug)}
            className="mv-focus flex items-start gap-3 rounded-2xl border border-[var(--mv-hairline)] px-3.5 py-3 transition-colors hover:border-[var(--color-border-gold)]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
              <PlaceIcon type={p.type} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                <span>
                  {PLACE_TYPES[p.type]} · <span className="mv-data">{formatKm(p.distanceKm)}</span>
                </span>
                <StatusBadge status={p.status} type={p.type} verified={p.verified} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
// creado por pato dev y askforvini
