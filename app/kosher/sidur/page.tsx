import type { Metadata } from "next";
import { SidurBrowser } from "@/components/kosher/sidur/SidurBrowser";
import { hebrewSerif } from "@/components/kosher/sidur/hebrew-font";
import { PageIntro } from "@/components/kosher/ui";
import { SIDUR } from "@/lib/kosher/sidur";
import { KOSHER_URL, SITE_URL, canonicalFor } from "@/lib/seo/site";
import { jsonLd } from "@/lib/seo/text";
import { cn } from "@/lib/utils";

const TITLE = "Sidur de bolsillo";
const DESCRIPTION = `${SIDUR.length} berajot y oraciones cortas de todos los días, en hebreo con nikud, transliteradas y traducidas al español: al despertar, en la mesa, en Shabat, en las fiestas y de viaje.`;
const PAGE_URL = canonicalFor("/kosher/sidur");

export const metadata: Metadata = {
  title: `${TITLE}: berajot en hebreo y en español`,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { type: "website", locale: "es_419", siteName: "Mercav Kosher", url: PAGE_URL, title: TITLE, description: DESCRIPTION },
};

export default function SidurPage() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "es",
      url: PAGE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: SIDUR.length,
        itemListElement: SIDUR.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.name, url: canonicalFor(`/kosher/sidur/${e.slug}`) })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mercav Kosher", item: KOSHER_URL },
        { "@type": "ListItem", position: 2, name: TITLE, item: PAGE_URL },
      ],
    },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <PageIntro title={TITLE}>
        <p>
          {SIDUR.length} berajot y oraciones cortas para el día a día, en hebreo con nikud, con transliteración para leer en voz alta y una
          traducción al español. Buscá por nombre, por palabra o por momento.
        </p>
      </PageIntro>

      <SidurBrowser />

      <aside aria-labelledby="sidur-about" className="mv-panel mt-16 p-6 md:p-7">
        <h2 id="sidur-about" className="mv-h3">
          Sobre este sidur
        </h2>
        <div className="mt-3 flex max-w-3xl flex-col gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            El Nombre de Hashem va escrito{" "}
            <bdi lang="he" className={cn(hebrewSerif.className, "text-base text-[var(--text-primary)]")}>
              יְיָ
            </bdi>
            , como en muchos sidurim impresos; al rezar se lee Adonai. La transliteración sigue la pronunciación sefaradí e israelí y usa
            tildes para ayudar con la sílaba fuerte.
          </p>
          <p>
            El hebreo está cotejado con sidurim publicados en Sefaria; las traducciones son nuestras. Los textos largos, como el Birkat hamazón,
            aparecen en parte y con el enlace al texto completo.
          </p>
          <p>
            Cada comunidad tiene su nusaj y sus costumbres, y acá marcamos las diferencias más comunes. Este sidur no reemplaza al de tu casa
            ni al consejo de tu rabino: ante cualquier duda de halajá, consultá en tu kehilá.
          </p>
        </div>
      </aside>
    </div>
  );
}
// creado por pato dev y askforvini
