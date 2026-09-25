"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Medal, Search, UserPlus, Trash2, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { motion, AnimatePresence } from "framer-motion";

export function BadgesTab() {
  const [mounted, setMounted] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as "success" | "error" | "info" });
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  // Create Form State
  const [newBadge, setNewBadge] = useState({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Form State
  const [targetUsername, setTargetUsername] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = useState(false);
  const [isAssigningSubmitting, setIsAssigningSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isCreating || isAssigning) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCreating, isAssigning]);

  useEffect(() => {
    setMounted(true);
    fetchBadges();
  }, []);

  // Debounced User Search
  useEffect(() => {
    if (targetUsername.length < 2) {
      setSearchResults([]);
      setShowUserResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${targetUsername}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
          setShowUserResults(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [targetUsername]);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/badges");
      const data = await res.json();
      if (data.success) {
        setBadges(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast("Error al cargar insignias", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      showToast("Solo se permiten archivos PNG", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("El archivo no debe superar los 5MB", "error");
      return;
    }

    setSelectedFile(file);
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newBadge.name) {
      showToast("Completa todos los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", newBadge.name);
    formData.append("description", newBadge.description);

    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Insignia creada exitosamente", "success");
        setIsCreating(false);
        setNewBadge({ name: "", description: "" });
        setSelectedFile(null);
        fetchBadges();
      } else {
        showToast(data.error || "Error al crear insignia", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername || !selectedBadgeId) {
      showToast("Completa todos los campos", "error");
      return;
    }

    setIsAssigningSubmitting(true);
    try {
      const res = await fetch("/api/admin/badges/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername, badgeId: selectedBadgeId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Insignia asignada a @${targetUsername}`, "success");
        setIsAssigning(false);
        setTargetUsername("");
      } else {
        showToast(data.error || "Error al asignar insignia", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión", "error");
    } finally {
      setIsAssigningSubmitting(false);
    }
  };

  const confirmDeleteBadge = (id: string) => {
    setBadgeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const deleteBadge = async () => {
    if (!badgeToDelete) return;

    try {
      const res = await fetch(`/api/admin/badges/${badgeToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Insignia eliminada", "success");
        fetchBadges();
      }
    } catch (err) {
      showToast("Error al eliminar", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setBadgeToDelete(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Medal className="text-gold" /> Gestión de Insignias Custom
          </h2>
          <p className="text-xs text-gray-500 mt-1">Crea y asigna logos corporativos o distinciones especiales.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gold text-primary-foreground hover:bg-gold-light rounded-xl font-bold text-xs h-10 px-6"
          >
            <Plus size={16} className="mr-2" /> Nueva Insignia
          </Button>
          <Button 
            onClick={() => setIsAssigning(true)}
            variant="outline"
            className="border-white/10 hover:bg-white/5 rounded-xl font-bold text-xs h-10 px-6"
          >
            <UserPlus size={16} className="mr-2" /> Asignar a Usuario
          </Button>
        </div>
      </div>

      {/* Badges Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin text-gold mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Cargando catálogo...</p>
          </div>
        ) : badges.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
            <p className="text-gray-500 italic">No hay insignias custom creadas todavía.</p>
          </div>
        ) : badges.map((badge, i) => (
          <motion.div 
            key={badge.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, borderColor: "rgba(212, 175, 55, 0.3)" }}
            className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] group transition-all flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-bg-tertiary rounded-2xl flex items-center justify-center mb-4 border border-white/10 p-2 overflow-hidden shadow-2xl group-hover:scale-110 transition-transform">
              <img src={badge.icon} alt={badge.name} className="max-w-full max-h-full object-contain" />
            </div>
            <h3 className="font-bold text-white mb-1">{badge.name}</h3>
            <p className="text-[10px] text-gray-500 line-clamp-2 mb-4 h-8">{badge.description || "Sin descripción"}</p>
            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5 w-full justify-between">
              <span className="text-[9px] font-black text-gold uppercase tracking-tighter bg-gold/5 px-2 py-1 rounded">
                {badge._count?.users || 0} Usuarios
              </span>
              <button 
                onClick={() => confirmDeleteBadge(badge.id)}
                className="text-gray-600 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Modals Portal */}
      {mounted && createPortal(
        <>
          <AnimatePresence>
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[9999] flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-bg-secondary border border-white/10 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Plus className="text-gold" /> Crear Insignia Custom
                    </h3>
                    <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateBadge} className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Nombre de la Insignia</label>
                      <input 
                        required
                        placeholder="Ej. Colaborador Pil"
                        value={newBadge.name}
                        onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:border-gold/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Descripción (Opcional)</label>
                      <textarea 
                        placeholder="Explica qué representa esta insignia..."
                        value={newBadge.description}
                        onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-gold/50 transition-all min-h-[100px] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Logo (PNG, Max 5MB)</label>
                      <div className="relative group">
                        <input 
                          type="file"
                          accept="image/png"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${selectedFile ? 'border-gold/50 bg-gold/5' : 'border-white/10 bg-white/[0.02] group-hover:border-white/20'}`}>
                          {selectedFile ? (
                            <div className="flex flex-col items-center">
                              <img src={URL.createObjectURL(selectedFile)} className="h-12 w-12 object-contain mb-2" alt="Preview" />
                              <span className="text-[10px] text-gold font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="text-gray-600 mb-2" size={24} />
                              <span className="text-xs text-gray-500">Haz clic o arrastra un archivo PNG</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold text-primary-foreground hover:bg-gold-light rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Crear Insignia Oficial"}
                    </Button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isAssigning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[9999] flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-bg-secondary border border-white/10 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <UserPlus className="text-gold" /> Asignar Insignia
                    </h3>
                    <button onClick={() => setIsAssigning(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={handleAssignBadge} className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Nombre de Usuario (@usuario)</label>
                      <div className="relative">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-gold animate-pulse' : 'text-gray-600'}`} size={18} />
                        <input 
                          required
                          placeholder="Escribe el username..."
                          value={targetUsername}
                          onChange={(e) => setTargetUsername(e.target.value)}
                          onFocus={() => targetUsername.length >= 2 && setShowUserResults(true)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 pl-14 pr-6 text-white outline-none focus:border-gold/50 transition-all"
                        />

                        {/* User Search Results Dropdown */}
                        <AnimatePresence>
                          {showUserResults && searchResults.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-0 right-0 top-[110%] bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-[10002] backdrop-blur-3xl"
                            >
                              <div className="p-2 space-y-1">
                                {searchResults.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => {
                                      setTargetUsername(user.username);
                                      setShowUserResults(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-white/5 text-left group"
                                  >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 group-hover:border-gold/30 transition-all">
                                      <img 
                                        src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                                        alt={user.username} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-white group-hover:text-gold transition-colors">@{user.username}</div>
                                      <div className="text-[10px] text-gray-500">{user.name || "Sin nombre"}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Seleccionar Insignia</label>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setIsBadgeDropdownOpen(!isBadgeDropdownOpen)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 px-6 text-left text-white outline-none focus:border-gold/50 transition-all flex items-center justify-between group"
                        >
                          <span className="flex items-center gap-3">
                            {selectedBadgeId ? (
                              <>
                                <div className="w-6 h-6 bg-white/5 rounded-md p-1 border border-white/10">
                                  <img src={badges.find(b => b.id === selectedBadgeId)?.icon} alt="" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-sm font-bold text-white">{badges.find(b => b.id === selectedBadgeId)?.name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">Selecciona una insignia...</span>
                            )}
                          </span>
                          <motion.div
                            animate={{ rotate: isBadgeDropdownOpen ? 180 : 0 }}
                            className="text-gray-500 group-hover:text-gold transition-colors"
                          >
                            <Plus size={16} className="rotate-45" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isBadgeDropdownOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.98 }}
                              className="absolute left-0 right-0 top-[110%] bg-bg-secondary border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[10001] max-h-[300px] overflow-y-auto backdrop-blur-3xl"
                            >
                              <div className="p-2 space-y-1">
                                {badges.length === 0 ? (
                                  <div className="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest">No hay insignias creadas</div>
                                ) : badges.map((badge) => (
                                  <button
                                    key={badge.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBadgeId(badge.id);
                                      setIsBadgeDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-white/5 text-left group ${selectedBadgeId === badge.id ? 'bg-gold/10 border border-gold/20' : 'border border-transparent'}`}
                                  >
                                    <div className="w-10 h-10 bg-white/5 rounded-xl p-2 border border-white/10 group-hover:border-gold/30 transition-all">
                                      <img src={badge.icon} alt={badge.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-white group-hover:text-gold transition-colors">{badge.name}</div>
                                      <div className="text-[10px] text-gray-500 line-clamp-1">{badge.description || "Sin descripción"}</div>
                                    </div>
                                    {selectedBadgeId === badge.id && (
                                      <div className="ml-auto w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      disabled={isAssigningSubmitting}
                      className="w-full bg-gold text-primary-foreground hover:bg-gold-light rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
                    >
                      {isAssigningSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Vincular Insignia al Perfil"}
                    </Button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <ConfirmModal
            isOpen={isDeleteModalOpen}
            setIsOpen={setIsDeleteModalOpen}
            title="¿Eliminar insignia?"
            description="Esta acción es permanente. La insignia se eliminará del catálogo y de todos los perfiles de usuario que la tengan asignada."
            confirmText="Eliminar permanentemente"
            cancelText="Cancelar"
            variant="danger"
            onConfirm={deleteBadge}
          />
        </>,
        document.body
      )}

      {/* Global Toast */}
      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
}
// creado por Patodev y Invertilo
