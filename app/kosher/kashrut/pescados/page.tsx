import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Info } from "@/components/icons";
import { BackLink, PageIntro, cardClass } from "@/components/kosher/ui";
import { FishFinder } from "@/components/kosher/kashrut/FishFinder";
import { FISH, FISH_SOURCES, FISH_VERIFIED_AT, type FishSourceKey } from "@/lib/kosher/fish";
import { canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";

export const metadata: Metadata = {
  title: "¿Es kosher este pescado?",
  description:
    "Qué pescados son kosher y cuáles no, con sus nombres en Argentina, Uruguay, Chile, México y España: merluza, corvina, abadejo, pejerrey, salmón, atún y más, con las fuentes de cada uno.",
};

/** Lo que sirve para comprar, en el orden en que se decide en la pescadería. */
const BUYING = [
  {
    title: "Con piel, o con hejsher",
    body: "Un filete sin piel no se puede identificar. Comprá el pescado entero o pedí que le dejen un pedazo de piel con escamas. Si no, buscá hejsher.",
  },
  {
    title: "Procesado, siempre con hejsher",
    body: "Ahumado, en lata, en escabeche, rebozado o picado: necesita supervisión, porque se procesa junto a otros pescados y lleva otros ingredientes.",
  },
  {
    title: "Cuchillo y tabla",
    body: "En una pescadería que también vende pescado no kosher, pedí que limpien el cuchillo y la tabla antes de cortar el tuyo.",
  },
  {
    title: "Parásitos",
    body: "Algunas agencias piden revisar o no aceptan ciertas especies por el anisakis, un gusano que puede vivir en el pescado. Cada entrada de la guía lo indica cuando corresponde.",
  },
] as const;

/** Nombres que significan otra cosa según el país. */
const SAME_NAME = [
  { name: "Abadejo", body: "En Argentina y Uruguay es un pez discutido (Genypterus blacodes); en España, uno de la familia del bacalao." },
  { name: "Congrio", body: "En Argentina y España es una anguila de mar, que no es kosher; en Chile, el mismo pez discutido que el abadejo argentino." },
  { name: "Dorado", body: "En México es el mahi-mahi, kosher; en los ríos de la cuenca del Plata, otro pez que no figura en las listas." },
  { name: "Róbalo", body: "En México es un robalo kosher (Centropomus); en Chile y la Patagonia, otro pez que no figura en las listas." },
] as const;

export default function KosherFishPage() {
  const usedSources = new Set<FishSourceKey>(FISH.flatMap((f) => f.sources));
  const sources = (Object.keys(FISH_SOURCES) as FishSourceKey[]).filter((key) => usedSources.has(key));
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: canonicalFor("/kosher") },
      { "@type": "ListItem", position: 2, name: "Kashrut, explicado", item: canonicalFor("/kosher/kashrut") },
      { "@type": "ListItem", position: 3, name: "¿Es kosher este pescado?", item: canonicalFor("/kosher/kashrut/pescados") },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <BackLink href="/kosher/kashrut">Kashrut, explicado</BackLink>
      <PageIntro title="¿Es kosher este pescado?">
        <p>
          La Torá permite los peces que tienen aletas y escamas (Levítico 11:9–12; Deuteronomio 14:9–10). Cuentan las escamas que se pueden quitar con la mano o
          con un cuchillo sin romper la piel: por eso el tiburón y la anguila, que las tienen pegadas, no son kosher. Y como, según el Talmud, todo pez con
          escamas tiene aletas, en la práctica alcanza con mirar las escamas.
        </p>
      </PageIntro>

      <section aria-labelledby="p-comprar">
        <h2 id="p-comprar" className="mv-h3 mb-5">
          Antes de comprar
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BUYING.map((b) => (
            <li key={b.title} className="mv-panel p-5">
              <h3 className="font-semibold text-[var(--text-primary)]">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{b.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
          El pescado no necesita faena ritual ni salado, y es parve, pero no se come junto con carne. Algunos peces, como el arenque, pierden las escamas al
          salir del agua y siguen siendo kosher. Las huevas tienen que ser de un pescado kosher.
        </p>
      </section>

      <section aria-labelledby="p-nombres" className="mt-14">
        <h2 id="p-nombres" className="mv-h3 mb-2">
          El nombre no alcanza
        </h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Un mismo nombre puede ser un pez distinto en cada país, y en la pescadería se venden especies parecidas con el nombre de otra. Por eso cada entrada
          tiene el nombre científico.
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SAME_NAME.map((n) => (
            <li key={n.name} className="rounded-2xl border border-[var(--mv-hairline)] p-4 text-sm leading-relaxed">
              <span className="font-semibold text-[var(--text-primary)]">{n.name}. </span>
              <span className="text-[var(--text-secondary)]">{n.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="p-guia" className="mt-14">
        <h2 id="p-guia" className="mv-h2 mb-6">
          La guía
        </h2>
        <FishFinder />
        <div className={`${cardClass} mt-6 flex gap-3`}>
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-techelet" aria-hidden />
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Faltan peces de río de la cuenca del Plata como el pacú, la boga, el sábalo, la tararira o el dorado: no los encontramos en las listas publicadas
            que revisamos. Antes de comerlos, consultá a tu rabino o a la agencia de tu país.
          </p>
        </div>
      </section>

      <section aria-labelledby="p-fuentes" className="mt-14">
        <h2 id="p-fuentes" className="mv-h3 mb-2">
          Fuentes
        </h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Revisadas el {FISH_VERIFIED_AT}. Esta guía orienta: no reemplaza la palabra de tu rabino ni la de tu agencia, y Mercav Kosher no emite hejsher.
        </p>
        <ol className="space-y-3">
          {sources.map((key) => {
            const s = FISH_SOURCES[key];
            return (
              <li key={key} id={`fuente-${key}`} className="scroll-mt-28 text-sm leading-relaxed">
                <a href={s.url} target="_blank" rel="noreferrer" className="mv-link inline-flex items-start gap-1.5 font-medium">
                  {s.title}
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                </a>
                <span className="block text-[var(--text-secondary)]">{s.publisher}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/kosher/comunidad/agencias" className="mv-link inline-flex items-center gap-1.5">
            Agencias de kashrut <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/kosher/mapa" className="mv-link inline-flex items-center gap-1.5">
            Lugares kosher en el mapa <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
