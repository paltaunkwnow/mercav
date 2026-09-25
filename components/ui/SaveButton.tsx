"use client";

import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button 
        variant="outline" 
        disabled={loading}
        onClick={toggleSave}
        className={`w-full gap-2 transition-all duration-300 ${
          saved 
            ? "border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]" 
            : "border-border text-gray-400 hover:border-gold hover:text-gold bg-transparent"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className={`h-4 w-4 ${saved ? "fill-gold" : ""}`} />
        )}
        {saved ? "Guardado" : "Guardar para después"}
      </Button>

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
