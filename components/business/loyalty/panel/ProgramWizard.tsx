"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "@/components/icons";
import { sendJson } from "@/lib/business/client";
import { cn } from "@/lib/utils";
import { DesignSection, ExtrasSection, ProgramSection, RubroSection } from "./EditorSections";
import { ProgramPreview } from "./ProgramPreview";
import { STEPS, draftFromTemplate, draftPayload, validateAll, validateStep, type ProgramDraft } from "./editor-state";

/** Asistente de 4 pasos para crear un programa. Termina en borrador: se revisa y se activa después. */
export function ProgramWizard({ slug, workspaceName, country, currency }: { slug: string; workspaceName: string; country: string; currency: string }) {
  const router = useRouter();
  // Arranca sin rubro elegido (la vista previa usa "Otro rubro" mientras tanto).
  const [draft, setDraft] = useState<ProgramDraft>(() => ({ ...draftFromTemplate("OTRO", workspaceName), businessType: "" }));
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const done = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const touched = draft.businessType !== "";

  // Avisar antes de salir con el asistente a medias.
  useEffect(() => {
    if (!touched) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (done.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [touched]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [step]);

  const editor = { draft, setDraft, workspaceName, country, currency };

  function go(target: number) {
    setError(null);
    if (target <= step) return setStep(target);
    for (let i = step; i < target; i++) {
      const problem = validateStep(i, draft);
      if (problem) {
        setStep(i);
        setError(problem);
        return;
      }
    }
    setStep(target);
    setReached((r) => Math.max(r, target));
  }

  async function submit() {
    const problem = validateAll(draft);
    if (problem) {
      setStep(problem.step);
      setError(problem.error);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await sendJson<{ id: string; slug: string }>(`/api/business/${slug}/loyalty/programs`, "POST", draftPayload(draft));
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    done.current = true;
    router.push(`/business/${slug}/fidelizacion/${res.data.id}?nuevo=1`);
    router.refresh();
  }

  return (
    <div ref={topRef} className="flex scroll-mt-28 flex-col gap-6">
      <nav aria-label="Pasos">
        <ol className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {STEPS.map((s, i) => {
            const current = i === step;
            const complete = i < step || (i <= reached && i !== step);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  disabled={i > reached + 1 || busy}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "mv-focus flex w-full flex-col items-start gap-2 rounded-2xl p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5",
                    current ? "bg-[var(--mv-panel)]" : "hover:bg-[var(--mv-panel-hover)]",
                  )}
                >
                  <span aria-hidden className={cn("h-1 w-full rounded-full", i <= step ? "bg-gold" : "bg-[var(--mv-hairline-strong)]")} />
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        current ? "bg-gold text-[var(--mv-on-gold)]" : complete ? "bg-gold/15 text-gold" : "bg-[var(--mv-panel-hover)] text-[var(--text-tertiary)]",
                      )}
                    >
                      {complete && !current ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className={cn("truncate text-xs font-semibold sm:text-sm", current ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{s.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          Paso {step + 1} de {STEPS.length}: {STEPS[step].label}
        </p>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <aside className="mx-auto w-full max-w-[20rem] sm:max-w-[22rem] lg:sticky lg:top-28 lg:order-2 lg:mx-0 lg:max-w-none">
          <ProgramPreview draft={draft} />
        </aside>

        <div className="flex min-w-0 flex-col gap-5 lg:order-1">
          {step === 0 ? <RubroSection {...editor} mode="create" /> : null}
          {step === 1 ? <ProgramSection {...editor} mode="create" /> : null}
          {step === 2 ? <DesignSection {...editor} /> : null}
          {step === 3 ? <ExtrasSection {...editor} /> : null}

          {error ? (
            <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} disabled={busy} className="mv-btn mv-btn-ghost mv-btn-sm">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Atrás
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => go(step + 1)} className="mv-btn mv-btn-primary mv-btn-sm">
                Siguiente: {STEPS[step + 1].label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button type="button" onClick={() => void submit()} disabled={busy} className="mv-btn mv-btn-primary mv-btn-sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                Crear programa
              </button>
            )}
          </div>
          {step === STEPS.length - 1 ? (
            <p className="text-xs text-[var(--text-secondary)]">Queda en borrador. Lo revisás y lo activás cuando quieras: recién ahí tus clientes se pueden sumar.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
