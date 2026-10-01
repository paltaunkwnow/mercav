import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Flame,
  Layers,
  MapPinned,
  MessagesSquare,
  MoonStar,
  Plane,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KosherHero } from "@/components/kosher/KosherHero";
import { PlaceIcon } from "@/components/kosher/PlaceIcon";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { ButtonLink, CTABand, Container, Fact, Reveal, Section, SectionHeading } from "@/components/site/primitives";
import { getKosherViewer } from "@/lib/kosher/server";
import { listCities, pickCity } from "@/lib/kosher/cities";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { formatTime } from "@/lib/kosher/time";
import { SCOPES, STOCK_STALE_DAYS } from "@/lib/kosher/labels";

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
    { value: placeCount, label: "lugares publicados" },
    { value: cityRows.length, label: "ciudades" },
    { value: synagogues, label: "sinagogas" },
    { value: communityCount, label: "kehilot" },
    { value: messageCount, label: "mensajes de la comunidad" },
  ];

  const scopeLabels = Object.values(SCOPES).map((s) => s.label);

  const frictions = [
    {
      icon: Layers,
      title: "La información está dispersa",
      body: "Listas en PDF, grupos de mensajería y recomendaciones de boca en boca que nadie actualiza.",
      answer: "Un solo mapa de lugares, sinagogas, mikvaot y kehilot, con búsqueda y filtros.",
    },
    {
      icon: Clock,
      title: "No sabés si sigue vigente",
      body: "Un certificado vence, una sucursal deja de traer vino, un lugar cierra sin avisar.",
      answer: `Cada estado muestra su fuente y su fecha. El stock sin confirmar por ${STOCK_STALE_DAYS} días queda marcado.`,
    },
    {
      icon: Plane,
      title: "Llegar a una ciudad nueva",
      body: "De viaje no sabés dónde comer, dónde rezar ni a qué hora entra Shabat.",
      answer: "El modo viaje lo junta en una pantalla, con la sala de la comunidad local.",
    },
  ];

  const steps = [
    {
      title: "Buscá",
      body: `Por nombre, ciudad o agencia, o con «cerca de mí». Filtrá por ${scopeLabels.slice(0, -1).join(", ").toLowerCase()} o ${scopeLabels.at(-1)?.toLowerCase()}.`,
    },
    {
      title: "Mirá de dónde sale el estado",
      body: "Certificado significa que figura una agencia. Un reporte comunitario es la nota de un miembro. Siempre con ícono y palabra, nunca solo con color.",
      legend: true,
    },
    {
      title: "Sumá lo que sabés",
      body: "Reportá stock, valorá o sugerí una corrección. Los lugares nuevos y los cambios los revisa un moderador antes de publicarse.",
    },
  ];

  const capabilities = [
    { icon: MapPinned, title: "Un mapa que se lee de un vistazo", body: "Restaurantes, panaderías, sucursales, sinagogas y mikvaot juntos, agrupados por zona y ordenables por cercanía." },
    { icon: Store, title: "Stock por sucursal", body: "Vino, matzá, carne o queso reportados en la sucursal donde los viste, con fecha y confirmaciones de otros miembros." },
    { icon: MessagesSquare, title: "Una conversación por ciudad y por lugar", body: "No hay chat global: lo que se habla queda cerca de donde pasa. Solo entran miembros con cuenta Mercav." },
    { icon: MoonStar, title: "Modo Shabat", body: "Si lo activás, Mercav Kosher queda en solo lectura desde el encendido de velas hasta Havdalá, también en iom tov." },
    { icon: BadgeCheck, title: "Fichas oficiales", body: "Instituciones y negocios administran su ficha, publican en la agenda y cargan su certificado con fecha de vencimiento." },
    { icon: ShieldCheck, title: "Moderación de la comunidad", body: "Tres reportes ocultan un mensaje hasta que lo revisa un moderador. En una disputa, la app no decide quién tiene razón." },
  ];

  const life = [
    { href: "/kosher/comunidad", icon: Users, title: "Comunidad", body: "Agenda, minián, mesa de Shabat, jésed, empleos y agencias de kashrut de tu ciudad." },
    { href: "/kosher/viaje", icon: Plane, title: "Modo viaje", body: "Llegás a una ciudad y ves dónde comer, dónde rezar y la sala de la comunidad local." },
  ];

  return (
    <>
      <KosherHero
        messageCount={messageCount}
        preview={recent.slice(0, 3).map((p) => ({ slug: p.slug, name: p.name, city: p.city, type: p.type, status: p.status, verified: !!p.verifiedAt }))}
      />

      {/* Problem → answer */}
      <Section labelledBy="k-problem" tone="raised" className="[&_.mv-kicker]:text-techelet">
        <Container>
          <SectionHeading
            id="k-problem"
            kicker="El problema"
            title="Encontrar kosher no debería depender de a quién conocés."
            lead="Tres situaciones que se repiten en cada comunidad, y cómo las resuelve Mercav Kosher."
          />
          <ul className="mt-14 grid gap-4 md:grid-cols-3">
            {frictions.map(({ icon: Icon, title, body, answer }, i) => (
              <Reveal as="li" key={title} delay={i * 60} className="mv-panel flex flex-col overflow-hidden">
                <div className="flex flex-1 flex-col gap-4 p-6 md:p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mv-h3">{title}</h3>
                  <p className="mv-body">{body}</p>
                </div>
                <p className="flex items-start gap-3 border-t border-[var(--mv-hairline)] bg-techelet-dim px-6 py-4 text-sm font-medium text-[var(--text-primary)] md:px-7">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-techelet" aria-hidden />
                  {answer}
                </p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* How it works: a real sequence, so it is numbered */}
      <Section labelledBy="k-how" className="[&_.mv-kicker]:text-techelet">
        <Container>
          <SectionHeading
            id="k-how"
            kicker="Cómo funciona"
            title="Buscá, mirá la fuente y sumá lo que sabés."
            action={
              <ButtonLink href="/kosher/mapa" tone="secondary" size="md" className="w-full sm:w-auto">
                Probar en el mapa
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            }
          />
          <ol className="mt-14 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 60} className="mv-panel flex flex-col gap-4 p-6 md:p-7">
                <span className="mv-data grid h-9 w-9 place-items-center rounded-full bg-techelet-dim text-sm font-medium text-techelet ring-1 ring-inset ring-techelet/30">
                  {i + 1}
                </span>
                <h3 className="mv-h3">{s.title}</h3>
                <p className="mv-body">{s.body}</p>
                {s.legend && (
                  <ul className="mt-auto flex flex-wrap gap-2 pt-2" aria-label="Ejemplos de estado">
                    <li><StatusBadge status="certified" type="restaurant" /></li>
                    <li><StatusBadge status="community_report" type="restaurant" /></li>
                    <li><StatusBadge status="unknown" type="restaurant" /></li>
                  </ul>
                )}
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Capabilities */}
      <Section labelledBy="k-capabilities" tone="raised" className="[&_.mv-kicker]:text-techelet">
        <Container>
          <SectionHeading
            id="k-capabilities"
            kicker="Capacidades"
            title="Para comer, rezar y encontrarse, en un solo lugar."
            lead="Hecho con y para la kehilá: cada función nace de una pregunta que la comunidad se hace todas las semanas."
          />
          <Reveal as="ul" className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold ring-1 ring-inset ring-gold/20">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mv-h3 mt-1">{title}</h3>
                <p className="mv-body">{body}</p>
              </li>
            ))}
          </Reveal>

          <div className="mt-16 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
            <Reveal>
              <Link
                href={`/kosher/calendario${city ? `?ciudad=${city.slug}` : ""}`}
                className="liquid-glass mv-focus group flex h-full flex-col rounded-[1.75rem] p-6 md:p-7"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="mv-kicker !text-techelet">Calendario y zmanim</span>
                  <CalendarDays className="h-5 w-5 text-techelet" aria-hidden />
                </span>
                <span className="mv-h3 mt-4">{city ? `Este Shabat en ${city.city}` : "Zmanim de tu ciudad"}</span>
                {city && shabbat?.candles ? (
                  <dl className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[var(--mv-gold-wash)] p-4 ring-1 ring-inset ring-gold/25">
                      <dt className="flex items-center gap-1.5 text-xs font-medium text-gold">
                        <Flame className="h-3.5 w-3.5" aria-hidden /> Velas
                      </dt>
                      <dd className="mv-data mt-1 text-2xl text-[var(--text-primary)]">{formatTime(shabbat.candles, city.timezone)}</dd>
                    </div>
                    <div className="rounded-2xl bg-techelet-dim p-4 ring-1 ring-inset ring-techelet/25">
                      <dt className="flex items-center gap-1.5 text-xs font-medium text-techelet">
                        <MoonStar className="h-3.5 w-3.5" aria-hidden /> Havdalá
                      </dt>
                      <dd className="mv-data mt-1 text-2xl text-[var(--text-primary)]">{shabbat.havdalah ? formatTime(shabbat.havdalah, city.timezone) : "—"}</dd>
                    </div>
                  </dl>
                ) : (
                  <span className="mv-body mt-2">Zmanim, velas, Havdalá y jaguim de tu ciudad.</span>
                )}
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                  Ver el calendario
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </Reveal>
            {life.map(({ href, icon: Icon, title, body }, i) => (
              <Reveal key={href} delay={(i + 1) * 60}>
                <Link href={href} className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col p-6 md:p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-techelet">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mv-h3 mt-5">{title}</span>
                  <span className="mv-body mt-2 flex-1">{body}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                    Abrir
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Trust: live numbers and real places */}
      <Section labelledBy="k-trust" className="[&_.mv-kicker]:text-techelet">
        <Container>
          <SectionHeading
            id="k-trust"
            kicker="Confianza"
            title="Cada lugar dice de dónde sale su estado."
            lead="Mercav Kosher no emite hechsher ni psak: muestra quién certifica, desde cuándo y qué reportó la comunidad. Estas cifras salen del atlas en vivo."
            action={
              <ButtonLink href="/kosher/comunidad/agencias" tone="secondary" size="md" className="w-full sm:w-auto">
                Ver agencias de kashrut
              </ButtonLink>
            }
          />

          <Reveal>
            <dl className="mv-panel mt-14 grid grid-cols-2 gap-x-6 gap-y-8 p-6 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] md:p-8">
              {stats.filter((s) => s.value > 0).map((s) => (
                <Fact key={s.label} value={s.value.toLocaleString("es")} label={s.label} />
              ))}
            </dl>
          </Reveal>

          {recent.length > 0 && (
            <div className="mt-16">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="mv-h3">Empezamos por casa</h3>
                  <p className="mv-body mt-2 max-w-xl">
                    Lugares de Latinoamérica con fuente pública verificada. Los nuevos los revisa un moderador antes de publicarse.
                  </p>
                </div>
                <Link href="/kosher/mapa" className="mv-link inline-flex min-h-10 items-center gap-1.5 self-start text-sm sm:self-auto">
                  Ver todo el mapa <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <Reveal as="ul" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((p) => (
                  <li key={p.id}>
                    <Link href={`/kosher/lugar/${p.slug}`} className="mv-panel mv-panel-interactive mv-focus group flex h-full items-start gap-4 p-5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                        <PlaceIcon type={p.type} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-semibold text-[var(--text-primary)]">{p.name}</span>
                        <span className="block truncate text-sm text-[var(--text-secondary)]">
                          {p.city}, {p.country}
                        </span>
                        <StatusBadge status={p.status} type={p.type} verified={!!p.verifiedAt} className="mt-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </Reveal>
            </div>
          )}

          <figure className="mt-16 border-t border-[var(--mv-hairline)] pt-10 text-center">
            <blockquote lang="he" dir="rtl" className="font-display text-2xl text-techelet md:text-3xl">
              כָּל יִשְׂרָאֵל עֲרֵבִים זֶה בָּזֶה
            </blockquote>
            <figcaption className="mt-3 text-sm text-[var(--text-secondary)]">Todo Israel es responsable el uno del otro. Por eso la información la cuida la comunidad.</figcaption>
          </figure>
        </Container>
      </Section>

      <CTABand
        title="¿Conocés un lugar que falta?"
        lead="Sumalo en un minuto con su fuente. Lo revisa un moderador y queda en el mapa para toda la comunidad."
        action={
          <ButtonLink href="/kosher/sugerir" size="lg" className="w-full sm:w-auto">
            Sugerir un lugar
          </ButtonLink>
        }
        note={
          <>
            Mercav Kosher muestra lugares y reportes de la comunidad; no emite hechsher ni psak.{" "}
            <Link href="/kosher/terminos" className="underline underline-offset-4 hover:text-[var(--text-primary)]">
              Términos de Mercav Kosher
            </Link>
          </>
        }
      />
    </>
  );
}
