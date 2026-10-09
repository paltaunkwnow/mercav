"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { pwnFetch } from "@/components/pwn/api";
import { EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { pwnPanelClass } from "@/components/pwn/format";
import { PwnPageHeader, VerdictTile } from "@/components/pwn/ui";
import { buttonClass } from "@/components/site/primitives";

type State =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; display: string | null }
  | { kind: "error"; message: string };

/**
 * Destino del enlace que llega al buzón. Abrir la página no confirma nada (los escáneres de correo
 * abren enlaces solos): hace falta la sesión de la cuenta que siguió el correo y tocar el botón.
 */
export default function ConfirmMailboxPage() {
  const params = useSearchParams();
  const token = params?.get("token")?.trim() ?? "";
  const session = usePwnSession();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function confirm() {
    setState({ kind: "busy" });
    const response = await pwnFetch("/api/pwn/monitoring/confirm", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      setState({ kind: "error", message: response.message || "No se pudo confirmar el correo." });
      return;
    }
    const data = (response.data as { data?: { targetDisplay?: unknown } }).data;
    setState({ kind: "done", display: typeof data?.targetDisplay === "string" ? data.targetDisplay : null });
  }

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-8">
      <PwnPageHeader
        title="Confirmá que este correo es tuyo"
        lead="Con la confirmación ves el detalle de las filtraciones de ese correo y Pwn puede generar alertas cuando lo consultás."
      />

      {!token ? (
        <EmptyState
          title="Falta el enlace de confirmación"
          description="Abrí el enlace completo que te llegó por correo. Si venció, volvé a seguir el correo en Exposición para recibir uno nuevo."
          action={
            <Link href="/pwn/exposure" className={buttonClass("secondary", "md")}>
              Ir a Exposición
            </Link>
          }
        />
      ) : session.status === "loading" ? (
        <LoadingState label="Revisando la sesión…" />
      ) : session.status === "unauthenticated" ? (
        <UnauthorizedState
          callbackPath={`/pwn/confirmar?token=${encodeURIComponent(token)}`}
          description="Iniciá sesión con la misma cuenta que pidió seguir este correo."
        />
      ) : state.kind === "done" ? (
        <div className="space-y-4">
          <VerdictTile tone="clean" title="Correo confirmado" detail={state.display ? <span className="mv-data">{state.display}</span> : undefined} />
          <Link href="/pwn/exposure" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
            Ver mis objetivos
          </Link>
        </div>
      ) : (
        <div className={`${pwnPanelClass} space-y-4`}>
          <p className="text-sm text-[var(--text-secondary)]">
            Confirmá solo si vos pediste seguir este correo desde esta cuenta. Si no fuiste vos, cerrá esta página: sin la confirmación no se muestra nada.
          </p>
          <button
            type="button"
            disabled={state.kind === "busy"}
            onClick={() => void confirm()}
            className={buttonClass("primary", "md", "w-full sm:w-auto")}
          >
            {state.kind === "busy" ? "Confirmando…" : "Sí, este correo es mío"}
          </button>
          {state.kind === "error" ? <ErrorState title="No se pudo confirmar" message={state.message} /> : null}
        </div>
      )}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
