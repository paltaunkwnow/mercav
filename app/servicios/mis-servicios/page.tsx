"use client";

import { useState, useEffect } from "react";
import { 
  MonitorPlay, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

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
            <h1 className="text-4xl font-display font-black text-white tracking-tighter">Mis Servicios <span className="text-gold">Freelance</span></h1>
            <p className="text-gray-500 mt-2">Gestiona tus ofertas de servicios y monitorea su rendimiento.</p>
          </div>
          <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-gold/20">
            <Link href="/servicios/publicar"><Plus className="w-5 h-5 mr-2" /> Crear Servicio</Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar entre mis servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <Button variant="outline" className="h-14 px-6 border-border rounded-2xl text-gray-400 hover:text-white">
            <Filter className="w-5 h-5 mr-2" /> Filtros
          </Button>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredServices.length > 0 ? (
              filteredServices.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-bg-secondary border border-border p-6 rounded-[2rem] hover:border-gold/20 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Preview Image */}
                    <div className="w-full lg:w-48 h-32 bg-bg-tertiary rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                      <img 
                        src={`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80`} 
                        className="w-full h-full object-cover" 
                        alt={service.title} 
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
                          {service.category.replace('_', ' ')}
                        </span>
                        {service.isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <CheckCircle size={12} /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <AlertCircle size={12} /> Pausado
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-gold transition-colors">{service.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> Actualizado {new Date(service.updatedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><MonitorPlay size={12} /> 2.4k vistas</span>
                        <span className="flex items-center gap-1.5 text-white"><Plus size={12} className="text-gold" /> ${service.packages?.[0]?.price || 0} inicial</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" asChild className="w-12 h-12 rounded-xl p-0 text-gray-500 hover:text-white hover:bg-white/5">
                        <Link href={`/servicios/${service.id}`} target="_blank"><ExternalLink size={18} /></Link>
                      </Button>
                      <Button variant="ghost" asChild className="w-12 h-12 rounded-xl p-0 text-gray-500 hover:text-white hover:bg-white/5">
                        <Link href={`/servicios/editar/${service.id}`}><Edit3 size={18} /></Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setDeleteModal({ isOpen: true, id: service.id })}
                        className="w-12 h-12 rounded-xl p-0 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={18} />
                      </Button>
                      <Button variant="ghost" className="w-12 h-12 rounded-xl p-0 text-gray-400">
                        <MoreVertical size={18} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-32 bg-bg-secondary border border-border border-dashed rounded-[3rem]">
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MonitorPlay className="text-gray-700 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No tienes servicios publicados</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">Comienza a ofrecer tus talentos al mercado de Bolivia publicando tu primer servicio.</p>
                <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-2xl h-12 px-8 font-black uppercase tracking-widest">
                  <Link href="/servicios/publicar">Publicar mi primer servicio</Link>
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
        title="¿Eliminar Servicio?"
        message="Esta acción eliminará permanentemente tu oferta de servicio. No podrás recuperar la información ni las estadísticas asociadas."
        confirmText="Eliminar permanentemente"
        variant="danger"
      />
    </div>
  );
}
