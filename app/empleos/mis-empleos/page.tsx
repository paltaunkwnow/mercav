"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Plus, Search, MapPin, Users, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Container, PageHero, ButtonLink } from "@/components/site/primitives";
import { EmptyState, ManageItem, PageLoading, EMPLOYMENT_LABEL, labelFor } from "@/components/anuncios/market-ui";

export default function MisEmpleosPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: "" });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/user/jobs");
        const data = await res.json();
        if (data.success) {
          setJobs(data.data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;
    
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <PageLoading label="Cargando tus vacantes…" />;
  }

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Jobs"
        title="Mis vacantes"
        lead="Seguí tus búsquedas abiertas: revisá postulantes, editá la oferta o cerrala."
        actions={
          <>
            <ButtonLink href="/empleos/publicar" size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" aria-hidden />
              Publicar una vacante
            </ButtonLink>
            <ButtonLink href="/dashboard" tone="ghost" size="lg" className="w-full sm:w-auto">
              Ir al panel
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Listado de vacantes" className="pb-14 md:pb-24">
        <Container>
          {jobs.length > 0 ? (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block sm:w-96">
                <span className="sr-only">Buscar por cargo o ciudad</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                <input
                  type="search"
                  placeholder="Buscar por cargo o ciudad…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mv-input pl-11"
                />
              </label>
              <p className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                <span className="mv-data font-semibold text-[var(--text-primary)]">{filteredJobs.length}</span> de{" "}
                <span className="mv-data">{jobs.length}</span> vacantes
              </p>
            </div>
          ) : null}

          {filteredJobs.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {filteredJobs.map((job) => (
                <ManageItem
                  key={job.id}
                  media={
                    <span className="grid aspect-[4/3] place-items-center bg-[var(--mv-gold-wash)] text-gold">
                      <Briefcase className="h-6 w-6" aria-hidden />
                    </span>
                  }
                  title={job.title}
                  viewHref={`/empleos/${job.id}`}
                  editHref={`/empleos/editar/${job.id}`}
                  onDelete={() => setDeleteModal({ isOpen: true, id: job.id })}
                  active={!!job.isActive}
                  activeLabel="Abierta"
                  inactiveLabel="Cerrada"
                  badge={job.employmentType ? <span className="mv-chip">{labelFor(EMPLOYMENT_LABEL, job.employmentType)}</span> : null}
                  meta={[
                    <>
                      <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden /> {[job.city, job.country].filter(Boolean).join(", ")}
                    </>,
                    <>
                      <Users className="h-3.5 w-3.5" aria-hidden /> <span className="mv-data">{job._count?.applications ?? 0}</span> postulantes
                    </>,
                    <>
                      <Eye className="h-3.5 w-3.5" aria-hidden /> <span className="mv-data">{job.viewCount ?? 0}</span> vistas
                    </>,
                  ]}
                  extra={
                    <Link href={`/dashboard/postulantes?jobId=${job.id}`} className="mv-btn mv-btn-secondary mv-btn-sm flex-1 sm:flex-none">
                      <Users className="h-4 w-4" aria-hidden />
                      Postulantes
                    </Link>
                  }
                />
              ))}
            </ul>
          ) : jobs.length > 0 ? (
            <EmptyState icon={Search} title="Ninguna vacante coincide" body="Probá con otro cargo o ciudad." />
          ) : (
            <EmptyState
              icon={Briefcase}
              title="Todavía no publicaste vacantes"
              body="Publicá tu primera búsqueda: definís modalidad, nivel y si mostrás el salario, y recibís las postulaciones acá."
              action={
                <ButtonLink href="/empleos/publicar" className="w-full sm:w-auto">
                  Publicar mi primera vacante
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
        title="¿Eliminar esta vacante?"
        message="La oferta se borra de forma permanente. Los postulantes ya no podrán verla ni postularse."
        confirmText="Eliminar vacante"
        variant="danger"
      />
    </div>
  );
}
// creado por pato dev y askforvini
