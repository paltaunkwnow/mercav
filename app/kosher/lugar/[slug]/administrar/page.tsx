import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, CalendarPlus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, managesPlace } from "@/lib/kosher/server";
import { PLACE_TYPES, isFoodPlace } from "@/lib/kosher/labels";
import { BackLink, PageIntro, Pill, SignInCard, cardClass, secondaryButton } from "@/components/kosher/ui";
import { ClaimForm, ManageForm } from "@/components/kosher/CommunityForms";

export const metadata: Metadata = { title: "Administrar ficha" };

const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ManagePlacePage({ params }: { params: { slug: string } }) {
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug } });
  if (!place?.published) notFound();
  const viewer = await getKosherViewer();
  const back = <BackLink href={`/kosher/lugar/${place.slug}`}>{place.name}</BackLink>;

  if (!viewer) {
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <PageIntro eyebrow="Fichas oficiales" title={`Administrar ${place.name}`} />
        <SignInCard callbackUrl={`/kosher/lugar/${place.slug}/administrar`}>
          Entrá con la cuenta Mercav de la institución o del negocio para pedir la administración de esta ficha.
        </SignInCard>
      </div>
    );
  }

  const [isManager, claims, community] = await Promise.all([
    managesPlace(viewer.id, place.id),
    prisma.kosherClaim.findMany({ where: { placeId: place.id, userId: viewer.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.kosherCommunity.findFirst({ where: { city: place.city, countryCode: place.countryCode }, select: { slug: true } }),
  ]);
  const pending = claims.filter((c) => c.state === "pending");
  const isFood = isFoodPlace(place.type);
  const prayer = (place.prayerTimes as { shacharit?: string; mincha?: string; maariv?: string } | null) ?? {};
  const certExpired = place.certExpiresAt ? place.certExpiresAt < new Date() : false;
  const certSoon = place.certExpiresAt ? place.certExpiresAt.getTime() - Date.now() < 21 * 86_400_000 : false;

  if (!isManager) {
    const waiting = pending.find((c) => c.kind === "ownership");
    const rejected = claims.find((c) => c.kind === "ownership" && c.state === "rejected");
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <PageIntro eyebrow="Fichas oficiales" title={`¿${place.name} es tu lugar?`}>
          <p>
            Las instituciones y los negocios pueden administrar su ficha: actualizar teléfono, horarios de tefilá e información, publicar en la
            agenda como oficiales y cargar su certificado de kashrut con fecha de vencimiento.
          </p>
        </PageIntro>
        {waiting ? (
          <div className={cardClass}>
            <Pill tone="gold">En revisión</Pill>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Recibimos tu pedido el {fmt(waiting.createdAt)}. Un moderador lo confirma con el lugar y te avisamos en la campana de Mercav.
            </p>
          </div>
        ) : (
          <div className={cardClass}>
            {rejected && (
              <p className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                No pudimos verificar tu pedido anterior. Sumá un dato que podamos confirmar, como un correo con el dominio del lugar.
              </p>
            )}
            <ClaimForm slug={place.slug} kind="ownership" />
          </div>
        )}
        <p className="mt-6 text-sm text-[var(--text-tertiary)]">
          ¿Recibiste una invitación del equipo de Mercav Kosher? Abrí el enlace y tendrás acceso sin esperar revisión.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {back}
      <PageIntro
        eyebrow={PLACE_TYPES[place.type]}
        title={place.name}
        actions={
          <Link href={`/kosher/comunidad/agenda${community ? `?ciudad=${community.slug}` : ""}`} className={secondaryButton}>
            <CalendarPlus className="h-4 w-4" aria-hidden /> Publicar en la agenda
          </Link>
        }
      >
        <p className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-techelet" aria-hidden /> Administrás esta ficha. Los cambios se publican al guardar.
        </p>
      </PageIntro>

      {isFood && (
        <section className={`${cardClass} mb-4`} aria-labelledby="k-cert">
          <h2 id="k-cert" className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--text-primary)]">
            <ShieldCheck className="h-5 w-5 text-techelet" aria-hidden /> Certificado de kashrut
          </h2>
          {place.status === "certified" && place.certExpiresAt ? (
            <p
              className={
                certExpired || certSoon
                  ? "mt-3 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-primary)]"
                  : "mt-3 text-sm text-[var(--text-secondary)]"
              }
            >
              {(certExpired || certSoon) && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />}
              {place.agencyName} · {certExpired ? "venció" : "vence"} el {fmt(place.certExpiresAt)}.
              {certExpired ? " La ficha muestra un aviso hasta que cargues el renovado." : certSoon ? " Cargá el renovado para que no aparezca el aviso." : ""}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Cargá el certificado vigente. Lo confirmamos con la agencia y la ficha pasa a «Certificado», con recordatorio antes de que venza.
            </p>
          )}
          {pending.some((c) => c.kind === "certificate") ? (
            <p className="mt-4">
              <Pill tone="gold">Certificado en revisión</Pill>
            </p>
          ) : (
            <div className="mt-5 border-t border-border pt-5">
              <ClaimForm slug={place.slug} kind="certificate" />
            </div>
          )}
        </section>
      )}

      <section className={cardClass} aria-labelledby="k-info">
        <h2 id="k-info" className="mb-5 font-display text-xl font-semibold text-[var(--text-primary)]">
          Información de la ficha
        </h2>
        <ManageForm
          slug={place.slug}
          initial={{
            phone: place.phone ?? "",
            website: place.website ?? "",
            notes: place.notes ?? "",
            shacharit: prayer.shacharit ?? "",
            mincha: prayer.mincha ?? "",
            maariv: prayer.maariv ?? "",
          }}
        />
        <p className="mt-5 text-xs text-[var(--text-tertiary)]">
          El nombre, la dirección y el estado de kashrut se corrigen con una sugerencia desde la ficha, para que siempre tengan fuente.
        </p>
      </section>
    </div>
  );
}
