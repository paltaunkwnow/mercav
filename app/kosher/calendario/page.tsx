import type { Metadata } from "next";
import { Flame, MoonStar, Sparkles, Sunrise } from "lucide-react";
import { getKosherViewer } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { calendarFor, dayZmanim, nextShabbat, type CalendarItem } from "@/lib/kosher/zmanim";
import { dayKey, formatDay, formatTime } from "@/lib/kosher/time";
import { CityPills, EmptyState, PageIntro, Pill, cardClass } from "@/components/kosher/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendario y zmanim" };

const KIND_TONE: Record<CalendarItem["kind"], "gold" | "techelet" | "warn" | "muted"> = {
  candles: "gold",
  havdalah: "techelet",
  parasha: "muted",
  chag: "gold",
  fast: "warn",
  rosh_chodesh: "techelet",
  holiday: "muted",
};

const KIND_LABEL: Record<CalendarItem["kind"], string> = {
  candles: "Velas",
  havdalah: "Havdalá",
  parasha: "Parashá",
  chag: "Iom tov",
  fast: "Ayuno",
  rosh_chodesh: "Rosh Jodesh",
  holiday: "Fecha",
};

export default async function KosherCalendarPage({ searchParams }: { searchParams: { ciudad?: string } }) {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, searchParams.ciudad, viewer);
  if (!city) return <EmptyState>Todavía no hay comunidades cargadas.</EmptyState>;

  const tz = city.timezone;
  const shabbat = nextShabbat(city);
  const today = dayZmanim(city);
  const items = calendarFor(city, 70);
  const todayKey = dayKey(new Date(), tz);
  const days = new Map<string, CalendarItem[]>();
  for (const item of items) days.set(item.day, [...(days.get(item.day) ?? []), item]);
  const chagim = items.filter((i) => i.kind === "chag" || i.kind === "fast");

  return (
    <div>
      <PageIntro eyebrow="Zmanim" title={`Calendario de ${city.city}`}>
        <p>
          Hoy es {today.hebrewDate} ·{" "}
          <bdi lang="he" className="text-techelet">
            {today.hebrewDateHe}
          </bdi>
          . Horarios en la hora local de {city.city}.
        </p>
      </PageIntro>

      <CityPills cities={cities} current={city.slug} basePath="/kosher/calendario" />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="k-shabbat" className={cn(cardClass, "relative overflow-hidden md:p-8")}>
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-[80px]" />
          <p className="relative font-mono text-[11px] uppercase tracking-[0.3em] text-gold">{shabbat.chag ? "Shabat y iom tov" : "Este Shabat"}</p>
          <h2 id="k-shabbat" className="relative mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {shabbat.parasha ?? shabbat.chag ?? "Shabat"}
          </h2>
          {(shabbat.parashaHe ?? shabbat.chagHe) && (
            <p lang="he" dir="rtl" className="relative mt-1 text-left font-display text-lg text-techelet">
              {shabbat.parashaHe ?? shabbat.chagHe}
            </p>
          )}
          {shabbat.parasha && shabbat.chag && <p className="relative mt-1 text-sm text-[var(--text-secondary)]">{shabbat.chag}</p>}
          <dl className="relative mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gold/10 p-4 ring-1 ring-inset ring-gold/25">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-gold">
                <Flame className="h-3.5 w-3.5" aria-hidden /> Encendido de velas
              </dt>
              <dd className="mt-2 font-display text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
                {shabbat.candles ? formatTime(shabbat.candles, tz) : "—"}
              </dd>
              {shabbat.candles && <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatDay(shabbat.candles, tz)}</p>}
            </div>
            <div className="rounded-2xl bg-techelet-dim p-4 ring-1 ring-inset ring-techelet/25">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-techelet">
                <MoonStar className="h-3.5 w-3.5" aria-hidden /> Havdalá
              </dt>
              <dd className="mt-2 font-display text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
                {shabbat.havdalah ? formatTime(shabbat.havdalah, tz) : "—"}
              </dd>
              {shabbat.havdalah && <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatDay(shabbat.havdalah, tz)}</p>}
            </div>
          </dl>
          <p className="relative mt-5 text-xs leading-relaxed text-[var(--text-tertiary)]">
            Velas 18 minutos antes de la puesta del sol y Havdalá 42 minutos después. Cada kehilá tiene su minhag: ante la duda, seguí el horario
            de tu sinagoga.
          </p>
        </section>

        <section aria-labelledby="k-today" className={cn(cardClass, "md:p-8")}>
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-techelet">
            <Sunrise className="h-3.5 w-3.5" aria-hidden /> Hoy
          </p>
          <h2 id="k-today" className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
            {formatDay(new Date(), tz)}
          </h2>
          <dl className="mt-5 divide-y divide-border">
            {today.rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm text-[var(--text-secondary)]">{r.label}</dt>
                <dd className="font-mono text-sm tabular-nums text-[var(--text-primary)]">{formatTime(r.time, tz)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {chagim.length > 0 && (
        <section aria-labelledby="k-chagim" className="mt-12">
          <h2 id="k-chagim" className="flex items-center gap-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
            <Sparkles className="h-5 w-5 text-gold" aria-hidden /> Próximos jaguim y ayunos
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chagim.slice(0, 9).map((c) => (
              <li key={`${c.day}-${c.title}`} className="rounded-2xl border border-border bg-bg-secondary px-4 py-3.5">
                <Pill tone={KIND_TONE[c.kind]}>{KIND_LABEL[c.kind]}</Pill>
                <p className="mt-2 font-semibold text-[var(--text-primary)]">{c.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{formatDay(`${c.day}T12:00:00Z`, "UTC")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="k-days" className="mt-12">
        <h2 id="k-days" className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Próximas 10 semanas
        </h2>
        <ol className="mt-5 divide-y divide-border overflow-hidden rounded-[1.75rem] border border-border bg-bg-secondary">
          {[...days.entries()].map(([day, list]) => (
            <li key={day} className={cn("grid gap-2 px-5 py-4 md:grid-cols-[12rem_1fr] md:gap-6", day === todayKey && "bg-gold/[0.06]")}>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {formatDay(`${day}T12:00:00Z`, "UTC", { weekday: "short", month: "short" })}
                {day === todayKey && <span className="ml-2 text-xs font-medium text-gold">hoy</span>}
              </p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {list.map((i) => (
                  <li key={`${i.kind}-${i.title}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Pill tone={KIND_TONE[i.kind]}>{KIND_LABEL[i.kind]}</Pill>
                    <span className="text-[var(--text-primary)]">{i.kind === "candles" || i.kind === "havdalah" ? "" : i.title.replace(new RegExp(`^${KIND_LABEL[i.kind]} `), "")}</span>
                    {i.time && <span className="font-mono tabular-nums">{formatTime(i.time, tz)}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Cálculos astronómicos con{" "}
          <a href="https://www.hebcal.com" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-gold">
            Hebcal
          </a>{" "}
          para la diáspora. Zmanim según el Gra; tzet hakojavim a 8,5°.
        </p>
      </section>
    </div>
  );
}
