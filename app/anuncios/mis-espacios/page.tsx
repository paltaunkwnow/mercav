"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Search, MapPin, CalendarDays } from "@/components/icons";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Container, PageHero, ButtonLink } from "@/components/site/primitives";
import { EmptyState, ManageItem, MediaFrame, PageLoading, SPACE_TYPE_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";

export default function MisEspaciosPage() {
  const { data: session } = useSession();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: "" });

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch("/api/user/spaces");
        const data = await res.json();
        if (data.success) {
          setSpaces(data.data);
        }
      } catch (error) {
        console.error("Error fetching spaces:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const handleDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;
    
    try {
      const res = await fetch(`/api/spaces/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSpaces(spaces.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };

  const filteredSpaces = spaces.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <PageLoading label="Cargando tus espacios…" />;
  }

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Publicidad"
        title="Mis espacios"
        lead="Administrá tus vallas, pantallas y vidrieras: editá la ficha, revisá cómo se ven o dalos de baja."
        actions={
          <>
            <ButtonLink href="/anuncios/publicar" size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" aria-hidden />
              Publicar un espacio
            </ButtonLink>
            <ButtonLink href="/dashboard" tone="ghost" size="lg" className="w-full sm:w-auto">
              Ir al panel
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Listado de espacios" className="pb-14 md:pb-24">
        <Container>
          {spaces.length > 0 ? (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block sm:w-96">
                <span className="sr-only">Buscar por título o ciudad</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                <input
                  type="search"
                  placeholder="Buscar por título o ciudad…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mv-input pl-11"
                />
              </label>
              <p className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                <span className="mv-data font-semibold text-[var(--text-primary)]">{filteredSpaces.length}</span> de{" "}
                <span className="mv-data">{spaces.length}</span> espacios
              </p>
            </div>
          ) : null}

          {filteredSpaces.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {filteredSpaces.map((space) => (
                <ManageItem
                  key={space.id}
                  media={<MediaFrame src={space.images?.[0]?.url} alt="" icon={Megaphone} emptyLabel="Sin foto" />}
                  title={space.title}
                  viewHref={`/anuncios/${space.id}`}
                  editHref={`/anuncios/editar/${space.id}`}
                  onDelete={() => setDeleteModal({ isOpen: true, id: space.id })}
                  active={!!space.isActive}
                  activeLabel="Disponible"
                  inactiveLabel="Pausado"
                  badge={<span className="mv-chip">{labelFor(SPACE_TYPE_LABEL, space.type)}</span>}
                  meta={[
                    <>
                      <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden /> {[space.city, space.country].filter(Boolean).join(", ")}
                    </>,
                    <span key="p" className="mv-data font-semibold text-[var(--text-primary)]">
                      {formatMoney(space.pricePerMonth, space.currency) ?? "Sin precio"} / mes
                    </span>,
                    <>
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Publicado el{" "}
                      <span className="mv-data">{new Date(space.createdAt).toLocaleDateString("es")}</span>
                    </>,
                  ]}
                />
              ))}
            </ul>
          ) : spaces.length > 0 ? (
            <EmptyState icon={Search} title="Ningún espacio coincide" body="Probá con otro título o ciudad." />
          ) : (
            <EmptyState
              icon={Megaphone}
              title="Todavía no publicaste espacios"
              body="Registrá tus vallas, letreros o vidrieras para que las marcas puedan reservarlos. Tu primer alquiler no paga comisión de plataforma."
              action={
                <ButtonLink href="/anuncios/publicar" className="w-full sm:w-auto">
                  Publicar mi primer espacio
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
        title="¿Eliminar este espacio?"
        message="Se borra de Mercav de forma permanente, junto con sus reservas asociadas. No se puede deshacer."
        confirmText="Eliminar espacio"
        variant="danger"
      />
    </div>
  );
}
// creado por pato dev y askforvini
