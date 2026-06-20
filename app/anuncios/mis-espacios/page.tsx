"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

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
            <h1 className="text-4xl font-display font-black text-white tracking-tighter">Gestión de <span className="text-emerald-400">Espacios</span></h1>
            <p className="text-gray-500 mt-2">Administra tus vallas, letreros y espacios publicitarios disponibles.</p>
          </div>
          <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
            <Link href="/anuncios/publicar"><Plus className="w-5 h-5 mr-2" /> Registrar Espacio</Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por título o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <Button variant="outline" className="h-14 px-6 border-border rounded-2xl text-gray-400 hover:text-white">
            <Filter className="w-5 h-5 mr-2" /> Filtros
          </Button>
        </div>

        {/* Spaces List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredSpaces.length > 0 ? (
              filteredSpaces.map((space, i) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-bg-secondary border border-border p-6 rounded-[2rem] hover:border-emerald-500/20 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Preview Image */}
                    <div className="w-full lg:w-48 h-32 bg-bg-tertiary rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 relative">
                      <img 
                        src={space.images?.[0]?.url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b"} 
                        className="w-full h-full object-cover" 
                        alt={space.title} 
                      />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/20">
                        {space.type}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <MapPin size={12} className="text-emerald-400" /> {space.city}, {space.country}
                        </span>
                        {space.isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Disponible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <AlertCircle size={12} /> Pausado
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-emerald-400 transition-colors">{space.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> Registrado {new Date(space.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Megaphone size={12} /> 1.2k interesados</span>
                        <span className="flex items-center gap-1.5 text-white"><span className="text-emerald-400">$</span>{space.pricePerMonth}/mes</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" asChild className="w-12 h-12 rounded-xl p-0 text-gray-500 hover:text-white hover:bg-white/5">
                        <Link href={`/anuncios/${space.id}`} target="_blank"><ExternalLink size={18} /></Link>
                      </Button>
                      <Button variant="ghost" asChild className="w-12 h-12 rounded-xl p-0 text-gray-500 hover:text-white hover:bg-white/5">
                        <Link href={`/anuncios/editar/${space.id}`}><Edit3 size={18} /></Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setDeleteModal({ isOpen: true, id: space.id })}
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
                  <Megaphone className="text-gray-700 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No tienes espacios registrados</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">Registra tus vallas y letreros para que las empresas de Bolivia puedan reservarlos.</p>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl h-12 px-8 font-black uppercase tracking-widest">
                  <Link href="/anuncios/publicar">Registrar mi primer espacio</Link>
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
        title="¿Eliminar Espacio?"
        message="Esta acción eliminará permanentemente este espacio publicitario de Mercav. No podrás recuperar la información ni las reservas asociadas."
        confirmText="Eliminar permanentemente"
        variant="danger"
      />
    </div>
  );
}
