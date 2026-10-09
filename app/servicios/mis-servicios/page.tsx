"use client";

import { useState, useEffect } from "react";
import { MonitorPlay, Plus, Search, Clock } from "@/components/icons";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Container, PageHero, ButtonLink } from "@/components/site/primitives";
import { EmptyState, ManageItem, MediaFrame, PageLoading, SERVICE_CATEGORY_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";

export default function MisServiciosPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: "" });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/user/services");
        const data = await res.json();
        if (data.success) {
          setServices(data.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;
    
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices(services.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <PageLoading label="Cargando tus servicios…" />;
  }

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Servicios"
        title="Mis servicios"
        lead="Tus ofertas publicadas: editá la propuesta, revisá cómo se ven o dalas de baja."
        actions={
          <>
            <ButtonLink href="/servicios/publicar" size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" aria-hidden />
              Ofrecer un servicio
            </ButtonLink>
            <ButtonLink href="/dashboard" tone="ghost" size="lg" className="w-full sm:w-auto">
              Ir al panel
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Listado de servicios" className="pb-14 md:pb-24">
        <Container>
          {services.length > 0 ? (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block sm:w-96">
                <span className="sr-only">Buscar entre mis servicios</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                <input
                  type="search"
                  placeholder="Buscar por título o categoría…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mv-input pl-11"
                />
              </label>
              <p className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                <span className="mv-data font-semibold text-[var(--text-primary)]">{filteredServices.length}</span> de{" "}
                <span className="mv-data">{services.length}</span> servicios
              </p>
            </div>
          ) : null}

          {filteredServices.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {filteredServices.map((service) => (
                <ManageItem
                  key={service.id}
                  media={<MediaFrame src={service.images?.[0]?.url} alt="" icon={MonitorPlay} emptyLabel="Sin imagen" />}
                  title={service.title}
                  viewHref={`/servicios/${service.id}`}
                  editHref={`/servicios/editar/${service.id}`}
                  onDelete={() => setDeleteModal({ isOpen: true, id: service.id })}
                  active={!!service.isActive}
                  activeLabel="Activo"
                  inactiveLabel="Pausado"
                  badge={<span className="mv-chip">{labelFor(SERVICE_CATEGORY_LABEL, service.category)}</span>}
                  meta={[
                    <span key="p" className="mv-data font-semibold text-[var(--text-primary)]">
                      {formatMoney(service.packages?.[0]?.price) ? `Desde ${formatMoney(service.packages?.[0]?.price)}` : "Sin paquete"}
                    </span>,
                    <>
                      <Clock className="h-3.5 w-3.5" aria-hidden /> Actualizado el{" "}
                      <span className="mv-data">{new Date(service.updatedAt).toLocaleDateString("es")}</span>
                    </>,
                  ]}
                />
              ))}
            </ul>
          ) : services.length > 0 ? (
            <EmptyState icon={Search} title="Ningún servicio coincide" body="Probá con otro título o categoría." />
          ) : (
            <EmptyState
              icon={MonitorPlay}
              title="Todavía no publicaste servicios"
              body="Armá tu primer paquete con precio, plazo y revisiones. Cobrás por hitos, con el pago en custodia hasta cada entrega."
              action={
                <ButtonLink href="/servicios/publicar" className="w-full sm:w-auto">
                  Publicar mi primer servicio
                </ButtonLink>
              }
            />
          )}
        </Container>
      </section>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDelete}
        title="¿Eliminar este servicio?"
        message="Se borra tu oferta de forma permanente, junto con su información. No se puede deshacer."
        confirmText="Eliminar servicio"
        variant="danger"
      />
    </div>
  );
}
// creado por pato dev y askforvini
