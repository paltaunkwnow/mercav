import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Info, Plus } from "@/components/icons";
import { StatusBadge } from "@/components/kosher/StatusBadge";
import { PageIntro, cardClass, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { AGENCIES, type Agency } from "@/lib/kosher/agencies";
import { KASHRUT_TERMS } from "@/lib/kosher/kashrut-terms";
import { FOOD, STATUS_HINT, STATUS_ORDER } from "@/lib/kosher/labels";
import { canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";

export const metadata: Metadata = {
  title: "Kashrut, explicado",
  description:
    "Qué significa cada estado de Mercav Kosher, cómo se separan carne, lácteo y parve, un diccionario de kashrut (hejsher, mashgiaj, glatt, mehadrin, jalav Israel) y quién certifica en cada país.",
};

const SECTIONS = [
  { id: "niveles", label: "Niveles" },
  { id: "carne-lacteo-parve", label: "Carne, lácteo y parve" },
  { id: "diccionario", label: "Diccionario" },
  { id: "preguntas", label: "Preguntas" },
  { id: "quien-certifica", label: "Quién certifica" },
] as const;

const FOOD_CARDS = [
  {
    title: FOOD.meat,
    body: "Carne y aves de animales kosher, faenados según la halajá (shejitá) y preparados para quitarles la sangre, y todo lo que se cocina con ellos o en sus utensilios.",
  },
  {
    title: FOOD.dairy,
    body: "Leche, quesos, manteca y crema, y lo que se cocina con ellos o en utensilios lácteos. Los quesos, además, necesitan hejsher.",
  },
  {
    title: FOOD.parve,
    body: "Ni carne ni lácteo: frutas, verduras, granos, huevos y pescado. Va con cualquiera de las dos comidas, salvo el pescado, que no se come junto con carne.",
  },
  {
    title: "Lugares mixtos",
    body: "Un restaurante kosher suele ser de carne o lácteo. Si sirve las dos cosas, tiene cocinas y vajillas separadas, y su certificado lo dice. En Mercav Kosher, la ficha de cada lugar indica si es de carne, lácteo o parve.",
  },
] as const;

/** Visibles en la página y, con el mismo texto, en el FAQPage. */
const FAQS = [
  {
    q: "¿Mercav Kosher certifica lugares o productos?",
    a: "No. Mercav Kosher no emite hejsher ni da psak. Muestra el estado de cada lugar y de dónde sale: el certificado de una agencia, la supervisión que informa el lugar o el reporte de un miembro de la comunidad.",
  },
  {
    q: "¿Qué diferencia hay entre «Certificado» y «Con supervisión»?",
    a: "«Certificado» quiere decir que la ficha tiene registrada la certificación de una agencia. «Con supervisión» quiere decir que se informa supervisión rabínica, pero el certificado no está cargado: preguntá quién supervisa y qué cubre.",
  },
  {
    q: "Un lugar «Kosher autodeclarado», ¿es kosher?",
    a: "Es lo que dice el lugar, sin certificación ni supervisión registradas, y Mercav Kosher no lo puede confirmar. Si para vos hace falta hejsher, este estado no alcanza.",
  },
  {
    q: "¿Cómo confirmo que un hejsher está vigente?",
    a: "Pedí ver el certificado, que tiene que decir qué agencia lo da, qué cubre y hasta cuándo vale, y buscá el lugar o el producto en la lista oficial de esa agencia.",
  },
  {
    q: "¿Por qué cambia el estado de un lugar?",
    a: "Porque los certificados vencen, los locales cambian de dueño, de cocina o de proveedor, y la comunidad reporta lo que ve. Antes de ir, confirmá con el lugar y con la agencia. Con tu cuenta Mercav podés sugerir un cambio desde la ficha del lugar: lo revisa un moderador, y el estado «Certificado» solo se carga con un certificado revisado.",
  },
  {
    q: "¿Puedo comer en un lugar con «Algunos platos kosher»?",
    a: "Ese lugar no es kosher: tiene platos kosher hechos en una cocina que también prepara comida que no lo es. Antes de comer ahí, consultá a tu rabino. Si dice «Algunos productos kosher», es un comercio no kosher que vende productos con sello: mirá el sello de cada uno.",
  },
  {
    q: "¿Qué es un lugar «Estilo judío, sin kashrut»?",
    a: "Un restaurante de cocina judía o israelí que no tiene supervisión de kashrut. No es un lugar kosher, aunque el menú lo parezca.",
  },
  {
    q: "¿El pescado es parve?",
    a: "Sí: el pescado kosher es parve, pero no se come junto con carne. Qué pescados son kosher, con sus nombres en cada país, está en la guía «¿Es kosher este pescado?».",
  },
] as const;

function groupByCountry(list: Agency[]) {
  const groups = new Map<string, Agency[]>();
  for (const a of list) groups.set(a.country, [...(groups.get(a.country) ?? []), a]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
}

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export default function KashrutPage() {
  const local = groupByCountry(AGENCIES.filter((a) => a.countryCode));
  const international = AGENCIES.filter((a) => !a.countryCode);
  const url = canonicalFor("/kosher/kashrut");
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: canonicalFor("/kosher") },
        { "@type": "ListItem", position: 2, name: "Kashrut, explicado", item: url },
      ],
    },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <PageIntro
        title="Kashrut, explicado"
        actions={
          <>
            <Link href="/kosher/mapa" className={primaryButton}>
              Ver el mapa
            </Link>
            <Link href="/kosher/kashrut/pescados" className={secondaryButton}>
              ¿Es kosher este pescado?
            </Link>
          </>
        }
      >
        <p>
          Qué quiere decir cada estado de Mercav Kosher, cómo se separan carne y lácteo, y las palabras que vas a escuchar en una cocina kosher. Es una
          orientación: para decidir, están tu rabino y la agencia que certifica.
        </p>
      </PageIntro>

      <nav aria-label="En esta página" className="-mx-4 mb-12 px-4 sm:mx-0 sm:px-0">
        <ul className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                className="mv-focus inline-flex h-10 items-center rounded-full border border-[var(--mv-hairline-strong)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-techelet/40 hover:text-[var(--text-primary)]"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="niveles" aria-labelledby="k-niveles" className="scroll-mt-28">
        <h2 id="k-niveles" className="mv-h2">
          Los niveles de Mercav Kosher
        </h2>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          Cada lugar de comida tiene un estado, siempre con ícono y palabra. Van de más a menos respaldo: arriba, lo que tiene una certificación registrada;
          abajo, lo que no es kosher o ya no abre. El estado dice de dónde sale la información; no reemplaza al hejsher.
        </p>
        <ol className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="mv-panel flex flex-col gap-2.5 p-5">
              <StatusBadge status={status} type="restaurant" className="self-start" />
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{STATUS_HINT[status]}</p>
            </li>
          ))}
        </ol>
        <div className={`${cardClass} mt-4 flex gap-3`}>
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-techelet" aria-hidden />
          <div className="text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Los estados cambian.</span> Un certificado vence, un local cambia de dueño o de
              proveedor, una agencia retira su aval. Antes de ir, confirmá con el lugar y, si dice estar certificado, con la lista de la agencia.
            </p>
            <p className="mt-2">
              Sinagogas, escuelas y mikvaot no tienen estado de kashrut: su ficha muestra si la fuente está verificada.
            </p>
          </div>
        </div>
      </section>

      <section id="carne-lacteo-parve" aria-labelledby="k-comida" className="mt-16 scroll-mt-28">
        <h2 id="k-comida" className="mv-h2">
          Carne, lácteo y parve
        </h2>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          Carne y lácteo no se cocinan ni se comen juntos, y cada uno tiene su vajilla. Después de comer carne se espera antes de comer lácteo: según la
          costumbre de cada familia, de una a seis horas. Para el tiempo exacto, seguí la costumbre de tu casa o consultá a tu rabino.
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FOOD_CARDS.map((c) => (
            <li key={c.title} className="mv-panel p-5">
              <h3 className="mv-h3">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="diccionario" aria-labelledby="k-diccionario" className="mt-16 scroll-mt-28">
        <h2 id="k-diccionario" className="mv-h2">
          Diccionario
        </h2>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          Definiciones cortas para orientarte. Los detalles cambian según la comunidad y la agencia.
        </p>
        <dl className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {KASHRUT_TERMS.map((t) => (
            <div key={t.id} id={t.id} className="mv-panel scroll-mt-28 p-5">
              <dt className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-display text-lg font-semibold text-[var(--text-primary)]">{t.term}</span>
                <span lang="he" dir="rtl" className="text-base text-techelet">
                  {t.he}
                </span>
              </dt>
              {t.aka && <dd className="mt-1 text-xs text-[var(--text-secondary)]">También: {t.aka.join(", ")}</dd>}
              <dd className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="preguntas" aria-labelledby="k-preguntas" className="mt-16 scroll-mt-28">
        <h2 id="k-preguntas" className="mv-h2">
          Preguntas frecuentes
        </h2>
        <div className="mt-6 max-w-3xl space-y-2.5">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-[1.25rem] border border-[var(--mv-hairline)] transition-colors duration-200 open:border-[var(--color-border-gold)] open:bg-[var(--mv-panel)]">
              <summary className="mv-focus flex min-h-14 cursor-pointer list-none items-start justify-between gap-4 rounded-[1.25rem] px-5 py-4 [&::-webkit-details-marker]:hidden">
                <h3 className="pt-0.5 text-[1rem] font-semibold leading-snug text-[var(--text-primary)]">{f.q}</h3>
                <span
                  aria-hidden
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] transition-transform duration-200 group-open:rotate-45 group-open:border-[var(--color-border-gold)] group-open:text-gold motion-reduce:transition-none"
                >
                  <Plus className="h-4 w-4" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="quien-certifica" aria-labelledby="k-agencias" className="mt-16 scroll-mt-28">
        <h2 id="k-agencias" className="mv-h2">
          Quién certifica en cada país
        </h2>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          Las agencias con sitio público que verificamos. La lista oficial de cada una es la única fuente vigente de qué está certificado.
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {local.map(([country, agencies]) => (
            <li key={country} className="mv-panel p-5">
              <h3 className="mv-h3">{country}</h3>
              <ul className="mt-3 space-y-2">
                {agencies.map((a) => (
                  <li key={a.slug} className="text-sm">
                    <a href={a.website} target="_blank" rel="noreferrer" className="mv-link inline-flex items-center gap-1.5 font-medium">
                      {a.name} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </a>
                    <span className="block text-xs text-[var(--text-secondary)]">{hostOf(a.website)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="mv-panel p-5">
            <h3 className="mv-h3">Sellos internacionales</h3>
            <ul className="mt-3 space-y-2">
              {international.map((a) => (
                <li key={a.slug} className="text-sm">
                  <a href={a.website} target="_blank" rel="noreferrer" className="mv-link inline-flex items-center gap-1.5 font-medium">
                    {a.name} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                  <span className="block text-xs text-[var(--text-secondary)]">{a.country}</span>
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <p className="mt-5 text-sm">
          <Link href="/kosher/comunidad/agencias" className="mv-link inline-flex items-center gap-1.5 font-semibold">
            Contacto, dirección y listas de cada agencia <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>

      <section aria-labelledby="k-seguir" className="mt-16">
        <h2 id="k-seguir" className="sr-only">
          Para seguir
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li>
            <Link href="/kosher/mapa" className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col p-6">
              <span className="mv-h3">El mapa</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                Restaurantes, carnicerías, panaderías y comercios con su estado de kashrut, en cada ciudad.
              </span>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                Abrir el mapa
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
          <li>
            <Link href="/kosher/kashrut/pescados" className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col p-6">
              <span className="mv-h3">¿Es kosher este pescado?</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                Merluza, corvina, abadejo, pejerrey y más, con sus nombres en cada país y las fuentes de cada uno.
              </span>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                Abrir la guía
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
