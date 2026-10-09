"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Save } from "@/components/icons";
import { Notice } from "@/components/business/ui";
import { sendJson } from "@/lib/business/client";
import type { LoyaltyProgramView } from "@/lib/business/loyalty/types";
import { cn } from "@/lib/utils";
import { DesignSection, ExtrasSection, ProgramSection, RubroSection } from "./EditorSections";
import { ProgramPreview } from "./ProgramPreview";
import { STEPS, draftFromProgram, draftPayload, validateAll } from "./editor-state";

/** Ajustes del programa: el mismo editor del asistente, todo junto y con guardado explícito. */
export function ProgramSettings({
  slug,
  program,
  cardsCount,
  workspaceName,
  country,
  currency,
}: {
  slug: string;
  program: LoyaltyProgramView;
  cardsCount: number;
  workspaceName: string;
  country: string;
  currency: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => draftFromProgram(program));
  const [baseline, setBaseline] = useState(() => JSON.stringify(draftPayload(draftFromProgram(program))));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const payload = useMemo(() => JSON.stringify(draftPayload(draft)), [draft]);
  const dirty = payload !== baseline;
  const archived = program.status === "ARCHIVED";
  const editor = { draft, setDraft, workspaceName, country, currency };

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  async function save() {
    const problem = validateAll(draft);
    if (problem) {
      setError(`${STEPS[problem.step].label}: ${problem.error}`);
      document.getElementById(STEPS[problem.step].key)?.scrollIntoView({ block: "start" });
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await sendJson<{ program: LoyaltyProgramView; deactivated: number }>(`/api/business/${slug}/loyalty/programs/${program.id}`, "PATCH", draftPayload(draft));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    const next = draftFromProgram(res.data.program);
    setDraft(next);
    setBaseline(JSON.stringify(draftPayload(next)));
    setNotice(
      res.data.deactivated
        ? `Guardado. ${res.data.deactivated === 1 ? "Un premio que ya se había canjeado quedó desactivado" : `${res.data.deactivated} premios que ya se habían canjeado quedaron desactivados`} en vez de borrarse.`
        : "Guardado.",
    );
    router.refresh();
  }

  function discard() {
    setDraft(draftFromProgram(program));
    setBaseline(JSON.stringify(draftPayload(draftFromProgram(program))));
    setError(null);
    setNotice(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <aside className="mx-auto w-full max-w-[20rem] sm:max-w-[22rem] lg:sticky lg:top-28 lg:order-2 lg:mx-0 lg:max-w-none">
        <ProgramPreview draft={draft} />
        <nav aria-label="Secciones de ajustes" className="mt-5 hidden flex-col gap-1 lg:flex">
          {[
            { id: "programa", label: "Programa y premios" },
            { id: "diseno", label: "Diseño" },
            { id: "extras", label: "Extras" },
            { id: "rubro", label: "Rubro" },
          ].map((s) => (
            <a key={s.id} href={`#${s.id}`} className="mv-focus rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col gap-5 lg:order-1">
        {archived ? <Notice tone="warn">El programa está archivado. Restauralo desde Resumen para editarlo.</Notice> : null}
        <fieldset disabled={archived || busy} className="flex min-w-0 flex-col gap-5 disabled:opacity-70">
          <ProgramSection {...editor} mode="edit" lockType={cardsCount > 0} />
          <DesignSection {...editor} />
          <ExtrasSection {...editor} />
          <RubroSection {...editor} mode="edit" />
        </fieldset>

        <div
          className={cn(
            "mv-panel sticky bottom-24 z-10 flex flex-wrap items-center justify-between gap-3 p-3 pl-4 md:bottom-4",
            !dirty && !error && !notice && "opacity-90",
          )}
        >
          <div className="min-w-0 text-sm" aria-live="polite">
            {error ? (
              <span role="alert" className="text-red-500">
                {error}
              </span>
            ) : notice ? (
              <span className="text-[var(--text-secondary)]">{notice}</span>
            ) : dirty ? (
              <span className="font-semibold text-[var(--text-primary)]">Tenés cambios sin guardar.</span>
            ) : (
              <span className="text-[var(--text-secondary)]">Todo guardado.</span>
            )}
          </div>
          <div className="flex gap-2">
            {dirty ? (
              <button type="button" onClick={discard} disabled={busy} className="mv-btn mv-btn-ghost mv-btn-sm">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Descartar
              </button>
            ) : null}
            <button type="button" onClick={() => void save()} disabled={!dirty || busy || archived} className="mv-btn mv-btn-primary mv-btn-sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
