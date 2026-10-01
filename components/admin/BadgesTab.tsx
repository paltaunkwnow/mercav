"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Medal, Search, UserPlus, Trash2, Loader2, Upload, Check } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";
import { AdminDialog } from "./AdminDialog";
import { AdminPanel, EmptyState, Field, IconButton, LoadingState, fmt } from "./ui";

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
  const [isAssigningSubmitting, setIsAssigningSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);

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
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(targetUsername)}`);
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
    <div className="flex flex-col gap-6">
      <AdminPanel
        id="badges-catalog"
        title="Catálogo"
        description={loading ? "Cargando…" : `${fmt.number(badges.length)} ${badges.length === 1 ? "insignia" : "insignias"} creadas`}
        actions={
          <>
            <button type="button" onClick={() => setIsAssigning(true)} className="mv-btn mv-btn-secondary mv-btn-sm w-full sm:w-auto">
              <UserPlus className="h-4 w-4" aria-hidden /> Asignar a un usuario
            </button>
            <button type="button" onClick={() => setIsCreating(true)} className="mv-btn mv-btn-primary mv-btn-sm w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden /> Nueva insignia
            </button>
          </>
        }
      >
        {loading ? (
          <LoadingState label="Cargando catálogo…" />
        ) : badges.length === 0 ? (
          <EmptyState
            icon={Medal}
            title="Todavía no hay insignias"
            description="Creá la primera para distinguir colaboradores, empresas aliadas o logros especiales."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {badges.map((badge) => (
              <li key={badge.id} className="flex items-center gap-4 rounded-[1.25rem] border border-[var(--mv-hairline-strong)] p-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[0.875rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel-hover)] p-2">
                  <img src={badge.icon} alt="" className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{badge.name}</p>
                  <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">{badge.description || "Sin descripción"}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    <span className="mv-data">{badge._count?.users || 0}</span> {(badge._count?.users || 0) === 1 ? "perfil" : "perfiles"}
                  </p>
                </div>
                <IconButton icon={Trash2} tone="danger" label={`Eliminar la insignia ${badge.name}`} onClick={() => confirmDeleteBadge(badge.id)} />
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      {/* Create */}
      <AdminDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
        icon={<Plus className="h-5 w-5" />}
        title="Nueva insignia"
        description="Aparece en los perfiles a los que la asignes."
      >
        <form id="create-badge" onSubmit={handleCreateBadge} className="flex flex-col gap-5">
          <Field label="Nombre" htmlFor="badge-name">
            <input 
              id="badge-name"
              required
              placeholder="Ej.: Colaborador fundador"
              value={newBadge.name}
              onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
              autoComplete="off"
              className="mv-input"
            />
          </Field>
          <Field label="Descripción" htmlFor="badge-desc" hint="Opcional.">
            <textarea 
              id="badge-desc"
              placeholder="Qué representa esta insignia"
              value={newBadge.description}
              onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
              className="mv-input h-24 resize-none py-3 text-sm"
            />
          </Field>
          <div className="flex flex-col gap-2">
            <label htmlFor="badge-file" className="text-sm font-semibold text-[var(--text-primary)]">Logo</label>
            <div className="relative">
              <input 
                id="badge-file"
                type="file"
                accept="image/png"
                onChange={handleFileChange}
                aria-describedby="badge-file-hint"
                className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
              />
              <div
                className={cn(
                  "flex h-28 flex-col items-center justify-center gap-2 rounded-[1rem] border border-dashed transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
                  selectedFile ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]" : "border-[var(--mv-hairline-strong)] peer-hover:border-[var(--color-border-gold)]",
                )}
              >
                {selectedFile ? (
                  <>
                    <img src={URL.createObjectURL(selectedFile)} className="h-10 w-10 object-contain" alt="Vista previa del logo" />
                    <span className="max-w-[16rem] truncate text-xs font-semibold text-[var(--text-primary)]">{selectedFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[var(--text-tertiary)]" aria-hidden />
                    <span className="text-sm text-[var(--text-secondary)]">Hacé clic o arrastrá un PNG</span>
                  </>
                )}
              </div>
            </div>
            <p id="badge-file-hint" className="text-xs text-[var(--text-tertiary)]">PNG de hasta 5 MB. Preferí fondo transparente.</p>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsCreating(false)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="mv-btn mv-btn-primary mv-btn-sm">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Crear insignia
            </button>
          </div>
        </form>
      </AdminDialog>

      {/* Assign */}
      <AdminDialog
        open={isAssigning}
        onClose={() => setIsAssigning(false)}
        icon={<UserPlus className="h-5 w-5" />}
        title="Asignar insignia"
        description="Buscá el perfil y elegí la insignia."
      >
        <form onSubmit={handleAssignBadge} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="assign-user" className="text-sm font-semibold text-[var(--text-primary)]">Usuario</label>
            <div className="relative">
              <Search aria-hidden className={cn("pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2", isSearching ? "text-gold" : "text-[var(--text-tertiary)]")} />
              <input 
                id="assign-user"
                required
                placeholder="Escribí al menos 2 letras del usuario"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                onFocus={() => targetUsername.length >= 2 && setShowUserResults(true)}
                autoComplete="off"
                aria-controls="assign-user-results"
                className="mv-input pl-10"
              />
              {isSearching && <Loader2 aria-hidden className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold" />}
            </div>
            {/* Results render inline (no nested floating glass inside the dialog) */}
            {showUserResults && searchResults.length > 0 && (
              <ul id="assign-user-results" aria-label="Resultados" className="max-h-56 overflow-y-auto rounded-[1rem] border border-[var(--mv-hairline-strong)] p-1">
                {searchResults.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetUsername(user.username);
                        setShowUserResults(false);
                      }}
                      className="mv-focus flex w-full items-center gap-3 rounded-[0.75rem] p-2.5 text-left transition-colors hover:bg-[var(--mv-panel-hover)]"
                    >
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel-hover)]">
                        <img 
                          src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">@{user.username}</span>
                        <span className="block truncate text-xs text-[var(--text-tertiary)]">{user.name || "Sin nombre"}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Insignia</legend>
            {badges.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">Primero creá una insignia.</p>
            ) : (
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {badges.map((badge) => {
                  const selected = selectedBadgeId === badge.id;
                  return (
                    <label
                      key={badge.id}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-3 rounded-[0.875rem] border p-3 transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold",
                        selected
                          ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]"
                          : "border-[var(--mv-hairline-strong)] hover:bg-[var(--mv-panel-hover)]",
                      )}
                    >
                      <input
                        type="radio"
                        name="assign-badge"
                        value={badge.id}
                        checked={selected}
                        onChange={() => setSelectedBadgeId(badge.id)}
                        className="sr-only"
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] border border-[var(--mv-hairline)] p-1.5">
                        <img src={badge.icon} alt="" className="h-full w-full object-contain" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">{badge.name}</span>
                      {selected ? <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden /> : null}
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsAssigning(false)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
            <button type="submit" disabled={isAssigningSubmitting} className="mv-btn mv-btn-primary mv-btn-sm">
              {isAssigningSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Asignar insignia
            </button>
          </div>
        </form>
      </AdminDialog>

      {mounted && createPortal(
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          setIsOpen={setIsDeleteModalOpen}
          title="¿Eliminar insignia?"
          description="Es permanente: se quita del catálogo y de todos los perfiles que la tienen asignada."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={deleteBadge}
        />,
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
// creado por pato dev y askforvini
