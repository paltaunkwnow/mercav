"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ExternalLink,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  Eye
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

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
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <Button variant="ghost" asChild className="text-gray-500 hover:text-white -ml-4 mb-4">
              <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard</Link>
            </Button>
            <h1 className="text-4xl font-display font-black text-white tracking-tighter">Gestión de <span className="text-blue-400">Vacantes</span></h1>
            <p className="text-gray-500 mt-2">Publica ofertas laborales y gestiona tus procesos de selección.</p>
          </div>
          <Button asChild className="bg-blue-500 text-white hover:bg-blue-400 rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
            <Link href="/empleos/publicar"><Plus className="w-5 h-5 mr-2" /> Publicar Vacante</Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por cargo o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <Button variant="outline" className="h-14 px-6 border-border rounded-2xl text-gray-400 hover:text-white">
            <Filter className="w-5 h-5 mr-2" /> Filtros
          </Button>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-bg-secondary border border-border p-8 rounded-[2.5rem] hover:border-blue-400/20 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Icon/Logo Placeholder */}
                    <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Briefcase className="text-blue-400 w-10 h-10" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">
                          {job.employmentType.replace('_', ' ')}
                        </span>
                        {job.isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <CheckCircle size={12} /> Abierta
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <AlertCircle size={12} /> Cerrada
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-blue-400 transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-400" /> {job.city}, {job.country}</span>
                        <span className="flex items-center gap-1.5"><Users size={12} className="text-gold" /> {job._count.applications} Postulantes</span>
                        <span className="flex items-center gap-1.5"><Eye size={12} /> {job.viewCount} vistas</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" asChild className="h-12 px-6 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/5">
                        <Link href={`/dashboard/postulantes?jobId=${job.id}`}><Users size={16} className="mr-2" /> Candidatos</Link>
                      </Button>
                      <Button variant="ghost" asChild className="w-12 h-12 rounded-xl p-0 text-gray-500 hover:text-white hover:bg-white/5">
                        <Link href={`/empleos/${job.id}`} target="_blank"><ExternalLink size={18} /></Link>
                      </Button>
                      <Button variant="ghost" asChild className="w-12 h-12 rounded-xl p-0 text-gray-500 hover:text-white hover:bg-white/5">
                        <Link href={`/empleos/editar/${job.id}`}><Edit3 size={18} /></Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setDeleteModal({ isOpen: true, id: job.id })}
                        className="w-12 h-12 rounded-xl p-0 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-32 bg-bg-secondary border border-border border-dashed rounded-[3rem]">
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="text-gray-700 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No tienes vacantes publicadas</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">Encuentra el talento ideal para tu equipo publicando tu primera oferta de empleo.</p>
                <Button asChild className="bg-blue-500 text-white hover:bg-blue-400 rounded-2xl h-12 px-8 font-black uppercase tracking-widest">
                  <Link href="/empleos/publicar">Publicar mi primera vacante</Link>
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDelete}
        title="¿Eliminar Vacante?"
        message="Esta acción eliminará permanentemente la oferta de empleo. Los postulantes ya no podrán verla ni enviar sus currículums."
        confirmText="Eliminar permanentemente"
        variant="danger"
      />
    </div>
  );
}
// creado por pato dev y askforvini
