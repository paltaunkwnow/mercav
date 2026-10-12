import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BadgeCheck, CalendarPlus, ShieldCheck } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, managesPlace } from "@/lib/kosher/server";
import { LATAM_COUNTRIES } from "@/lib/geo/latam";
import { parseHours, placeTimezone } from "@/lib/kosher/hours";
import { PLACE_TYPES, isFoodPlace } from "@/lib/kosher/labels";
import { BackLink, PageIntro, Pill, SignInCard, cardClass, secondaryButton } from "@/components/kosher/ui";
import { ClaimForm, ManageForm } from "@/components/kosher/CommunityForms";
import { HoursSection, KashrutSection } from "@/components/kosher/manage/ManageSections";
import { PhotoManager } from "@/components/kosher/manage/PhotoManager";
import { MAX_PHOTOS } from "@/components/kosher/manage/details";
import { listPhotos } from "@/app/api/kosher/photos/_lib/photos";

export const metadata: Metadata = { title: "Administrar ficha" };

const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Todas las zonas IANA del servidor (van como dato al cliente, así no cambian entre servidor y navegador). */
function timeZones() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return Array.from(new Set(LATAM_COUNTRIES.map((c) => c.timezone))).sort();
  }
}

export default async function ManagePlacePage({ params }: { params: { slug: string } }) {
  const place = await prisma.kosherPlace.findUnique({ where: { slug: params.slug } });
  if (!place?.published) notFound();
  const viewer = await getKosherViewer();
  const back = <BackLink href={`/kosher/lugar/${place.slug}`}>{place.name}</BackLink>;

  if (!viewer) {
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <PageIntro title={`Administrar ${place.name}`} />
        <SignInCard callbackUrl={`/kosher/lugar/${place.slug}/administrar`}>
          Entrá con la cuenta Mercav de la institución o del negocio para pedir la administración de esta ficha.
        </SignInCard>
      </div>
    );
  }

  const [isManager, claims, community, photos] = await Promise.all([
    managesPlace(viewer.id, place.id),
    prisma.kosherClaim.findMany({ where: { placeId: place.id, userId: viewer.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.kosherCommunity.findFirst({ where: { city: place.city, countryCode: place.countryCode }, select: { slug: true } }),
    listPhotos(prisma, place.id),
  ]);
  // Moderadores locales, agencias y admins editan la ficha aunque no la administren.
  const canEdit = isManager || viewer.isModerator;
  const pending = claims.filter((c) => c.state === "pending");
  const isFood = isFoodPlace(place.type);
  const prayer = (place.prayerTimes as { shacharit?: string; mincha?: string; maariv?: string } | null) ?? {};
  const certExpired = place.certExpiresAt ? place.certExpiresAt < new Date() : false;
  const certSoon = place.certExpiresAt ? place.certExpiresAt.getTime() - Date.now() < 21 * 86_400_000 : false;

  if (!canEdit) {
    const waiting = pending.find((c) => c.kind === "ownership");
    const rejected = claims.find((c) => c.kind === "ownership" && c.state === "rejected");
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <PageIntro title={`¿${place.name} es tu lugar?`}>
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
        title={place.name}
        actions={
          <Link href={`/kosher/comunidad/agenda${community ? `?ciudad=${community.slug}` : ""}`} className={secondaryButton}>
            <CalendarPlus className="h-4 w-4" aria-hidden /> Publicar en la agenda
          </Link>
        }
      >
        <p className="flex items-start gap-2">
          {isManager ? (
            <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-techelet" aria-hidden />
          ) : (
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-techelet" aria-hidden />
          )}
          <span>
            {PLACE_TYPES[place.type]} en {place.city}. {isManager ? "Administrás esta ficha" : "Editás como moderación"}: los cambios se publican al
            guardar.
          </span>
        </p>
      </PageIntro>

      {isFood && (
        <section className={`${cardClass} mb-4`} aria-labelledby="k-cert">
          <h2 id="k-cert" className="mv-h3 flex items-center gap-2">
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
          ) : isManager ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Cargá el certificado vigente. Lo confirmamos con la agencia y la ficha pasa a «Certificado», con recordatorio antes de que venza.
            </p>
          ) : null}
          {!isManager ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              El certificado lo envía quien administra la ficha, y lo verifica otro moderador con la agencia antes de marcar «Certificado».
            </p>
          ) : pending.some((c) => c.kind === "certificate") ? (
            <p className="mt-4">
              <Pill tone="gold">Certificado en revisión</Pill>
            </p>
          ) : (
            <div className="mt-5 border-t border-[var(--mv-hairline)] pt-5">
              <ClaimForm slug={place.slug} kind="certificate" />
            </div>
          )}
        </section>
      )}

      <section className={`${cardClass} mb-4`} aria-labelledby="k-details">
        <h2 id="k-details" className="mv-h3">
          {isFood ? "Kashrut, precio y servicios" : "Servicios"}
        </h2>
        <p className="mb-6 mt-2 text-sm text-[var(--text-secondary)]">
          {isFood ? "Contá con precisión qué es el lugar: el nivel de kashrut se muestra en la ficha y en el mapa." : "Lo que ofrece el lugar a quien lo visita."}
        </p>
        <KashrutSection
          slug={place.slug}
          type={place.type}
          isModerator={viewer.isModerator}
          initial={{ status: place.status, priceLevel: place.priceLevel, services: place.services }}
        />
      </section>

      <section className={`${cardClass} mb-4`} aria-labelledby="k-hours">
        <h2 id="k-hours" className="mv-h3">
          Horario de atención
        </h2>
        <p className="mb-6 mt-2 text-sm text-[var(--text-secondary)]">
          Con el horario cargado, la ficha dice si está abierto ahora. Si cambia por un jag o antes de Shabat, avisalo en «Información para la comunidad».
        </p>
        <HoursSection
          slug={place.slug}
          initialHours={parseHours(place.hours)}
          initialTimezone={place.timezone}
          defaultTimezone={placeTimezone({ countryCode: place.countryCode })}
          zones={timeZones()}
        />
      </section>

      <section className={`${cardClass} mb-4`} aria-labelledby="k-photos">
        <h2 id="k-photos" className="mv-h3">
          Fotos
        </h2>
        <p className="mb-6 mt-2 text-sm text-[var(--text-secondary)]">
          Hasta {MAX_PHOTOS} fotos. La portada es la que se ve primero en la ficha.
        </p>
        <PhotoManager slug={place.slug} placeName={place.name} initial={photos} initialCover={place.coverPhotoId} />
      </section>

      <section className={cardClass} aria-labelledby="k-info">
        <h2 id="k-info" className="mv-h3 mb-6">
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
          El nombre y la dirección se corrigen con una sugerencia desde la ficha, para que siempre tengan fuente.
        </p>
      </section>
    </div>
  );
}
