import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Maximize,
  Compass,
  Hammer,
  Clock,
  Lightbulb,
  Eye,
  BadgePercent,
  BadgeCheck,
  MessageSquare,
  Megaphone,
  Pencil,
  CreditCard,
} from "lucide-react";
import { SaveButton } from "@/components/ui/SaveButton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import BookingCalendar from "@/components/anuncios/BookingCalendar";
import { ReportButton } from "@/components/ui/ReportButton";
import { Container, ButtonLink } from "@/components/site/primitives";
import { BackLink, MediaFrame, Spec, SPACE_TYPE_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";
import { MobileActionBar } from "@/components/anuncios/MobileActionBar";

export default async function AnuncioDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let space: any = null;
  
  try {
    space = await prisma.space.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, avatar: true, isVerified: true } },
        images: true,
        reservations: {
          where: {
            status: { in: ["CONFIRMED", "ACTIVE"] },
            endDate: { gte: new Date() }
          },
          orderBy: { startDate: "asc" }
        }
      }
    });
  } catch (e) {
    console.error(e);
  }

  if (!space) {
    notFound();
  }

  const isOwner = session?.user?.email && space.owner.id === (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id;

  const images: { url: string }[] = space.images || [];
  const monthly = formatMoney(space.pricePerMonth, space.currency);
  const weekly = formatMoney(space.pricePerWeek, space.currency);
  const daily = formatMoney(space.pricePerDay, space.currency);
  const months = space.minContractMonths || 1;

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink href="/anuncios">Volver a Mercav Ads</BackLink>
          {isOwner ? (
            <ButtonLink href={`/anuncios/editar/${space.id}`} tone="secondary" size="sm">
              <Pencil className="h-4 w-4" aria-hidden />
              Editar anuncio
            </ButtonLink>
          ) : (
            <ReportButton targetId={space.id} targetType="SPACE" />
          )}
        </div>

        <header className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="mv-chip">{labelFor(SPACE_TYPE_LABEL, space.type)}</span>
            {space.hasLighting ? (
              <span className="mv-chip">
                <Lightbulb className="h-3.5 w-3.5 text-gold" aria-hidden /> Iluminado
              </span>
            ) : null}
            {space.isFirstRentalFree ? (
              <span className="mv-chip mv-chip-gold">
                <BadgePercent className="h-3.5 w-3.5" aria-hidden /> Primer alquiler sin comisión
              </span>
            ) : null}
          </div>
          <h1 className="mv-h2 max-w-4xl">{space.title}</h1>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gold" aria-hidden />
              {[space.city, space.country].filter(Boolean).join(", ")}
            </span>
            {space.trafficEstimate ? (
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-gold" aria-hidden />
                <span className="mv-data">{Number(space.trafficEstimate).toLocaleString("es")}</span> vistas estimadas por mes
              </span>
            ) : null}
          </p>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-10">
            {/* Gallery */}
            <div className="flex flex-col gap-3">
              <MediaFrame
                src={images[0]?.url}
                alt={space.title}
                ratio="aspect-[16/10]"
                icon={Megaphone}
                emptyLabel="Este espacio todavía no tiene fotos"
                priority
                className="rounded-[1.75rem] border border-[var(--mv-hairline)]"
              />
              {images.length > 1 ? (
                <ul className="grid grid-cols-4 gap-3" aria-label="Más fotos">
                  {images.slice(1, 5).map((img, i) => (
                    <li key={img.url + i}>
                      <MediaFrame src={img.url} alt={`${space.title}, foto ${i + 2}`} ratio="aspect-[4/3]" className="rounded-2xl border border-[var(--mv-hairline)]" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <section aria-labelledby="ad-about" className="flex flex-col gap-4">
              <h2 id="ad-about" className="mv-h3">Sobre este espacio</h2>
              <p className="mv-body max-w-3xl whitespace-pre-wrap text-base">{space.description}</p>
            </section>

            <section aria-labelledby="ad-specs" className="flex flex-col gap-5">
              <h2 id="ad-specs" className="mv-h3">Ficha técnica</h2>
              <dl className="mv-panel grid gap-6 p-6 sm:grid-cols-2 md:p-7 xl:grid-cols-3">
                <Spec icon={Maximize} label="Medidas" data value={`${space.width} × ${space.height} ${String(space.unit || "").toLowerCase()}`} />
                <Spec icon={Compass} label="Orientación" value={space.orientation || "Sin especificar"} />
                <Spec icon={Hammer} label="Soporte / material" value={space.material || "Sin especificar"} />
                <Spec icon={Clock} label="Contrato mínimo" value={`${months} ${months > 1 ? "meses" : "mes"}`} />
                <Spec icon={Lightbulb} label="Iluminación" value={space.hasLighting ? "Sí" : "No"} />
                {space.trafficEstimate ? (
                  <Spec icon={Eye} label="Tránsito estimado" data value={`${Number(space.trafficEstimate).toLocaleString("es")} / mes`} />
                ) : null}
              </dl>
            </section>

            <section aria-labelledby="ad-availability" className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 id="ad-availability" className="mv-h3">Disponibilidad</h2>
                <p className="text-sm text-[var(--text-secondary)]">Los días tachados ya están reservados. Elegí inicio y fin para ver el rango.</p>
              </div>
              <BookingCalendar 
                occupiedDates={space.reservations.map((r: any) => ({ start: r.startDate, end: r.endDate }))} 
              />
            </section>
          </div>

          {/* Price + owner */}
          <aside aria-label="Reserva" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <div className="mv-panel flex flex-col gap-6 border-[var(--color-border-gold)] p-6 md:p-7">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-[var(--text-secondary)]">Tarifa mensual</p>
                <p className="flex items-baseline gap-2">
                  <span className="mv-data text-[2rem] font-semibold leading-none tracking-tight text-[var(--text-primary)]">{monthly ?? "A consultar"}</span>
                  {monthly ? <span className="text-sm text-[var(--text-secondary)]">/ mes</span> : null}
                </p>
                {weekly || daily ? (
                  <p className="mv-data mt-1 text-xs text-[var(--text-tertiary)]">
                    {[weekly && `${weekly} / semana`, daily && `${daily} / día`].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>

              {!isOwner ? (
                <div className="flex flex-col gap-3">
                  <ButtonLink href={`/checkout/anuncio/${space.id}`} size="lg" className="w-full">
                    Reservar
                  </ButtonLink>
                  <ButtonLink href={`/mensajes?to=${space.ownerId}`} tone="secondary" className="w-full">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Consultar disponibilidad
                  </ButtonLink>
                  <SaveButton itemId={space.id} type="space" initialSaved={false} />
                </div>
              ) : (
                <ButtonLink href="/anuncios/mis-espacios" tone="secondary" className="w-full">
                  Gestionar mis espacios
                </ButtonLink>
              )}

              <p className="flex items-start gap-2.5 border-t border-[var(--mv-hairline)] pt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>
                  El pago se procesa con Stripe.
                  {space.isFirstRentalFree ? " Tu primer alquiler en Mercav Ads no paga comisión de plataforma." : ""}
                </span>
              </p>
            </div>

            <div className="mv-panel flex flex-col gap-4 p-6">
              <p className="text-sm text-[var(--text-secondary)]">Publicado por</p>
              <div className="flex items-center gap-3">
                {space.owner?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={space.owner.avatar} alt="" loading="lazy" decoding="async" className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <span aria-hidden className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--mv-panel-hover)] font-semibold text-[var(--text-secondary)]">
                    {(space.owner?.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-[var(--text-primary)]">
                    {space.owner?.name}
                    {space.owner?.isVerified ? (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-gold" aria-label="Cuenta verificada" />
                    ) : null}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Dueño del espacio</p>
                </div>
              </div>
              <Link href={`/perfil/${space.ownerId}`} className="mv-link w-fit text-sm">
                Ver perfil
              </Link>
            </div>
          </aside>
        </div>
      </Container>

      <MobileActionBar label="Reservar este espacio">
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-[var(--text-secondary)]">Por mes</span>
          <span className="mv-data truncate font-semibold text-[var(--text-primary)]">{monthly ?? "A consultar"}</span>
        </p>
        {isOwner ? (
          <ButtonLink href={`/anuncios/editar/${space.id}`} size="md">
            Editar
          </ButtonLink>
        ) : (
          <ButtonLink href={`/checkout/anuncio/${space.id}`} size="md">
            Reservar
          </ButtonLink>
        )}
      </MobileActionBar>
    </div>
  );
}
// creado por pato dev y askforvini
