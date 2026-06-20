"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, FileText, Calendar, CheckCircle, XCircle, Mail, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

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
    setActionLoading(id + newStatus);
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
        setToast({ visible: true, message: `Estado actualizado a ${newStatus}`, type: "success" });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-gold animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Cargando postulantes...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-24 pb-32 bg-bg-primary">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-gold transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
        </Link>

        <header className="mb-12">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Postulantes Recibidos</h1>
          <p className="text-gray-400">Gestiona los candidatos que aplicaron a tus vacantes laborales.</p>
        </header>

        {applications.length === 0 ? (
          <div className="bg-bg-secondary rounded-2xl border border-border p-12 text-center">
            <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aún no hay postulantes</h3>
            <p className="text-gray-400">Cuando alguien se postule a tus vacantes, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <div key={app.id} className="bg-bg-secondary border border-border rounded-2xl p-6 hover:border-gold/20 transition-all group">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-bg-tertiary overflow-hidden border border-border flex-shrink-0">
                      <img 
                        src={app.applicant.avatar || `https://ui-avatars.com/api/?name=${app.applicant.name}&background=random`} 
                        alt={app.applicant.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {app.applicant.name}
                        <span className="text-[10px] uppercase tracking-widest font-black bg-gold/10 text-gold px-2 py-0.5 rounded">Candidato</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {app.applicant.email}</span>
                        <span className="flex items-center font-bold text-gray-400 uppercase tracking-widest">Postuló para: {app.jobTitle}</span>
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" asChild className="flex-1 md:flex-none border-border hover:border-gold text-white rounded-xl">
                      <Link href={`/perfil/${app.applicant.id}`}>Ver Perfil</Link>
                    </Button>
                    <Button 
                      onClick={() => handleContact(app.applicant.id, app.id)}
                      disabled={actionLoading === app.id + 'contact'}
                      className="flex-1 md:flex-none bg-gold text-black hover:bg-gold-light rounded-xl font-bold"
                    >
                      {actionLoading === app.id + 'contact' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                      Contactar
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-gold" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Carta de Presentación</span>
                  </div>
                  <p className="text-sm text-gray-400 italic bg-bg-primary/50 p-4 rounded-xl border border-white/5 leading-relaxed">
                    "{app.coverLetter || 'El candidato no incluyó una carta de presentación.'}"
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Estado:</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        app.status === 'RECIBIDO' ? 'bg-blue-500/10 text-blue-400' : 
                        app.status === 'ACEPTADO' || app.status === 'CONTRATADO' ? 'bg-green-500/10 text-green-400' : 
                        app.status === 'DESCARTADO' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {app.status}
                      </span>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        disabled={actionLoading !== null}
                        onClick={() => handleStatusUpdate(app.id, 'DESCARTADO')}
                        className={`text-gray-500 hover:text-red-400 transition-colors ${app.status === 'DESCARTADO' ? 'text-red-400' : ''}`}
                      >
                        {actionLoading === app.id + 'DESCARTADO' ? <Loader2 size={20} className="animate-spin" /> : <XCircle size={20} />}
                      </button>
                      <button 
                        disabled={actionLoading !== null}
                        onClick={() => handleStatusUpdate(app.id, 'ACEPTADO')}
                        className={`text-gray-500 hover:text-green-400 transition-colors ${app.status === 'ACEPTADO' ? 'text-green-400' : ''}`}
                      >
                        {actionLoading === app.id + 'ACEPTADO' ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Toast 
          isVisible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      </div>
    </div>
  );
}
