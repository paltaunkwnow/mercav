import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin } from "@/components/icons";
import { listCommunityJobs } from "@/lib/kosher/jobs";
import { BackLink, EmptyState, PageIntro, Pill, primaryButton, secondaryButton } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Empleos de la comunidad" };

const WORK_MODE = { PRESENCIAL: "Presencial", REMOTO: "Remoto", HIBRIDO: "Híbrido" } as const;
const EMPLOYMENT = { TIEMPO_COMPLETO: "Tiempo completo", PART_TIME: "Part time", FREELANCE: "Freelance", PASANTIA: "Pasantía" } as const;

export default async function KosherJobsPage() {
  const jobs = await listCommunityJobs(40);

  return (
    <div>
      <BackLink />
      <PageIntro
        eyebrow="Mercav Jobs"
        title="Empleos de la comunidad"
        actions={
          <>
            <Link href="/empleos/publicar" className={primaryButton}>
              Publicar una oferta
            </Link>
            <Link href="/empleos" className={secondaryButton}>
              Ver todo Mercav Jobs
            </Link>
          </>
        }
      >
        <p>
          Ofertas de Mercav Jobs relacionadas con la vida comunitaria: mashgijim, cocina kosher, docentes de hebreo, instituciones y más. Se publican
          y se postulan con tu misma cuenta Mercav.
        </p>
      </PageIntro>

      {jobs.length === 0 ? (
        <EmptyState>
          Ahora no hay ofertas comunitarias activas. Las instituciones pueden publicar desde Mercav Jobs usando palabras como «kosher», «mashgiaj»,
          «hebreo» o «comunidad judía» para aparecer acá.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/empleos/${j.id}`}
                className="mv-panel mv-panel-interactive mv-focus group flex h-full flex-col p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                    <Briefcase className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="mv-h3">{j.title}</h2>
                    {j.company && <p className="text-sm text-[var(--text-secondary)]">{j.company.name}</p>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  {(j.city || j.country) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {[j.city, j.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {j.workMode && <Pill>{WORK_MODE[j.workMode]}</Pill>}
                  {j.employmentType && <Pill>{EMPLOYMENT[j.employmentType]}</Pill>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
