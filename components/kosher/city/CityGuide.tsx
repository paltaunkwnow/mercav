import Link from "next/link";
import type { KosherPlaceType } from "@prisma/client";
import { ArrowRight, Flame, MoonStar } from "@/components/icons";
import type { CityGuidePlace } from "@/lib/kosher/cities";
import { PLACE_TYPES, isFoodPlace, priceLabel } from "@/lib/kosher/labels";
import { formatDay, formatTime } from "@/lib/kosher/time";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { OpenLine, type OpenInfo } from "@/components/kosher/city/OpenLine";
import { cn } from "@/lib/utils";

const TYPE_PLURAL: Record<KosherPlaceType, string> = {
  restaurant: "Restaurantes",
  bakery: "Panaderías",
  butcher: "Carnicerías",
  grocery_branch: "Sucursales de supermercado",
  judaica: "Judaica",
  synagogue: "Sinagogas",
  mikvah: "Mikvaot",
  school: "Escuelas",
  hotel: "Hoteles",
  community: "Centros comunitarios",
  museum: "Museos",
};

const typeCount = (type: KosherPlaceType, n: number) => (n === 1 ? PLACE_TYPES[type] : TYPE_PLURAL[type]);

/** Cuántos lugares hay de cada tipo y, entre los de comida, cuántos tienen certificación o supervisión. */
export function CityStats({ places }: { places: CityGuidePlace[] }) {
  const byType = new Map<KosherPlaceType, number>();
  for (const p of places) byType.set(p.type, (byType.get(p.type) ?? 0) + 1);
  const types = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const food = places.filter((p) => isFoodPlace(p.type));
  const certified = food.filter((p) => p.status === "certified").length;
  const supervised = food.filter((p) => p.status === "supervised").length;

  return (
    <section aria-labelledby="k-city-stats" className="mv-panel flex flex-col gap-5 p-5 sm:p-6">
      <h2 id="k-city-stats" className="mv-h3">
        En la guía
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {types.map(([type, n]) => (
          <div key={type} className="flex flex-col-reverse">
            <dt className="text-[0.85rem] leading-snug text-[var(--text-secondary)]">{typeCount(type, n)}</dt>
            <dd className="font-display text-[1.75rem] font-bold tabular-nums leading-tight tracking-[-0.02em]">{n}</dd>
          </div>
        ))}
      </dl>
      {food.length > 0 && (
        <p className="text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          De {food.length} {food.length === 1 ? "lugar para comer o comprar" : "lugares para comer o comprar"},{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {certified} con certificación registrada
          </span>{" "}
          y <span className="font-semibold text-[var(--text-primary)]">{supervised} con supervisión informada</span>.
          {food.length > certified + supervised ? " El resto tiene otro nivel; cada ficha dice cuál." : ""}
        </p>
      )}
    </section>
  );
}

type Shabbat = { candles: string | null; havdalah: string | null; parasha: string | null; parashaHe: string | null; chag: string | null };

/** El próximo Shabat en la hora local de la ciudad. */
export function CityShabbat({ shabbat, city, timezone, calendarHref }: { shabbat: Shabbat; city: string; timezone: string; calendarHref: string }) {
  const rows = [
    { key: "candles", label: "Encendido de velas", icon: Flame, iconClass: "text-gold", at: shabbat.candles },
    { key: "havdalah", label: "Havdalá", icon: MoonStar, iconClass: "text-[var(--k-accent)]", at: shabbat.havdalah },
  ];
  return (
    <section aria-labelledby="k-city-shabbat" className="mv-panel flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h2 id="k-city-shabbat" className="mv-h3">
          Shabat en {city}
        </h2>
        {(shabbat.parasha || shabbat.chag) && (
          <p className="mt-1 text-[0.95rem] text-[var(--text-secondary)]">{[shabbat.parasha, shabbat.chag].filter(Boolean).join(" · ")}</p>
        )}
        {shabbat.parashaHe && (
          <p lang="he" dir="rtl" className="mt-1 text-left font-display text-[1.05rem] text-[var(--k-accent)]">
            {shabbat.parashaHe}
          </p>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {rows.map(({ key, label, icon: Icon, iconClass, at }) => (
          <div key={key} className="rounded-2xl bg-[var(--mv-panel-sunk)] p-4">
            <dt className="flex items-center gap-1.5 text-[0.85rem] text-[var(--text-secondary)]">
              <Icon className={cn("h-4 w-4", iconClass)} aria-hidden /> {label}
            </dt>
            <dd className="mt-1.5 font-display text-[1.6rem] font-bold tabular-nums leading-tight">{at ? formatTime(at, timezone) : "—"}</dd>
            {at && <dd className="text-[0.85rem] text-[var(--text-secondary)]">{formatDay(at, timezone)}</dd>}
          </div>
        ))}
      </dl>
      <p className="text-[0.85rem] leading-relaxed text-[var(--text-tertiary)]">
        Velas 18 minutos antes de la puesta del sol y Havdalá 42 minutos después, en la hora de {city}. Confirmá los zmanim con tu rabino.
      </p>
      <Link href={calendarHref} className="mv-focus mt-auto inline-flex items-center gap-1.5 self-start rounded-md text-[0.9rem] font-semibold text-[var(--k-accent)]">
        Calendario hebreo de {city} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}

/** Tarjeta de un lugar en la guía de la ciudad. `open` llega calculado al momento de mostrar la página. */
export function CityPlaceCard({ place, open }: { place: CityGuidePlace; open: OpenInfo | null }) {
  const price = priceLabel(place.priceLevel);
  return (
    <Link href={`/kosher/lugar/${place.slug}`} className="mv-panel mv-panel-interactive mv-focus flex h-full gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--k-accent)_14%,transparent)] text-[var(--k-accent)]">
        <PlaceIcon type={place.type} className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[1.02rem] font-semibold leading-snug text-[var(--text-primary)]">{place.name}</span>
        <span className="truncate text-[0.85rem] text-[var(--text-secondary)]">
          {PLACE_TYPES[place.type]}
          {price && (
            <>
              <span aria-hidden> · {price}</span>
              <span className="sr-only">, precio {price.length} de 4</span>
            </>
          )}
          {place.address ? ` · ${place.address}` : ""}
        </span>
        {open && <OpenLine info={open} />}
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge status={place.status} type={place.type} verified={place.verified} />
          {place.agencyName && place.status === "certified" && <span className="text-xs text-[var(--text-secondary)]">{place.agencyName}</span>}
        </span>
      </span>
    </Link>
  );
}
// creado por pato dev y askforvini
