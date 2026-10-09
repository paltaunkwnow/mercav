import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Globe, GraduationCap, BadgeCheck, CalendarDays, Pencil, Users, UserRound } from "@/components/icons";
import { SaveButton } from "@/components/ui/SaveButton";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { ReportButton } from "@/components/ui/ReportButton";
import { Container, ButtonLink } from "@/components/site/primitives";
import { BackLink, Spec, EMPLOYMENT_LABEL, WORK_MODE_LABEL, EXPERIENCE_LABEL, labelFor } from "@/components/anuncios/market-ui";
import { MobileActionBar } from "@/components/anuncios/MobileActionBar";

function formatEnumValue(val: string) {
  if (!val) return "";
  return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default async function EmpleoDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let job: any = null;
  
  try {
    job = await prisma.jobPost.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true, avatar: true, isVerified: true, email: true } }
      }
    });
  } catch (e) {
    console.error(e);
  }

  if (!job) {
    notFound();
  }

  const isOwner = session?.user?.email === job.company?.email || (session?.user as any)?.id === job.companyId;

  const company = job.company?.name || "Empresa confidencial";
  const logo = job.logo || job.company?.avatar;
  const cur = (job.salaryCurrency || "USD").toUpperCase();
  const sym = cur === "USD" ? "US$" : cur;
  const num = (n: number) => Number(n).toLocaleString("es");
  const salary =
    job.salaryVisible && (job.salaryMin != null || job.salaryMax != null)
      ? job.salaryMin != null && job.salaryMax != null
        ? `${sym} ${num(job.salaryMin)} – ${num(job.salaryMax)}`
        : `${sym} ${num(job.salaryMin ?? job.salaryMax)}`
      : null;
  const published = job.createdAt ? new Date(job.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : null;
  const closes = job.expiresAt ? new Date(job.expiresAt).toLocaleDateString("es", { day: "numeric", month: "long" }) : null;

  const blocks = [
    { id: "job-desc", title: "Descripción del puesto", text: job.description },
    { id: "job-req", title: "Requisitos", text: job.requirements },
    { id: "job-resp", title: "Responsabilidades", text: job.responsibilities },
    { id: "job-benefits", title: "Beneficios", text: job.benefits },
  ].filter((b) => b.text);

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink href="/empleos">Volver a Mercav Jobs</BackLink>
          {isOwner ? (
            <ButtonLink href={`/empleos/editar/${job.id}`} tone="secondary" size="sm">
              <Pencil className="h-4 w-4" aria-hidden />
              Editar vacante
            </ButtonLink>
          ) : (
            <ReportButton targetId={job.id} targetType="JOB" />
          )}
        </div>

        <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`Logo de ${company}`} className="h-20 w-20 shrink-0 rounded-[1.5rem] border border-[var(--mv-hairline)] object-cover" />
          ) : (
            <span aria-hidden className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] border border-[var(--mv-hairline)] font-display text-2xl font-semibold text-[var(--text-secondary)]">
              {company.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {job.employmentType ? <span className="mv-chip">{labelFor(EMPLOYMENT_LABEL, job.employmentType) || formatEnumValue(job.employmentType)}</span> : null}
              {job.workMode ? <span className="mv-chip">{labelFor(WORK_MODE_LABEL, job.workMode)}</span> : null}
              {job.experienceLevel ? <span className="mv-chip">{labelFor(EXPERIENCE_LABEL, job.experienceLevel)}</span> : null}
            </div>
            <h1 className="mv-h2 max-w-4xl">{job.title}</h1>
            <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                {company}
                {job.company?.isVerified ? <BadgeCheck className="h-4 w-4 text-gold" aria-label="Cuenta verificada" /> : null}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold" aria-hidden />
                {[job.city, job.country].filter(Boolean).join(", ")}
              </span>
              {published ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Publicada el {published}
                </span>
              ) : null}
            </p>
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-10">
            {blocks.map((b) => (
              <section key={b.id} aria-labelledby={b.id} className="flex flex-col gap-4">
                <h2 id={b.id} className="mv-h3">{b.title}</h2>
                <p className="mv-body max-w-3xl whitespace-pre-wrap text-base">{b.text}</p>
              </section>
            ))}
          </div>

          <aside aria-label="Resumen del puesto" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <div className="mv-panel flex flex-col gap-6 border-[var(--color-border-gold)] p-6 md:p-7">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-[var(--text-secondary)]">Salario mensual</p>
                <p className={salary ? "mv-data text-2xl font-semibold tracking-tight text-[var(--text-primary)]" : "font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]"}>
                  {salary ?? "A convenir"}
                </p>
                {!salary ? <p className="text-xs text-[var(--text-tertiary)]">La empresa eligió no publicar el rango.</p> : null}
              </div>

              <dl className="flex flex-col gap-4 border-y border-[var(--mv-hairline)] py-5">
                <Spec icon={Briefcase} label="Contrato" value={labelFor(EMPLOYMENT_LABEL, job.employmentType) || "Sin especificar"} />
                <Spec icon={Globe} label="Modalidad" value={labelFor(WORK_MODE_LABEL, job.workMode || "PRESENCIAL")} />
                <Spec icon={GraduationCap} label="Experiencia" value={labelFor(EXPERIENCE_LABEL, job.experienceLevel) || "Sin especificar"} />
                {closes ? <Spec icon={CalendarDays} label="Recibe postulaciones hasta" value={closes} /> : null}
              </dl>

              {!isOwner ? (
                <div className="flex flex-col gap-3">
                  <ButtonLink href={`/empleos/${job.id}/postular`} size="lg" className="w-full">
                    Postularme
                  </ButtonLink>
                  <SaveButton itemId={job.id} type="job" initialSaved={false} />
                  <p className="flex items-start gap-2.5 pt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    La empresa ve tu perfil de Mercav junto a la postulación. Revisá que esté al día.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <ButtonLink href={`/dashboard/postulantes?jobId=${job.id}`} className="w-full">
                    <Users className="h-4 w-4" aria-hidden />
                    Ver postulantes
                  </ButtonLink>
                  <ButtonLink href={`/empleos/editar/${job.id}`} tone="secondary" className="w-full">
                    Editar vacante
                  </ButtonLink>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Container>

      <MobileActionBar label="Postularme a esta vacante">
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-[var(--text-secondary)]">Salario</span>
          <span className={salary ? "mv-data truncate font-semibold text-[var(--text-primary)]" : "truncate font-semibold text-[var(--text-primary)]"}>
            {salary ?? "A convenir"}
          </span>
        </p>
        {isOwner ? (
          <ButtonLink href={`/empleos/editar/${job.id}`}>Editar</ButtonLink>
        ) : (
          <ButtonLink href={`/empleos/${job.id}/postular`}>Postularme</ButtonLink>
        )}
      </MobileActionBar>
    </div>
  );
}
// creado por pato dev y askforvini
