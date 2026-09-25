"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, ShieldCheck, Bell, Zap, Loader2, Save,
  CheckCircle2, AlertCircle, Database, FileDown, ShieldAlert, Clock, User,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalSettingsForm({ initialConfig }: { initialConfig: any }) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");

  const router = useRouter();

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/admin/system/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      
      if (res.ok) {
        setStatus("success");
        fetchLogs(); // Reload logs since configuration was audited
        router.refresh();
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  // Filter logs list
  const filteredLogs = logs.filter(log => {
    if (!logsSearch) return true;
    const q = logsSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.admin?.name?.toLowerCase().includes(q) ||
      log.admin?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-2xl font-bold flex items-center gap-2 font-display uppercase tracking-tight">
             <Zap className="h-6 w-6 text-gold" /> Panel de Control Operativo
           </h3>
           <p className="text-xs text-gray-500 mt-1">Gestión activa de la experiencia de usuario y reglas de negocio.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gold text-primary-foreground font-black text-xs hover:bg-gold-light transition-all disabled:opacity-50 shadow-xl shadow-gold/20 uppercase tracking-widest"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {status === "success" ? "¡Aplicado!" : "Publicar Cambios"}
        </button>
      </div>

      {status === "error" && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" /> Hubo un error al sincronizar con el servidor.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Communications Center */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent space-y-6">
           <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                 <Bell className="h-7 w-7" />
              </div>
              <div>
                 <h4 className="text-lg font-bold">Centro de Comunicaciones Globales</h4>
                 <p className="text-xs text-gray-500">Crea anuncios que aparecerán en la parte superior de toda la plataforma.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Texto del Anuncio</label>
                 <input 
                    type="text" 
                    value={config.announcementText || ""}
                    onChange={(e) => updateField("announcementText", e.target.value)}
                    placeholder="Ej: ¡Nuevo sistema de pagos disponible! Haz clic para saber más..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-gold outline-none transition-all placeholder:text-gray-700"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Enlace de Destino (Opcional)</label>
                 <input 
                    type="text" 
                    value={config.announcementLink || ""}
                    onChange={(e) => updateField("announcementLink", e.target.value)}
                    placeholder="https://mercav.lat/blog/novedades"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-gold outline-none transition-all placeholder:text-gray-700"
                 />
              </div>
           </div>
        </div>

        {/* Growth & Maintenance Control */}
        <div className="p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent space-y-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="font-bold">Control del Sistema</h4>
                 <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Acceso y estados de infraestructura</p>
              </div>
           </div>

           <div className="space-y-4">
              <button 
                onClick={() => updateField("allowNewRegistrations", !config.allowNewRegistrations)}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                   config.allowNewRegistrations ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                 <div className="text-left">
                    <p className="text-xs font-bold text-white">Nuevos Registros</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">Permitir registro de nuevos usuarios</p>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${config.allowNewRegistrations ? 'bg-green-500' : 'bg-red-500'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.allowNewRegistrations ? 'right-0.5' : 'left-0.5'}`} />
                 </div>
              </button>

              <button 
                onClick={() => updateField("maintenanceMode", !config.maintenanceMode)}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                   config.maintenanceMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                }`}
              >
                 <div className="text-left">
                    <p className="text-xs font-bold text-white">Modo Mantenimiento</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">Desviar tráfico no administrador</p>
                 </div>
                 <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${config.maintenanceMode ? 'bg-red-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.maintenanceMode ? 'right-0.5' : 'left-0.5'}`} />
                 </div>
              </button>

              <AnimatePresence>
                {config.maintenanceMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Mensaje de Mantenimiento Personalizable</label>
                    <textarea 
                      value={config.maintenanceMessage || ""}
                      onChange={(e) => updateField("maintenanceMessage", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs focus:border-gold outline-none h-20 resize-none transition-all placeholder:text-gray-800 text-white"
                      placeholder="Introduce el aviso personalizado..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-4 rounded-2xl border border-white/5 bg-black/20 space-y-2">
                 <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Puntaje de Verificación Requerido</p>
                 <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={config.minVerificationScore}
                      onChange={(e) => updateField("minVerificationScore", parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                    <span className="text-xs font-bold text-gold font-mono w-6">{config.minVerificationScore}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Featured Content & System Backups */}
        <div className="space-y-6">
          {/* Featured Content */}
          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent space-y-6">
             <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                   <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                   <h4 className="font-bold">Promoción y Destacados</h4>
                   <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Impulso de contenido específico</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase tracking-widest text-gray-600 ml-1">ID de Servicio Destacado</label>
                   <input 
                      type="text" 
                      value={config.featuredServiceId || ""}
                      onChange={(e) => updateField("featuredServiceId", e.target.value)}
                      placeholder="UUID del servicio..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-purple-500/50 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase tracking-widest text-gray-600 ml-1">ID de Espacio Destacado</label>
                   <input 
                      type="text" 
                      value={config.featuredSpaceId || ""}
                      onChange={(e) => updateField("featuredSpaceId", e.target.value)}
                      placeholder="UUID del espacio..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-purple-500/50 outline-none transition-all"
                   />
                </div>
             </div>
          </div>

          {/* Database Backup Card */}
          <div className="p-6 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Respaldo de Base de Datos</h4>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Volcado manual JSON de tablas</p>
              </div>
            </div>
            <a 
              href="/api/admin/system/backup" 
              className="px-5 py-3 rounded-xl bg-gold/10 border border-gold/30 hover:bg-gold hover:text-black font-black uppercase tracking-widest text-[9px] text-gold transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-gold/5"
            >
              <FileDown className="w-3.5 h-3.5" /> Respaldar
            </a>
          </div>
        </div>

        {/* Global Economy */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                 <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                 <h4 className="text-xl font-bold">Configuración Económica</h4>
                 <p className="text-sm text-gray-500">Ajusta las tasas de monetización globales.</p>
              </div>
           </div>

           <div className="flex items-center gap-6 bg-black/40 p-4 rounded-3xl border border-white/5">
              <div className="text-right">
                 <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Tasa de Retención</p>
                 <p className="text-xs text-gray-400">Comisión de plataforma</p>
              </div>
              <div className="flex items-center gap-3">
                 <input 
                   type="number" 
                   value={config.platformFeePercentage}
                   onChange={(e) => updateField("platformFeePercentage", parseFloat(e.target.value))}
                   className="bg-bg-tertiary border border-white/10 rounded-2xl px-4 py-3 text-xl font-black w-24 text-center focus:border-green-500 outline-none text-white"
                 />
                 <span className="text-2xl font-black text-green-500">%</span>
              </div>
           </div>
        </div>

        {/* System Activity Audit Logs */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0a0a0a] to-transparent space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Logs de Auditoría Operativa</h4>
                <p className="text-xs text-gray-500">Registro histórico de modificaciones administrativas.</p>
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input 
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                placeholder="Filtrar logs por acción/admin..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-gold/50 font-medium text-white placeholder:text-gray-700"
              />
            </div>
          </div>

          <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {logsLoading ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
            ) : filteredLogs.length === 0 ? (
              <p className="py-12 text-center text-gray-500 text-xs italic">No se registraron logs de actividad.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredLogs.map((log: any) => (
                  <div key={log.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-gray-300 font-medium leading-relaxed">{log.details}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-gray-600">
                        <span className="flex items-center gap-1 font-bold text-blue-400"><User className="w-3 h-3" /> @{log.admin?.username || "ADMIN"}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
