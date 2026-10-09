"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, FolderOpen, History, Loader2, Save, Trash2 } from "@/components/icons";
import { ButtonLink, buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

export type SavedRun = { id: string; tool: string; title: string; createdAt: string; input?: any; output?: any };
export type HistoryPayload = { title: string; input: unknown; output: unknown };

type Status = "loading" | "anon" | "ready" | "error";

const dateFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const COLLAPSED = 5;

/**
 * "Guardar en mi historial" + list of saved results for one tool.
 * `current` is the result on screen (null when there is none); `onRestore` puts a saved run back on screen.
 */
export function ToolHistory({ toolId, current, onRestore }: { toolId: string; current: HistoryPayload | null; onRestore: (run: SavedRun) => void }) {
  const pathname = usePathname();
  const headingId = useId();
  const [status, setStatus] = useState<Status>("loading");
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lastOutput = useRef<unknown>(current?.output ?? null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/history?tool=${encodeURIComponent(toolId)}`, { cache: "no-store" });
      // Always read the body so the request completes, even on 401.
      const json = await res.json().catch(() => null);
      if (res.status === 401) return setStatus("anon");
      if (!res.ok || !json?.success) return setStatus("error");
      setRuns(json.data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [toolId]);

  useEffect(() => {
    load();
  }, [load]);

  // A new result on screen (new output object) can be saved again.
  const output = current?.output ?? null;
  if (lastOutput.current !== output) {
    lastOutput.current = output;
    if (savedKey) setSavedKey(null);
  }

  const save = async () => {
    if (!current || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tools/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolId, title: current.title.slice(0, 120), input: current.input, output: current.output }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 401) {
        setStatus("anon");
        return;
      }
      if (!res.ok || !json?.success) {
        setMessage({ text: json?.error || "No pudimos guardar el resultado.", error: true });
        return;
      }
      setRuns((prev) => [json.data, ...prev].slice(0, 50));
      setStatus("ready");
      setSavedKey("saved");
      setMessage({ text: "Guardado en tu historial." });
    } catch {
      setMessage({ text: "No pudimos guardar el resultado. Revisá tu conexión.", error: true });
    } finally {
      setSaving(false);
    }
  };

  const open = async (run: SavedRun) => {
    setBusyId(run.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/tools/history?id=${encodeURIComponent(run.id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setMessage({ text: json?.error || "No pudimos abrir ese resultado.", error: true });
        return;
      }
      onRestore(json.data);
      setMessage({ text: `Abriste «${run.title}».` });
    } catch {
      setMessage({ text: "No pudimos abrir ese resultado.", error: true });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (run: SavedRun) => {
    if (confirmId !== run.id) {
      setConfirmId(run.id);
      return;
    }
    setBusyId(run.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/tools/history?id=${encodeURIComponent(run.id)}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setMessage({ text: json?.error || "No pudimos borrar ese resultado.", error: true });
        return;
      }
      setRuns((prev) => prev.filter((item) => item.id !== run.id));
      setMessage({ text: `Borraste «${run.title}».` });
    } catch {
      setMessage({ text: "No pudimos borrar ese resultado.", error: true });
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const visible = expanded ? runs : runs.slice(0, COLLAPSED);

  return (
    <section aria-labelledby={headingId} className="mv-panel min-w-0 p-5 md:p-7 lg:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={headingId} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            <History className="h-[18px] w-[18px] text-gold" aria-hidden />
            Historial
            {status === "ready" && runs.length > 0 ? <span className="mv-data text-sm font-normal text-[var(--text-secondary)]">({runs.length})</span> : null}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Guardá un resultado para volver a abrirlo cuando lo necesites. Solo lo ves vos.</p>
        </div>
        {status !== "anon" && current ? (
          <button
            type="button"
            onClick={save}
            disabled={saving || savedKey !== null || status === "loading"}
            aria-busy={saving}
            className={buttonClass(savedKey ? "secondary" : "primary", "md", "w-full shrink-0 sm:w-auto")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : savedKey ? <Check className="h-4 w-4" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            {saving ? "Guardando…" : savedKey ? "Guardado" : "Guardar en mi historial"}
          </button>
        ) : null}
      </div>

      <p role={message?.error ? "alert" : "status"} aria-live="polite" className={cn("text-sm", message ? "mt-4" : "sr-only", message?.error ? "text-red-400" : "text-[var(--text-secondary)]")}>
        {message?.text ?? ""}
      </p>

      <div className="mt-5">
        {status === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando tu historial…
          </p>
        ) : status === "anon" ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Iniciá sesión para guardar tus resultados y retomarlos desde cualquier dispositivo.</p>
            <ButtonLink href={`/login?callbackUrl=${encodeURIComponent(pathname || "/herramientas")}`} tone="secondary" size="sm" className="w-full shrink-0 sm:w-auto">
              Iniciar sesión
            </ButtonLink>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">No pudimos cargar el historial en este momento.</p>
            <button type="button" onClick={() => { setStatus("loading"); load(); }} className={buttonClass("ghost", "sm", "w-full sm:w-auto")}>
              Reintentar
            </button>
          </div>
        ) : runs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] p-5 text-sm text-[var(--text-secondary)]">
            Todavía no guardaste nada en esta herramienta. Cuando tengas un resultado, tocá «Guardar en mi historial».
          </p>
        ) : (
          <>
            <ul className="divide-y divide-[var(--mv-hairline)] rounded-2xl border border-[var(--mv-hairline)]">
              {visible.map((run) => (
                <li key={run.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{run.title}</p>
                    <p className="mv-data text-xs text-[var(--text-secondary)]">
                      <time dateTime={new Date(run.createdAt).toISOString()}>{dateFormat.format(new Date(run.createdAt))}</time>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => open(run)} disabled={busyId === run.id} className={buttonClass("secondary", "sm", "h-10 flex-1 sm:flex-none")}>
                      {busyId === run.id && confirmId !== run.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FolderOpen className="h-4 w-4" aria-hidden />}
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(run)}
                      onBlur={() => setConfirmId((id) => (id === run.id ? null : id))}
                      disabled={busyId === run.id}
                      aria-label={confirmId === run.id ? `Confirmar: borrar «${run.title}»` : `Borrar «${run.title}»`}
                      className={buttonClass("ghost", "sm", cn("h-10 flex-1 sm:flex-none", confirmId === run.id && "text-red-400"))}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      {confirmId === run.id ? "Confirmar" : "Borrar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {runs.length > COLLAPSED ? (
              <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="mv-link mt-3 text-sm">
                {expanded ? "Ver menos" : `Ver los ${runs.length} guardados`}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
