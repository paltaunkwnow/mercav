"use client";

import { useCallback, useEffect, useState } from "react";
import type { KosherKashrutPreference } from "@prisma/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { secondaryButton } from "@/components/kosher/ui";
import { KASHRUT_PREFERENCE } from "@/lib/kosher/labels";
import { cn } from "@/lib/utils";

/** Una preferencia elegida, o "later" cuando la persona tocó "Ahora no". En los dos casos no se vuelve a preguntar. */
export const KASHRUT_STORAGE_KEY = "mercav-kosher-kashrut";

export const KASHRUT_OPTIONS = Object.keys(KASHRUT_PREFERENCE) as KosherKashrutPreference[];

const isPreference = (value: unknown): value is KosherKashrutPreference => typeof value === "string" && value in KASHRUT_PREFERENCE;

function readStored(): KosherKashrutPreference | "later" | null {
  try {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(KASHRUT_STORAGE_KEY);
    return value === "later" || isPreference(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeKashrutPreference(value: KosherKashrutPreference | "later") {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KASHRUT_STORAGE_KEY, value);
  } catch {
    // Navegación privada o almacenamiento bloqueado: la preferencia dura lo que dure la página.
  }
}

function saveToProfile(preference: KosherKashrutPreference) {
  return kosherFetch("/api/kosher/profile", { method: "PATCH", json: { kashrutPreference: preference } });
}

/**
 * La preferencia de kashrut de la persona: la del perfil si entró con su cuenta, si no la de este dispositivo.
 * `shouldAsk` queda en true solo la primera vez (sin preferencia guardada y sin "Ahora no").
 */
export function useKashrutPreference(server: KosherKashrutPreference | null) {
  const { signedIn } = useKosherViewer();
  const [preference, setPreference] = useState<KosherKashrutPreference | null>(server);
  const [shouldAsk, setShouldAsk] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (server) {
      if (stored !== server) storeKashrutPreference(server);
      setPreference(server);
      return;
    }
    if (isPreference(stored)) {
      setPreference(stored);
      // Eligió antes de entrar con su cuenta: se guarda también en el perfil.
      if (signedIn) saveToProfile(stored).catch(() => undefined);
      return;
    }
    setShouldAsk(stored !== "later");
  }, [server, signedIn]);

  const choose = useCallback(
    async (next: KosherKashrutPreference) => {
      setPreference(next);
      setShouldAsk(false);
      storeKashrutPreference(next);
      if (!signedIn) return;
      try {
        await saveToProfile(next);
      } catch {
        toast.error("Quedó guardada en este dispositivo, pero no en tu perfil. Probá de nuevo más tarde.");
      }
    },
    [signedIn],
  );

  const dismiss = useCallback(() => {
    setShouldAsk(false);
    if (!readStored()) storeKashrutPreference("later");
  }, []);

  return { preference, shouldAsk, choose, dismiss };
}

/** Las tres opciones como botones grandes: un toque elige y guarda. */
export function KashrutOptions({
  current,
  onChoose,
  idPrefix,
  disabled,
  pressable = true,
}: {
  current: KosherKashrutPreference | null;
  onChoose: (value: KosherKashrutPreference) => void;
  idPrefix: string;
  disabled?: boolean;
  /** Con false (la primera pregunta) son botones de elegir, no interruptores con estado. */
  pressable?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {KASHRUT_OPTIONS.map((key) => {
        const active = current === key;
        return (
          <li key={key}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChoose(key)}
              aria-pressed={pressable ? active : undefined}
              aria-labelledby={`${idPrefix}-${key}-label`}
              aria-describedby={`${idPrefix}-${key}`}
              className={cn(
                "mv-focus flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors duration-150 disabled:opacity-60",
                active
                  ? "bg-[var(--k-selected)] shadow-[inset_0_0_0_1.5px_var(--k-accent)]"
                  : "bg-[var(--mv-panel)] shadow-[inset_0_0_0_1px_var(--mv-hairline-strong)] hover:bg-[var(--mv-panel-hover)]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                  active ? "bg-[var(--k-accent)]" : "shadow-[inset_0_0_0_1.5px_var(--text-tertiary)]",
                )}
              >
                {active && <span className="h-2 w-2 rounded-full bg-[var(--k-on-accent)]" />}
              </span>
              <span className="min-w-0">
                <span id={`${idPrefix}-${key}-label`} className="block text-[0.98rem] font-semibold leading-snug text-[var(--text-primary)]">
                  {KASHRUT_PREFERENCE[key].label}
                </span>
                <span id={`${idPrefix}-${key}`} className="mt-0.5 block text-[0.88rem] leading-snug text-[var(--text-secondary)]">
                  {KASHRUT_PREFERENCE[key].hint}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * "¿Cómo elegís dónde comer?". En modo `ask` (la primera visita) se cierra con "Ahora no"; en modo `edit`, con "Cancelar".
 * El diálogo se monta fuera de .k-world (portal), así que lleva la clase para heredar los colores de Kosher.
 */
export function KashrutPreferenceDialog({
  open,
  mode,
  current,
  onChoose,
  onClose,
}: {
  open: boolean;
  mode: "ask" | "edit";
  current: KosherKashrutPreference | null;
  onChoose: (value: KosherKashrutPreference) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="k-world max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-[1.75rem] p-6 text-[var(--text-primary)] sm:max-w-md">
        <DialogTitle className="pr-10 font-display text-[1.35rem] font-bold leading-tight tracking-[-0.018em] text-[var(--text-primary)]">
          ¿Cómo elegís dónde comer?
        </DialogTitle>
        <DialogDescription className="mt-2 text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          Con esto filtramos restaurantes y comercios en el mapa. Sinagogas, mikvaot y kehilot se ven siempre.
        </DialogDescription>
        <div className="mt-5">
          <KashrutOptions current={mode === "edit" ? current : null} pressable={mode === "edit"} onChoose={onChoose} idPrefix="k-pref-dialog" />
        </div>
        <p className="mt-4 text-[0.85rem] leading-relaxed text-[var(--text-tertiary)]">
          Mercav Kosher no emite hechsher: cada ficha dice quién certifica o supervisa. Lo cambiás cuando quieras desde el mapa o tu perfil.
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={cn(secondaryButton, "w-full sm:w-auto")}>
            {mode === "ask" ? "Ahora no" : "Cancelar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** "Según tu preferencia: Solo certificados · Cambiar". Todo el renglón es el botón, para que se pueda tocar. */
export function KashrutPreferenceLine({
  preference,
  onChange,
  className,
}: {
  preference: KosherKashrutPreference | null;
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-haspopup="dialog"
      className={cn("mv-focus inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full text-left text-[13px] text-[var(--text-secondary)]", className)}
    >
      <span className="min-w-0 truncate">
        {preference ? (
          <>
            Según tu preferencia: <span className="font-semibold text-[var(--text-primary)]">{KASHRUT_PREFERENCE[preference].label}</span>
          </>
        ) : (
          "Todos los niveles de kashrut"
        )}
      </span>
      <span aria-hidden>·</span>
      <span className="shrink-0 font-semibold text-[var(--k-accent)]">{preference ? "Cambiar" : "Elegir"}</span>
    </button>
  );
}

/** La pregunta de la primera visita, para páginas que no filtran nada (el inicio). */
export function KashrutOnboarding({ server }: { server: KosherKashrutPreference | null }) {
  const { preference, shouldAsk, choose, dismiss } = useKashrutPreference(server);
  return <KashrutPreferenceDialog open={shouldAsk} mode="ask" current={preference} onChoose={choose} onClose={dismiss} />;
}
// creado por pato dev y askforvini
