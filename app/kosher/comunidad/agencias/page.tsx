import type { Metadata } from "next";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { AGENCIES, AGENCIES_VERIFIED_AT, type Agency } from "@/lib/kosher/agencies";
import { BackLink, PageIntro, primaryButton, secondaryButton } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Agencias de kashrut" };

function AgencyCard({ a }: { a: Agency }) {
  const host = new URL(a.website).hostname.replace(/^www\./, "");
  return (
    <li className="mv-panel flex h-full flex-col p-6">
      <p className="text-sm text-[var(--text-secondary)]">{a.country}</p>
      <h3 className="mv-h3 mt-1">{a.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{a.about}</p>
      {(a.address || a.contact) && (
        <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
          {a.address && (
            <li className="flex gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {a.address}
            </li>
          )}
          {a.contact && (
            <li className="flex gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden /> {a.contact}
            </li>
          )}
        </ul>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {a.lists && (
          <a
            href={a.lists.url}
            target="_blank"
            rel="noreferrer"
            className={primaryButton}
          >
            {a.lists.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}
        <a
          href={a.website}
          target="_blank"
          rel="noreferrer"
          className={secondaryButton}
        >
          {host} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </li>
  );
}

export default function KosherAgenciesPage() {
  const local = AGENCIES.filter((a) => a.countryCode);
  const international = AGENCIES.filter((a) => !a.countryCode);

  return (
    <div>
      <BackLink />
      <PageIntro eyebrow="Kashrut" title="Agencias certificadoras">
        <p>
          Mercav Kosher no certifica: muestra quién lo hace. Para confirmar un hejsher, consultá siempre la lista oficial de la agencia, que es la
          única fuente vigente.
        </p>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Datos revisados en el sitio de cada agencia el {AGENCIES_VERIFIED_AT}.</p>
      </PageIntro>

      <section aria-labelledby="k-local">
        <h2 id="k-local" className="mv-h3 mb-5">
          En Latinoamérica
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {local.map((a) => (
            <AgencyCard key={a.slug} a={a} />
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          En Bolivia todavía no tenemos una agencia local con sitio público verificado. Para productos, buscá sellos internacionales o consultá a la
          comunidad de tu ciudad.
        </p>
      </section>

      <section aria-labelledby="k-intl" className="mt-16">
        <h2 id="k-intl" className="mv-h3 mb-5">
          Sellos internacionales frecuentes
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {international.map((a) => (
            <AgencyCard key={a.slug} a={a} />
          ))}
        </ul>
      </section>
    </div>
  );
}
