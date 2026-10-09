import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, ExternalLink } from "@/components/icons";
import { ButtonLink, Container, PageHero, Section, buttonClass } from "@/components/site/primitives";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      services: {
        include: {
          orders: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true
                }
              }
            }
          }
        }
      },
      spaces: {
        include: {
          reservations: {
            include: {
              advertiser: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) redirect('/login');

  // Combine and format orders and reservations as "Clients"
  const serviceClients = user.services.flatMap(service => 
    service.orders.map(order => ({
      id: order.id,
      clientName: order.client.name,
      clientAvatar: order.client.avatar,
      clientEmail: order.client.email,
      clientId: order.client.id,
      itemName: service.title,
      type: 'Servicio',
      price: order.totalPrice,
      status: order.status,
      date: order.createdAt
    }))
  );

  const adClients = user.spaces.flatMap(space => 
    space.reservations.map(res => ({
      id: res.id,
      clientName: res.advertiser.name,
      clientAvatar: res.advertiser.avatar,
      clientEmail: res.advertiser.email,
      clientId: res.advertiser.id,
      itemName: space.title,
      type: 'Anuncio',
      price: res.totalPrice,
      status: res.status,
      date: res.createdAt
    }))
  );

  const allClients = [...serviceClients, ...adClients].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const statusLabel: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    ACTIVE: "Activa",
    IN_PROGRESS: "En curso",
    IN_REVIEW: "En revisión",
    REVISION: "Con cambios",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    DISPUTED: "En disputa",
  };
  const statusTone = (status: string) =>
    status === "COMPLETED" || status === "CONFIRMED"
      ? "border-green-500/25 bg-green-500/10 text-green-400"
      : status === "PENDING"
        ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-400"
        : status === "CANCELLED" || status === "DISPUTED"
          ? "border-red-500/25 bg-red-500/10 text-red-400"
          : "mv-chip-gold";
  const manageHref = (client: (typeof allClients)[number]) =>
    client.type === "Servicio" ? `/dashboard/pedidos/${client.id}` : `/dashboard/pedidos?tab=sales`;
  const avatarSrc = (client: (typeof allClients)[number]) =>
    client.clientAvatar || `https://ui-avatars.com/api/?name=${client.clientName}&background=random`;

  return (
    <div className="w-full min-h-screen bg-bg-primary">
      <PageHero
        kicker={
          <>
            <Link href="/dashboard" className="-my-2 rounded py-2 hover:underline mv-focus">Panel</Link>
            <span aria-hidden>/</span>
            <span>Clientes</span>
          </>
        }
        title="Tus clientes"
        lead="Los pedidos de tus servicios y las reservas de tus espacios, ordenados del más reciente al más antiguo."
      />

      <Section tight labelledBy="clientes-lista" className="pt-0 md:pt-0">
        <Container>
          <h2 id="clientes-lista" className="sr-only">Listado de clientes</h2>
          {allClients.length === 0 ? (
            <div className="mv-panel flex flex-col items-start gap-4 p-8 md:p-12">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mv-h3">Todavía no tenés clientes</h3>
              <p className="mv-body max-w-lg">
                Cuando alguien contrate uno de tus servicios o reserve uno de tus espacios, lo vas a ver acá con el estado y el monto.
              </p>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <ButtonLink href="/dashboard/crear" className="w-full sm:w-auto">Publicar un servicio o espacio</ButtonLink>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                <span className="mv-data text-[var(--text-primary)]">{allClients.length}</span> {allClients.length === 1 ? "registro" : "registros"}
              </p>

              {/* Desktop: tabla */}
              <div className="mv-panel hidden overflow-hidden lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--mv-hairline)] text-[var(--text-secondary)]">
                      <th scope="col" className="px-6 py-4 font-medium">Cliente</th>
                      <th scope="col" className="px-4 py-4 font-medium">Publicación</th>
                      <th scope="col" className="px-4 py-4 font-medium">Estado</th>
                      <th scope="col" className="px-4 py-4 font-medium">Fecha</th>
                      <th scope="col" className="px-4 py-4 text-right font-medium">Monto</th>
                      <th scope="col" className="px-6 py-4 text-right font-medium"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--mv-hairline)]">
                    {allClients.map((client) => (
                      <tr key={client.id} className="transition-colors duration-200 hover:bg-[var(--mv-panel-hover)]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={avatarSrc(client)} alt="" width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-full border border-[var(--mv-hairline)] object-cover" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--text-primary)]">{client.clientName}</p>
                              <p className="truncate text-xs text-[var(--text-tertiary)]">{client.clientEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[16rem] px-4 py-4">
                          <p className="truncate text-[var(--text-primary)]">{client.itemName}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{client.type}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`mv-chip ${statusTone(client.status)}`}>{statusLabel[client.status] || client.status}</span>
                        </td>
                        <td className="mv-data whitespace-nowrap px-4 py-4 text-[var(--text-secondary)]">{new Date(client.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                        <td className="mv-data whitespace-nowrap px-4 py-4 text-right font-medium text-[var(--text-primary)]">{`$${client.price}`}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/perfil/${client.clientId}`}
                              aria-label={`Ver perfil de ${client.clientName}`}
                              className={buttonClass("ghost", "sm", "w-10 px-0")}
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden />
                            </Link>
                            <ButtonLink href={manageHref(client)} tone="secondary" size="sm">Gestionar</ButtonLink>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Móvil: cards */}
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
                {allClients.map((client) => (
                  <li key={client.id} className="mv-panel flex flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <img src={avatarSrc(client)} alt="" width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-full border border-[var(--mv-hairline)] object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--text-primary)]">{client.clientName}</p>
                          <p className="truncate text-xs text-[var(--text-tertiary)]">{client.clientEmail}</p>
                        </div>
                      </div>
                      <span className={`mv-chip shrink-0 ${statusTone(client.status)}`}>{statusLabel[client.status] || client.status}</span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">{client.type}</p>
                      <p className="text-[var(--text-primary)]">{client.itemName}</p>
                    </div>
                    <dl className="grid grid-cols-3 gap-3 border-t border-[var(--mv-hairline)] pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)]">Monto</dt>
                        <dd className="mv-data font-medium text-[var(--text-primary)]">{`$${client.price}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)]">Fecha</dt>
                        <dd className="mv-data text-[var(--text-primary)]">{new Date(client.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-secondary)]">ID</dt>
                        <dd className="mv-data text-[var(--text-primary)]">{client.id.slice(0, 8)}</dd>
                      </div>
                    </dl>
                    <div className="grid grid-cols-2 gap-2">
                      <ButtonLink href={`/perfil/${client.clientId}`} tone="ghost" size="sm" className="w-full">Ver perfil</ButtonLink>
                      <ButtonLink href={manageHref(client)} tone="secondary" size="sm" className="w-full">Gestionar</ButtonLink>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </Section>
    </div>
  );
}
// creado por pato dev y askforvini
