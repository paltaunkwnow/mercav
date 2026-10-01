"use client";

import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Toast } from "@/components/ui/toast";

interface SaveButtonProps {
  itemId: string;
  type: "job" | "space" | "service";
  initialSaved?: boolean;
}

export function SaveButton({ itemId, type, initialSaved = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });

  const toggleSave = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/${type === 'job' ? 'jobs' : type === 'space' ? 'spaces' : 'services'}/${itemId}/save`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setSaved(data.saved);
        setToast({ 
          visible: true, 
          message: data.saved ? "Guardado en tus favoritos" : "Eliminado de tus favoritos", 
          type: "success" 
        });
      } else {
        setToast({ visible: true, message: data.error || "Error al guardar", type: "error" });
      }
    } catch (error) {
      setToast({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={toggleSave}
        aria-pressed={saved}
        className={`mv-btn mv-btn-secondary w-full ${saved ? "!border-[var(--color-border-gold)] text-gold" : ""}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden />
        )}
        {saved ? "Guardado" : "Guardar para después"}
      </button>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </>
  );
}
// creado por pato dev y askforvini
