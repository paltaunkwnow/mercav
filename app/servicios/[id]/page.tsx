import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Clock, RotateCcw, Check, Lock, MessageSquare, MonitorPlay, BadgeCheck, Crown, CalendarDays, CheckCheck, Pencil } from "@/components/icons";
import { SaveButton } from "@/components/ui/SaveButton";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { ReportButton } from "@/components/ui/ReportButton";
import { Container, ButtonLink } from "@/components/site/primitives";
import { BackLink, MediaFrame, Spec, SERVICE_CATEGORY_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";
import { MobileActionBar } from "@/components/anuncios/MobileActionBar";

function formatCategory(cat: string) {
  if (!cat) return "Profesional";
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default async function ServicioDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let service: any = null;
  
  try {
    service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        provider: { 
          include: { 
            roles: { select: { role: true } }
          } 
        },
        packages: true,
        reviews: true,
        images: { orderBy: { order: 'asc' } }
      }
    });
  } catch (e) {
    console.error(e);
  }

  if (!service) {
    notFound();
  }

  // Fetch completed orders separately to avoid schema relation issues
  const completedOrdersCount = await prisma.serviceOrder.count({
    where: {
      service: { providerId: service.provider?.id },
      status: 'COMPLETED'
    }
  });

  const isOwner = session?.user?.email === service.provider?.email || (session?.user as any)?.id === service.providerId;

  const mainPackage = service.packages?.[0] || { 
    name: "Plan Estándar",
    price: 0, 
    deliveryDays: service.deliveryDays || 5, 
    revisions: service.revisions || 3,
    description: "Servicio completo según la descripción especificada.",
    features: []
  };

  const hasPackage = (service.packages?.length || 0) > 0;
  const price = hasPackage ? formatMoney(mainPackage.price) : null;
  const ratings: number[] = (service.reviews || []).map((r: any) => r.rating).filter((r: any) => typeof r === "number");
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const isFounder = service.provider?.roles?.some((r: any) => r.role === 'ADMIN') || service.provider?.username === 'ice';
  const images: { url: string }[] = service.images || [];
  const reviewsWithText = (service.reviews || []).filter((r: any) => r.comment).slice(0, 6);
  const providerName = service.provider?.name || "Profesional";

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink href="/servicios">Volver a Mercav Services</BackLink>
          {isOwner ? (
            <ButtonLink href={`/servicios/editar/${service.id}`} tone="secondary" size="sm">
              <Pencil className="h-4 w-4" aria-hidden />
              Editar servicio
            </ButtonLink>
          ) : (
            <ReportButton targetId={service.id} targetType="SERVICE" />
          )}
        </div>

        <header className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="mv-chip">{labelFor(SERVICE_CATEGORY_LABEL, service.category) || formatCategory(service.category)}</span>
            {service.subcategory ? <span className="mv-chip">{service.subcategory}</span> : null}
          </div>
          <h1 className="mv-h2 max-w-4xl">{service.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
            <Link href={`/perfil/${service.provider?.id || ''}`} className="mv-focus flex items-center gap-2 rounded-full pr-2 font-medium text-[var(--text-primary)] hover:text-gold">
              {service.provider?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={service.provider.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-[var(--mv-panel-hover)] text-xs font-semibold">
                  {providerName.charAt(0).toUpperCase()}
                </span>
              )}
              {providerName}
              {service.provider?.isVerified ? <BadgeCheck className="h-4 w-4 text-gold" aria-label="Cuenta verificada" /> : null}
            </Link>
            {avg !== null ? (
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
                <span className="mv-data font-semibold text-[var(--text-primary)]">{avg.toFixed(1)}</span>
                <span>
                  ({ratings.length} {ratings.length === 1 ? "reseña" : "reseñas"})
                </span>
              </span>
            ) : (
              <span>Sin reseñas todavía</span>
            )}
          </div>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-12">
            <div className="flex flex-col gap-3">
              <MediaFrame
                src={images[0]?.url}
                alt={service.title}
                ratio="aspect-[16/10]"
                icon={MonitorPlay}
                emptyLabel="Este servicio todavía no tiene imágenes"
                priority
                className="rounded-[1.75rem] border border-[var(--mv-hairline)]"
              />
              {images.length > 1 ? (
                <ul className="grid grid-cols-4 gap-3" aria-label="Más imágenes">
                  {images.slice(1, 5).map((img, i) => (
                    <li key={img.url + i}>
                      <MediaFrame src={img.url} alt={`${service.title}, imagen ${i + 2}`} ratio="aspect-[4/3]" className="rounded-2xl border border-[var(--mv-hairline)]" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <section aria-labelledby="svc-about" className="flex flex-col gap-4">
              <h2 id="svc-about" className="mv-h3">Sobre el servicio</h2>
              <p className="mv-body max-w-3xl whitespace-pre-wrap text-base">{service.description}</p>
            </section>

            {service.packages?.length > 1 ? (
              <section aria-labelledby="svc-packages" className="flex flex-col gap-5">
                <h2 id="svc-packages" className="mv-h3">Paquetes</h2>
                <ul className="grid gap-4 md:grid-cols-2">
                  {service.packages.map((p: any) => (
                    <li key={p.id} className="mv-panel flex flex-col gap-4 p-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">{p.name}</h3>
                        <span className="mv-data font-semibold text-[var(--text-primary)]">{formatMoney(p.price) ?? "A consultar"}</span>
                      </div>
                      {p.description ? <p className="text-sm text-[var(--text-secondary)]">{p.description}</p> : null}
                      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> <span className="mv-data">{p.deliveryDays}</span> días</span>
                        <span className="flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> <span className="mv-data">{p.revisions}</span> revisiones</span>
                      </p>
                      {p.features?.length ? (
                        <ul className="flex flex-col gap-2 border-t border-[var(--mv-hairline)] pt-4 text-sm text-[var(--text-secondary)]">
                          {p.features.map((f: string) => (
                            <li key={f} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                              {f}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="svc-provider" className="flex flex-col gap-5">
              <h2 id="svc-provider" className="mv-h3">Sobre el profesional</h2>
              <div className="mv-panel flex flex-col gap-6 p-6 md:flex-row md:items-start md:p-7">
                {service.provider?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.provider.avatar} alt="" loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-[1.5rem] object-cover" />
                ) : (
                  <span aria-hidden className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] bg-[var(--mv-panel-hover)] font-display text-2xl font-semibold text-[var(--text-secondary)]">
                    {providerName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">{providerName}</p>
                    {isFounder ? (
                      <span className="mv-chip mv-chip-gold">
                        <Crown className="h-3.5 w-3.5" aria-hidden /> CEO
                      </span>
                    ) : null}
                  </div>
                  {service.provider?.bio ? <p className="mv-body">{service.provider.bio}</p> : null}
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {service.provider?.createdAt ? (
                      <Spec
                        icon={CalendarDays}
                        label="En Mercav desde"
                        value={new Date(service.provider.createdAt).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                      />
                    ) : null}
                    <Spec icon={CheckCheck} label="Pedidos completados" data value={completedOrdersCount} />
                  </dl>
                  {!isOwner ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <ButtonLink href={`/perfil/${service.provider?.id || ''}`} tone="secondary" size="sm">
                        Ver perfil
                      </ButtonLink>
                      <ButtonLink href={`/mensajes?to=${service.providerId}`} tone="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" aria-hidden />
                        Enviar mensaje
                      </ButtonLink>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section aria-labelledby="svc-reviews" className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <h2 id="svc-reviews" className="mv-h3">Reseñas</h2>
                {avg !== null ? (
                  <p className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
                    <span className="mv-data font-semibold text-[var(--text-primary)]">{avg.toFixed(1)}</span> de 5
                  </p>
                ) : null}
              </div>
              {reviewsWithText.length > 0 ? (
                <ul className="grid gap-4 md:grid-cols-2">
                  {reviewsWithText.map((r: any) => (
                    <li key={r.id} className="mv-panel flex flex-col gap-3 p-5">
                      <p className="flex items-center gap-0.5" aria-label={`${r.rating} de 5 estrellas`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={i < r.rating ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4 text-[var(--text-tertiary)]"} aria-hidden />
                        ))}
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{r.comment}</p>
                      <p className="mv-data text-xs text-[var(--text-tertiary)]">{new Date(r.createdAt).toLocaleDateString('es')}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-[1.5rem] border border-dashed border-[var(--mv-hairline-strong)] p-6 text-sm text-[var(--text-secondary)]">
                  {ratings.length > 0
                    ? "Las calificaciones de este servicio no incluyen comentarios."
                    : "Todavía no hay reseñas. Se publican cuando un cliente completa un pedido."}
                </p>
              )}
            </section>
          </div>

          <aside aria-label="Contratar" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <div className="mv-panel flex flex-col gap-6 border-[var(--color-border-gold)] p-6 md:p-7">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-[var(--text-secondary)]">{hasPackage ? mainPackage.name : "Precio"}</p>
                <p className="mv-data text-[2rem] font-semibold leading-none tracking-tight text-[var(--text-primary)]">{price ?? "A consultar"}</p>
                {hasPackage && mainPackage.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{mainPackage.description}</p>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-4 border-y border-[var(--mv-hairline)] py-5">
                <Spec icon={Clock} label="Entrega" value={`${mainPackage.deliveryDays} días`} />
                <Spec icon={RotateCcw} label="Revisiones" value={mainPackage.revisions} />
              </dl>

              {!isOwner ? (
                <div className="flex flex-col gap-3">
                  <ButtonLink href={`/checkout/servicio/${service.id}`} size="lg" className="w-full">
                    Contratar
                  </ButtonLink>
                  <ButtonLink href={`/mensajes?to=${service.providerId}`} tone="secondary" className="w-full">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Hacer una consulta
                  </ButtonLink>
                  <SaveButton itemId={service.id} type="service" initialSaved={false} />
                </div>
              ) : (
                <ButtonLink href={`/servicios/editar/${service.id}`} tone="secondary" className="w-full">
                  Editar mi servicio
                </ButtonLink>
              )}

              <p className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                Pagás con Stripe. El pago queda en custodia y se libera por hitos, cuando aprobás cada entrega.
              </p>
            </div>
          </aside>
        </div>
      </Container>

      <MobileActionBar label="Contratar este servicio">
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-[var(--text-secondary)]">Desde</span>
          <span className="mv-data truncate font-semibold text-[var(--text-primary)]">{price ?? "A consultar"}</span>
        </p>
        {isOwner ? (
          <ButtonLink href={`/servicios/editar/${service.id}`}>Editar</ButtonLink>
        ) : (
          <ButtonLink href={`/checkout/servicio/${service.id}`}>Contratar</ButtonLink>
        )}
      </MobileActionBar>
    </div>
  );
}
// creado por pato dev y askforvini
