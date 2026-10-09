"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, FileText, Calendar, Mail, MessageSquare, Loader2 } from "@/components/icons";
import { ButtonLink, Container, PageHero, Section, buttonClass } from "@/components/site/primitives";
import { Toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

// Estados válidos del enum ApplicationStatus que la empresa puede asignar.
// RECIBIDO es el estado inicial y no se vuelve a elegir.
const SETTABLE_STATUSES = ["EN_REVISION", "ENTREVISTA", "OFERTA", "CONTRATADO", "DESCARTADO"];

export default function PostulantesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/postulantes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplications(data.data);
        }
        setLoading(false);
      });
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!SETTABLE_STATUSES.includes(newStatus)) return;
    setActionLoading(id + 'status');
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
        setToast({ visible: true, message: `Estado actualizado: ${statusLabels[newStatus] || newStatus}`, type: "success" });
      } else {
        setToast({ visible: true, message: data.error || "Error al actualizar", type: "error" });
      }
    } catch (err) {
      setToast({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleContact = async (userId: string, appId: string) => {
    setActionLoading(appId + 'contact');
    try {
      const res = await fetch('/api/messages/contact', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, context: "JOB_APPLICATION", contextId: appId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/mensajes?convId=${data.conversationId}`);
      } else {
        setToast({ visible: true, message: data.error || "Error al iniciar chat", type: "error" });
      }
    } catch (err) {
      setToast({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const statusLabels: Record<string, string> = {
    RECIBIDO: "Recibido",
    EN_REVISION: "En revisión",
    ENTREVISTA: "Entrevista",
    OFERTA: "Oferta",
    CONTRATADO: "Contratado",
    DESCARTADO: "Descartado",
  };
  const statusTone = (status: string) =>
    status === 'RECIBIDO' ? 'mv-chip-gold' :
    status === 'CONTRATADO' ? 'border-green-500/25 bg-green-500/10 text-green-400' :
    status === 'DESCARTADO' ? 'border-red-500/25 bg-red-500/10 text-red-400' :
    'border-yellow-500/25 bg-yellow-500/10 text-yellow-400';

  const hero = (
    <PageHero
      kicker={
        <>
          <Link href="/dashboard" className="-my-2 rounded py-2 hover:underline mv-focus">Panel</Link>
          <span aria-hidden>/</span>
          <span>Postulantes</span>
        </>
      }
      title="Postulantes"
      lead="Las personas que se postularon a tus vacantes. Revisá su carta, contactalas o actualizá el estado de cada postulación."
    />
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-bg-primary">
        {hero}
        <Section tight className="pt-0 md:pt-0">
          <Container>
            <div role="status" className="flex flex-col gap-3">
              <span className="sr-only">Cargando postulantes…</span>
              {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden className="mv-panel h-40 animate-pulse motion-reduce:animate-none" />
              ))}
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-bg-primary">
      {hero}

      <Section tight labelledBy="postulantes-lista" className="pt-0 md:pt-0">
        <Container>
          <h2 id="postulantes-lista" className="sr-only">Listado de postulantes</h2>

          {applications.length === 0 ? (
            <div className="mv-panel flex flex-col items-start gap-4 p-8 md:p-12">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                <User className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mv-h3">Todavía no hay postulantes</h3>
              <p className="mv-body max-w-lg">
                Cuando alguien se postule a una de tus vacantes, vas a ver acá su perfil, su carta de presentación y el estado de la postulación.
              </p>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <ButtonLink href="/dashboard/crear" className="w-full sm:w-auto">Publicar una vacante</ButtonLink>
                <ButtonLink href="/empleos/mis-empleos" tone="secondary" className="w-full sm:w-auto">Ver mis vacantes</ButtonLink>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                <span className="mv-data text-[var(--text-primary)]">{applications.length}</span> {applications.length === 1 ? "postulación" : "postulaciones"}
              </p>
              <ul className="flex flex-col gap-3">
                {applications.map((app) => (
                  <li key={app.id} className="mv-panel p-5 md:p-6">
                    <article aria-labelledby={`app-${app.id}`}>
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <img
                            src={app.applicant.avatar || `https://ui-avatars.com/api/?name=${app.applicant.name}&background=random`}
                            alt=""
                            width={48}
                            height={48}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 shrink-0 rounded-2xl border border-[var(--mv-hairline)] object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 id={`app-${app.id}`} className="text-lg font-semibold text-[var(--text-primary)]">{app.applicant.name}</h3>
                              <span className={`mv-chip ${statusTone(app.status)}`}>{statusLabels[app.status] || app.status}</span>
                            </div>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              Para <span className="font-medium text-[var(--text-primary)]">{app.jobTitle}</span>
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                              <a href={`mailto:${app.applicant.email}`} className="inline-flex min-w-0 items-center gap-1.5 break-all rounded hover:text-[var(--text-primary)] mv-focus">
                                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden /> {app.applicant.email}
                              </a>
                              <span className="mv-data inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" aria-hidden /> {new Date(app.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
                          <ButtonLink href={`/perfil/${app.applicant.id}`} tone="secondary" size="sm" className="w-full md:w-auto">
                            Ver perfil
                          </ButtonLink>
                          <button
                            type="button"
                            onClick={() => handleContact(app.applicant.id, app.id)}
                            disabled={actionLoading === app.id + 'contact'}
                            aria-busy={actionLoading === app.id + 'contact'}
                            className={buttonClass("primary", "sm", "w-full md:w-auto")}
                          >
                            {actionLoading === app.id + 'contact' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageSquare className="h-4 w-4" aria-hidden />}
                            Contactar
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-[var(--mv-hairline)] pt-5">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                          <FileText className="h-4 w-4 text-gold" aria-hidden /> Carta de presentación
                        </h4>
                        <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${app.coverLetter ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                          {app.coverLetter || 'El candidato no incluyó una carta de presentación.'}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--mv-hairline)] pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <label htmlFor={`app-status-${app.id}`} className="text-sm text-[var(--text-secondary)]">
                          Etapa del proceso
                        </label>
                        <div className="flex items-center gap-2 sm:w-64">
                          <select
                            id={`app-status-${app.id}`}
                            value={app.status}
                            disabled={actionLoading !== null}
                            aria-busy={actionLoading === app.id + 'status'}
                            onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                            className="mv-input min-h-11 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {app.status === 'RECIBIDO' && (
                              <option value="RECIBIDO" disabled>Recibido (sin revisar)</option>
                            )}
                            {SETTABLE_STATUSES.map((s) => (
                              <option key={s} value={s}>{statusLabels[s]}</option>
                            ))}
                          </select>
                          {actionLoading === app.id + 'status' && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" aria-hidden />
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </Section>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
}
// creado por pato dev y askforvini
