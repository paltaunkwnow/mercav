import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { excerpt, jsonLd } from "@/lib/seo/text";
import { SITE_URL } from "@/lib/seo/site";

async function load(id: string) {
  try {
    return await prisma.jobPost.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        country: true,
        employmentType: true,
        workMode: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        salaryVisible: true,
        createdAt: true,
        expiresAt: true,
        company: { select: { name: true, avatar: true } },
      },
    });
  } catch {
    return null;
  }
}

const EMPLOYMENT: Record<string, string> = {
  TIEMPO_COMPLETO: "FULL_TIME",
  PART_TIME: "PART_TIME",
  FREELANCE: "CONTRACTOR",
  PASANTIA: "INTERN",
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await load(params.id);
  if (!job) return { title: "Vacante", robots: { index: false } };
  const where = job.workMode === "REMOTO" ? "remoto" : job.city;
  const title = job.company?.name ? `${job.title} en ${job.company.name} (${where})` : `${job.title} (${where})`;
  const description = excerpt(job.description) || `Vacante en ${job.city}, ${job.country}. Postulate con tu perfil de Mercav.`;
  return {
    title,
    description,
    openGraph: { title, description, url: `/empleos/${job.id}` },
    twitter: { title, description },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const job = await load(params.id);
  const data = job && {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.createdAt.toISOString(),
    ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
    employmentType: EMPLOYMENT[job.employmentType] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.company?.name ?? "Empresa en Mercav", ...(job.company?.avatar ? { logo: job.company.avatar } : {}) },
    ...(job.workMode === "REMOTO"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: job.country } }
      : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city, addressCountry: job.country } } }),
    ...(job.salaryVisible && (job.salaryMin || job.salaryMax)
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: (job.salaryCurrency || "USD").toUpperCase(),
            value: { "@type": "QuantitativeValue", ...(job.salaryMin ? { minValue: job.salaryMin } : {}), ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: "MONTH" },
          },
        }
      : {}),
    directApply: true,
    url: `${SITE_URL}/empleos/${job.id}`,
  };
  return (
    <>
      {data ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /> : null}
      {children}
    </>
  );
}
// creado por pato dev y askforvini
