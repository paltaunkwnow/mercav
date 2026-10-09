"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, FileDown, Search, History } from "@/components/icons";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AdminPanel, EmptyState, Field, InlineAlert, LoadingState, StatusBadge, fmt } from "./ui";

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

  // Compare only editable fields: timestamps change on every save.
  const editable = (c: any) => {
    const { updatedAt, createdAt, ...rest } = c || {};
    return JSON.stringify(rest);
  };
  const dirty = editable(config) !== editable(initialConfig);

  return (
    <div className="flex flex-col gap-6">
      {/* Save bar: sticks under the context bar so publishing is always one move away */}
      <div className="mv-panel sticky top-[7.75rem] z-20 flex flex-col gap-3 rounded-[1.25rem] px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:top-24">
        <div aria-live="polite" className="flex items-center gap-2 text-sm">
          {status === "success" ? (
            <StatusBadge tone="success">Publicado</StatusBadge>
          ) : dirty ? (
            <StatusBadge tone="gold">Cambios sin publicar</StatusBadge>
          ) : (
            <span className="text-[var(--text-secondary)]">Todo publicado</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="mv-btn mv-btn-primary mv-btn-sm w-full sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Publicar cambios
        </button>
      </div>

      {status === "error" && <InlineAlert>No se pudo guardar la configuración. Probá de nuevo.</InlineAlert>}

      {/* Announcement */}
      <AdminPanel id="cfg-announcement" title="Anuncio global" description="Se muestra en la parte superior de todo el sitio. Dejalo vacío para ocultarlo.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Texto" htmlFor="cfg-ann-text">
            <input 
              id="cfg-ann-text"
              type="text" 
              value={config.announcementText || ""}
              onChange={(e) => updateField("announcementText", e.target.value)}
              placeholder="Ej.: Nuevo sistema de pagos disponible"
              className="mv-input text-sm"
            />
          </Field>
          <Field label="Enlace" htmlFor="cfg-ann-link" hint="Opcional.">
            <input 
              id="cfg-ann-link"
              type="url" 
              inputMode="url"
              value={config.announcementLink || ""}
              onChange={(e) => updateField("announcementLink", e.target.value)}
              placeholder="https://mercav.lat/novedades"
              className="mv-input mv-data text-sm"
            />
          </Field>
        </div>
      </AdminPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Access */}
        <AdminPanel id="cfg-access" title="Acceso" description="Controla quién puede entrar y registrarse.">
          <div className="flex flex-col gap-3">
            <Switch
              id="cfg-registrations"
              label="Registro de cuentas nuevas"
              description={config.allowNewRegistrations ? "Abierto: cualquiera puede crear una cuenta." : "Cerrado: nadie puede registrarse."}
              checked={!!config.allowNewRegistrations}
              onChange={() => updateField("allowNewRegistrations", !config.allowNewRegistrations)}
            />
            <Switch
              id="cfg-maintenance"
              label="Modo mantenimiento"
              description="Solo administradores pueden usar el sitio mientras esté activo."
              checked={!!config.maintenanceMode}
              danger
              onChange={() => updateField("maintenanceMode", !config.maintenanceMode)}
            />
            {config.maintenanceMode && (
              <Field label="Mensaje de mantenimiento" htmlFor="cfg-maint-msg" className="mv-fade">
                <textarea 
                  id="cfg-maint-msg"
                  value={config.maintenanceMessage || ""}
                  onChange={(e) => updateField("maintenanceMessage", e.target.value)}
                  className="mv-input h-20 resize-none py-3 text-sm"
                  placeholder="Lo que verán los visitantes"
                />
              </Field>
            )}
            <div className="flex flex-col gap-2 rounded-[1rem] border border-[var(--mv-hairline-strong)] p-4">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="cfg-score" className="text-sm font-semibold text-[var(--text-primary)]">Puntaje mínimo de verificación</label>
                <output htmlFor="cfg-score" className="mv-data text-sm text-gold">{config.minVerificationScore}</output>
              </div>
              <input 
                id="cfg-score"
                type="range" 
                min="0" 
                max="100" 
                value={config.minVerificationScore}
                onChange={(e) => updateField("minVerificationScore", parseInt(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-[#D4AF37]"
              />
            </div>
          </div>
        </AdminPanel>

        {/* Economy + featured */}
        <div className="flex flex-col gap-6">
          <AdminPanel id="cfg-fee" title="Comisión de plataforma" description="Porcentaje que retiene Mercav en cada operación.">
            <div className="flex items-center gap-3">
              <label htmlFor="cfg-fee-input" className="sr-only">Comisión en porcentaje</label>
              <div className="relative w-36">
                <input 
                  id="cfg-fee-input"
                  type="number" 
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  max={100}
                  value={config.platformFeePercentage}
                  onChange={(e) => updateField("platformFeePercentage", parseFloat(e.target.value))}
                  className="mv-input mv-data pr-9 text-lg"
                />
                <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">%</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">Afecta a las operaciones nuevas.</p>
            </div>
          </AdminPanel>

          <AdminPanel id="cfg-featured" title="Destacados" description="Pegá el ID del servicio o espacio que querés destacar.">
            <div className="flex flex-col gap-4">
              <Field label="Servicio destacado" htmlFor="cfg-feat-service">
                <input 
                  id="cfg-feat-service"
                  type="text" 
                  value={config.featuredServiceId || ""}
                  onChange={(e) => updateField("featuredServiceId", e.target.value)}
                  placeholder="ID del servicio"
                  autoComplete="off"
                  spellCheck={false}
                  className="mv-input mv-data h-11 text-sm"
                />
              </Field>
              <Field label="Espacio destacado" htmlFor="cfg-feat-space">
                <input 
                  id="cfg-feat-space"
                  type="text" 
                  value={config.featuredSpaceId || ""}
                  onChange={(e) => updateField("featuredSpaceId", e.target.value)}
                  placeholder="ID del espacio"
                  autoComplete="off"
                  spellCheck={false}
                  className="mv-input mv-data h-11 text-sm"
                />
              </Field>
            </div>
          </AdminPanel>
        </div>
      </div>

      {/* Backup */}
      <AdminPanel id="cfg-backup" title="Respaldo de base de datos" description="Descarga un volcado JSON de las tablas en este momento.">
        <a href="/api/admin/system/backup" className="mv-btn mv-btn-secondary mv-btn-sm w-full sm:w-auto">
          <FileDown className="h-4 w-4" aria-hidden /> Descargar respaldo
        </a>
      </AdminPanel>

      {/* Audit log */}
      <AdminPanel
        id="cfg-audit"
        title="Registro de auditoría"
        description="Cambios administrativos, del más reciente al más antiguo."
        bodyClassName="p-0"
        actions={
          <div className="relative w-full sm:w-64">
            <label htmlFor="cfg-log-search" className="sr-only">Filtrar por acción, detalle o administrador</label>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input 
              id="cfg-log-search"
              type="search"
              value={logsSearch}
              onChange={(e) => setLogsSearch(e.target.value)}
              placeholder="Acción, detalle o admin"
              autoComplete="off"
              className="mv-input h-10 pl-10 text-sm"
            />
          </div>
        }
      >
        {logsLoading ? (
          <LoadingState label="Cargando registro…" />
        ) : filteredLogs.length === 0 ? (
          <div className="p-5"><EmptyState icon={History} title={logsSearch ? "Nada coincide con el filtro" : "Sin actividad registrada"} /></div>
        ) : (
          <ol className="max-h-[28rem] overflow-y-auto overscroll-contain">
            {filteredLogs.map((log: any) => (
              <li key={log.id} className="flex flex-col gap-1.5 border-b border-[var(--mv-hairline)] px-5 py-3 last:border-b-0 md:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="gold" className="mv-data text-[0.6875rem]">{log.action}</StatusBadge>
                  <span className="text-sm text-[var(--text-secondary)]">{log.details}</span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  @{log.admin?.username || "admin"} · <time className="mv-data" dateTime={log.createdAt}>{fmt.dateTime(log.createdAt)}</time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </AdminPanel>
    </div>
  );
}

function Switch({
  id,
  label,
  description,
  checked,
  danger,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  danger?: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-[1rem] border p-4 transition-colors duration-200",
        checked && danger ? "border-red-500/30 bg-red-500/[0.06]" : "border-[var(--mv-hairline-strong)]",
      )}
    >
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p id={`${id}-desc`} className="mt-0.5 text-xs text-[var(--text-secondary)]">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        onClick={onChange}
        className={cn(
          "mv-focus relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? (danger ? "bg-red-500" : "bg-gold") : "bg-[var(--mv-hairline-strong)]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 [transition-timing-function:var(--ease-out)]",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
// creado por pato dev y askforvini
