import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarPlus, Download, Flame, MoonStar, Sparkles, Sunrise } from "@/components/icons";
import { getKosherViewer } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { calendarFor, dayZmanim, nextShabbat, type CalendarItem } from "@/lib/kosher/zmanim";
import { festivalSlugForDesc } from "@/lib/kosher/festivals";
import { dayKey, formatDay, formatTime } from "@/lib/kosher/time";
import { KOSHER_URL } from "@/lib/seo/site";
import { CityPills, EmptyState, PageIntro, Pill, cardClass, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Calendario hebreo y zmanim",
  description:
    "Horarios de velas y Havdalá, parashá, festividades y ayunos del calendario hebreo para cada comunidad de Latinoamérica. Suscribilo a Google Calendar, Apple u Outlook.",
};

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

/** Enlaces del calendario suscripto de una ciudad (el .ics vive en /api, que responde en todos los dominios). */
function feedLinks(slug: string) {
  const https = `${KOSHER_URL}/api/kosher/calendar/${slug}.ics`;
  const webcal = https.replace(/^https?:/, "webcal:");
  return { https, webcal, google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}` };
}

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
  const feed = feedLinks(city.slug);

  return (
    <div>
      <PageIntro title={`Calendario de ${city.city}`}>
        <p>
          Hoy es {today.hebrewDate} ·{" "}
          <bdi lang="he" className="text-techelet">
            {today.hebrewDateHe}
          </bdi>
          . Horarios en la hora local de {city.city}.
        </p>
      </PageIntro>

      <CityPills cities={cities} current={city.slug} basePath="/kosher/calendario" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="k-shabbat" className={cn(cardClass, "relative overflow-hidden md:p-8")}>
          <h2 id="k-shabbat" className="mv-h2 relative">
            {shabbat.parasha ?? shabbat.chag ?? "Shabat"}
          </h2>
          {(shabbat.parashaHe ?? shabbat.chagHe) && (
            <p lang="he" dir="rtl" className="relative mt-1 text-left font-display text-lg text-techelet">
              {shabbat.parashaHe ?? shabbat.chagHe}
            </p>
          )}
          <p className="relative mt-1 text-sm text-[var(--text-secondary)]">
            {shabbat.parasha && shabbat.chag ? `Este Shabat · ${shabbat.chag}` : shabbat.chag ? "Shabat y iom tov" : "Este Shabat"}
          </p>
          <dl className="relative mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--mv-gold-wash)] p-4 ring-1 ring-inset ring-[var(--color-border-gold)]">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-[var(--mv-gold-ink)]">
                <Flame className="h-3.5 w-3.5" aria-hidden /> Velas
              </dt>
              <dd className="mv-data mt-2 text-2xl text-[var(--text-primary)]">
                {shabbat.candles ? formatTime(shabbat.candles, tz) : "—"}
              </dd>
              {shabbat.candles && <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatDay(shabbat.candles, tz)}</p>}
            </div>
            <div className="rounded-2xl bg-techelet-dim p-4 ring-1 ring-inset ring-techelet/25">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-techelet">
                <MoonStar className="h-3.5 w-3.5" aria-hidden /> Havdalá
              </dt>
              <dd className="mv-data mt-2 text-2xl text-[var(--text-primary)]">
                {shabbat.havdalah ? formatTime(shabbat.havdalah, tz) : "—"}
              </dd>
              {shabbat.havdalah && <p className="mt-1 text-xs text-[var(--text-secondary)]">{formatDay(shabbat.havdalah, tz)}</p>}
            </div>
          </dl>
          <p className="relative mt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
            Velas 18 minutos antes de la puesta del sol y Havdalá 42 minutos después. Cada kehilá tiene su minhag: ante la duda, seguí el horario
            de tu sinagoga.
          </p>
        </section>

        <section aria-labelledby="k-today" className={cn(cardClass, "md:p-8")}>
          <h2 id="k-today" className="mv-h3 flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-techelet" aria-hidden />
            Zmanim de hoy
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatDay(new Date(), tz)}</p>
          <dl className="mt-5 divide-y divide-[var(--mv-hairline)]">
            {today.rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm text-[var(--text-secondary)]">{r.label}</dt>
                <dd className="mv-data text-sm text-[var(--text-primary)]">{formatTime(r.time, tz)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section aria-labelledby="k-subscribe" className={cn(cardClass, "mt-4 md:p-8")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <h2 id="k-subscribe" className="mv-h3 flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-[var(--mv-gold-ink)]" aria-hidden />
              Suscribir a mi calendario
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Las velas, la Havdalá, la parashá y las festividades de {city.city} para los próximos doce meses, en tu Google Calendar, Apple o
              Outlook. Se actualiza solo. Las velas traen un aviso 20 minutos antes en Apple y Outlook; Google Calendar usa tus propias
              notificaciones.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <a href={feed.google} target="_blank" rel="noreferrer" className={primaryButton}>
              Agregar a Google Calendar
            </a>
            <a href={feed.webcal} className={secondaryButton}>
              <CalendarPlus className="h-4 w-4" aria-hidden /> Apple u Outlook
            </a>
            <a href={feed.https} download={`mercav-kosher-${city.slug}.ics`} className={secondaryButton}>
              <Download className="h-4 w-4" aria-hidden /> Descargar .ics
            </a>
          </div>
        </div>
        <div className="mt-6">
          <p id="k-feed-url-label" className="text-xs text-[var(--text-secondary)]">
            Si tu app pide la dirección del calendario, copiá esta:
          </p>
          <p aria-labelledby="k-feed-url-label" className="mv-data mt-2 select-all break-all rounded-xl bg-[var(--mv-panel)] px-3 py-2.5 text-xs text-[var(--text-primary)] ring-1 ring-inset ring-[var(--mv-hairline-strong)]">
            {feed.https}
          </p>
        </div>
      </section>

      {chagim.length > 0 && (
        <section aria-labelledby="k-chagim" className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="k-chagim" className="mv-h3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--mv-gold-ink)]" aria-hidden /> Próximos jaguim y ayunos
            </h2>
            <Link href="/kosher/festividades" className="mv-focus inline-flex h-10 items-center gap-1 rounded-full text-sm font-semibold text-techelet hover:underline">
              Todas las festividades <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chagim.slice(0, 9).map((c) => {
              const slug = festivalSlugForDesc(c.desc);
              const body = (
                <>
                  <Pill tone={KIND_TONE[c.kind]}>{KIND_LABEL[c.kind]}</Pill>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{c.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{formatDay(`${c.day}T12:00:00Z`, "UTC")}</p>
                </>
              );
              return (
                <li key={`${c.day}-${c.title}`}>
                  {slug ? (
                    <Link href={`/kosher/festividades/${slug}`} className="mv-panel mv-panel-interactive mv-focus block h-full px-4 py-4">
                      {body}
                    </Link>
                  ) : (
                    <div className="mv-panel h-full px-4 py-4">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="k-days" className="mt-16">
        <h2 id="k-days" className="mv-h3">
          Próximas 10 semanas
        </h2>
        <ol className="mv-panel mt-5 divide-y divide-[var(--mv-hairline)] overflow-hidden">
          {[...days.entries()].map(([day, list]) => (
            <li key={day} aria-current={day === todayKey ? "date" : undefined} className={cn("grid gap-2 px-5 py-4 md:grid-cols-[12rem_1fr] md:gap-6", day === todayKey && "bg-[var(--mv-gold-wash)]")}>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {formatDay(`${day}T12:00:00Z`, "UTC", { weekday: "short", month: "short" })}
                {day === todayKey && <span className="mv-chip mv-chip-gold ml-2 h-6">hoy</span>}
              </p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {list.map((i) => {
                  const label = i.kind === "candles" || i.kind === "havdalah" ? "" : i.title.replace(new RegExp(`^${KIND_LABEL[i.kind]} `), "");
                  const slug = festivalSlugForDesc(i.desc);
                  return (
                    <li key={`${i.kind}-${i.title}`} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Pill tone={KIND_TONE[i.kind]}>{KIND_LABEL[i.kind]}</Pill>
                      {slug && label ? (
                        <Link href={`/kosher/festividades/${slug}`} className="mv-link mv-focus rounded text-[var(--text-primary)]">
                          {label}
                        </Link>
                      ) : (
                        <span className="text-[var(--text-primary)]">{label}</span>
                      )}
                      {i.time && <span className="mv-data">{formatTime(i.time, tz)}</span>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          Cálculos astronómicos con{" "}
          <a href="https://www.hebcal.com" target="_blank" rel="noreferrer" className="mv-link underline">
            Hebcal
          </a>{" "}
          para la diáspora. Zmanim según el Gra; tzet hakojavim a 8,5°.
        </p>
      </section>

      <section aria-labelledby="k-more" className="mt-16 grid gap-3 sm:grid-cols-2">
        <h2 id="k-more" className="sr-only">
          Más del calendario hebreo
        </h2>
        <Link href="/kosher/festividades" className="mv-panel mv-panel-interactive mv-focus flex items-start gap-4 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mv-gold-ink)]" aria-hidden />
          <span>
            <span className="block font-semibold text-[var(--text-primary)]">Festividades</span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">Qué se celebra, qué se acostumbra y las fechas hasta 2035.</span>
          </span>
        </Link>
        <Link href="/kosher/sidur" className="mv-panel mv-panel-interactive mv-focus flex items-start gap-4 p-5">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-techelet" aria-hidden />
          <span>
            <span className="block font-semibold text-[var(--text-primary)]">Sidur de bolsillo</span>
            <span className="mt-1 block text-sm text-[var(--text-secondary)]">Las berajot de todos los días, en hebreo, transliteradas y traducidas.</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
