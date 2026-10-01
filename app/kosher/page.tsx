import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KosherHero } from "@/components/kosher/KosherHero";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { KosherReveal } from "@/components/kosher/KosherReveal";
import { getKosherViewer } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { formatTime } from "@/lib/kosher/time";

export default async function KosherHome() {
  const [placeCount, communityCount, cityRows, synagogues, latam, messageCount] = await Promise.all([
    prisma.kosherPlace.count({ where: { published: true } }),
    prisma.kosherCommunity.count(),
    prisma.kosherPlace.findMany({ where: { published: true }, distinct: ["city", "countryCode"], select: { city: true } }),
    prisma.kosherPlace.count({ where: { published: true, type: "synagogue" } }),
    prisma.kosherPlace.findMany({
      where: { published: true, countryCode: { in: ["BO", "AR", "BR", "UY", "CL"] } },
      orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
    }),
    prisma.kosherMessage.count({ where: { hidden: false } }),
  ]);

  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const city = pickCity(cities, undefined, viewer);
  const shabbat = city ? nextShabbat(city) : null;

  const byCountry = new Map<string, typeof latam>();
  for (const p of latam) byCountry.set(p.countryCode, [...(byCountry.get(p.countryCode) ?? []), p]);
  const recent: typeof latam = [];
  for (let round = 0; recent.length < 6 && round < latam.length; round++) {
    for (const list of byCountry.values()) if (list[round] && recent.length < 6) recent.push(list[round]);
  }

  const stats = [
    { value: placeCount, label: "lugares en el atlas" },
    { value: cityRows.length, label: "ciudades" },
    { value: synagogues, label: "sinagogas" },
    { value: communityCount, label: "kehilot" },
  ];

  const pillars = [
    {
      title: "Un mapa que se lee de un vistazo",
      body: "Restaurantes, panaderías, sucursales, sinagogas y mikvaot en un solo mapa. Cada pin dice su estado con ícono y palabra, nunca solo con color.",
    },
    {
      title: "La fuente siempre a la vista",
      body: "Certificado significa que figura una agencia. Un reporte comunitario es una nota de un miembro. Mercav Kosher no emite hechsher ni psak.",
    },
    {
      title: "Stock por sucursal",
      body: "Vino, matzá, carne o queso reportados en la sucursal donde los viste, con fecha. Pasados 14 días sin confirmar, se marcan como posiblemente desactualizados.",
    },
    {
      title: "Tu kehilá, en su propia conversación",
      body: "Cada ciudad y cada lugar tienen su chat. Solo entran miembros con cuenta Mercav, y la comunidad modera con reportes.",
    },
    {
      title: "Modo Shabat",
      body: "Si lo activás, Mercav Kosher queda en solo lectura desde el encendido de velas hasta Havdalá, también en iom tov, con los horarios exactos de tu ciudad.",
    },
    {
      title: "Tu cuenta Mercav de siempre",
      body: "No hace falta otro registro. Tus valoraciones y mensajes usan la misma cuenta que Ads, Jobs y Pwn.",
    },
  ];

  return (
    <div className="space-y-24 md:space-y-32">
      <KosherHero
        stats={stats}
        messageCount={messageCount}
        preview={recent.slice(0, 3).map((p) => ({ slug: p.slug, name: p.name, city: p.city, type: p.type, status: p.status, verified: !!p.verifiedAt }))}
      />

      <section aria-labelledby="k-pillars">
        <KosherReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-techelet">Hecho para la comunidad</p>
          <h2 id="k-pillars" className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
            Todo lo que necesitás para comer, rezar y encontrarte, en un solo lugar.
          </h2>
        </KosherReveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <li key={p.title} className="rounded-[2rem] border border-white/5 bg-bg-secondary/70 p-7 backdrop-blur-xl md:p-8">
              <KosherReveal delay={i * 0.05}>
                <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-xl font-semibold text-[var(--text-primary)]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{p.body}</p>
              </KosherReveal>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="k-more">
        <KosherReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-techelet">Más allá del mapa</p>
          <h2 id="k-more" className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
            La vida de la kehilá, semana a semana
          </h2>
        </KosherReveal>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              href: `/kosher/calendario?ciudad=${city?.slug ?? ""}`,
              title: "Calendario",
              body: city && shabbat?.candles ? `En ${city.city}, velas el viernes a las ${formatTime(shabbat.candles, city.timezone)}${shabbat.havdalah ? ` y Havdalá a las ${formatTime(shabbat.havdalah, city.timezone)}` : ""}.` : "Zmanim, velas, Havdalá y jaguim de tu ciudad.",
            },
            { href: "/kosher/comunidad", title: "Comunidad", body: "Agenda, minián, mesa de Shabat, jésed, empleos y agencias de kashrut." },
            { href: "/kosher/viaje", title: "Modo viaje", body: "Llegás a una ciudad y ves dónde comer, dónde rezar y la sala de la comunidad local." },
          ].map((c, i) => (
            <li key={c.title}>
              <KosherReveal delay={i * 0.05}>
                <Link
                  href={c.href}
                  className="group block h-full rounded-[1.75rem] border border-border bg-bg-secondary p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[var(--shadow-gold)]"
                >
                  <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] group-hover:text-gold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
                </Link>
              </KosherReveal>
            </li>
          ))}
        </ul>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="k-latam">
          <KosherReveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-techelet">Latinoamérica</p>
              <h2 id="k-latam" className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
                Empezamos por casa
              </h2>
              <p className="mt-2 max-w-xl text-[var(--text-secondary)]">
                La Paz, Buenos Aires, São Paulo, Recife, Montevideo y Santiago. Cada lugar tiene una fuente pública verificada; los nuevos los revisa un moderador.
              </p>
            </div>
            <Link href="/kosher/mapa" className="inline-flex h-11 items-center self-start rounded-full border border-border px-5 text-sm font-semibold text-[var(--text-primary)] hover:border-gold/50 md:self-auto">
              Ver todo el mapa
            </Link>
          </KosherReveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p, i) => (
              <li key={p.id}>
                <KosherReveal delay={i * 0.04}>
                  <Link
                    href={`/kosher/lugar/${p.slug}`}
                    className="group block h-full rounded-[1.75rem] border border-border bg-bg-secondary p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[var(--shadow-gold)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold">
                        <PlaceIcon type={p.type} className="h-5 w-5" />
                      </span>
                      <StatusBadge status={p.status} type={p.type} verified={!!p.verifiedAt} />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-[var(--text-primary)] group-hover:text-gold">{p.name}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {p.city}, {p.country}
                    </p>
                  </Link>
                </KosherReveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-bg-secondary px-6 py-14 text-center md:px-16 md:py-20">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-techelet/10 blur-[100px]" />
        <KosherReveal className="relative">
          <p lang="he" dir="rtl" className="font-display text-2xl text-techelet">
            כָּל יִשְׂרָאֵל עֲרֵבִים זֶה בָּזֶה
          </p>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">Todo Israel es responsable el uno del otro.</p>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
            ¿Conocés un lugar que falta?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--text-secondary)]">
            Sumalo en un minuto. Lo revisa un moderador y queda en el mapa para toda la comunidad.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/kosher/sugerir" className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-black">
              Sugerir un lugar
            </Link>
            <Link href="/kosher/chat" className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 text-sm font-semibold text-[var(--text-primary)] hover:border-gold/50">
              Entrar al chat de la comunidad
            </Link>
          </div>
        </KosherReveal>
      </section>

      <p className="pb-4 text-center text-xs text-[var(--text-tertiary)]">
        Mercav Kosher muestra lugares y reportes de la comunidad. No emite hechsher ni psak.{" "}
        <Link href="/kosher/terminos" className="underline underline-offset-4 hover:text-gold">
          Términos de Mercav Kosher
        </Link>
      </p>
    </div>
  );
}
