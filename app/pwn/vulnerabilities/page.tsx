"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pwnFetch, readVulnerability, type VulnerabilityView } from "@/components/pwn/api";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { KnownExploitedBadge, RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import { focusRing, formatDay, formatWhen, pwnCardClass, pwnPanelClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnNotice, PwnPageHeader } from "@/components/pwn/ui";
import { ArrowUpRight, FileSearch } from "@/components/icons";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "empty"; cve: string }
  | { kind: "ready"; item: VulnerabilityView };

const CVE = /^CVE-\d{4}-\d{4,}$/i;

export default function VulnerabilitiesPage() {
  const session = usePwnSession();
  const params = useSearchParams();
  const initial = params?.get("cve") ?? "";
  const [cve, setCve] = useState(initial);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Cada búsqueda cancela la anterior; al desmontar se cancela la que quede.
  const searchRef = useRef<AbortController | null>(null);
  useEffect(() => () => searchRef.current?.abort(), []);

  const sessionStatus = session.status;
  const signedIn = sessionStatus === "authenticated";

  const search = useCallback(
    async (raw: string) => {
      const value = raw.trim().toUpperCase();
      if (!CVE.test(value)) {
        setFormError("Usá un identificador con la forma CVE-2024-12345.");
        return;
      }
      setFormError(null);
      searchRef.current?.abort();
      // Sin sesión se muestra el estado de "iniciá sesión" sin llamar a la API; mientras se comprueba, no se hace nada.
      if (sessionStatus !== "authenticated") {
        if (sessionStatus === "unauthenticated") setStatus({ kind: "unauthorized" });
        return;
      }
      const controller = new AbortController();
      searchRef.current = controller;
      setStatus({ kind: "loading" });
      const response = await pwnFetch(`/api/pwn/vulnerabilities?cve=${encodeURIComponent(value)}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if (response.reason === "aborted") return;
        setStatus(
          response.reason === "disabled"
            ? { kind: "disabled" }
            : response.reason === "unauthorized"
              ? { kind: "unauthorized" }
              : { kind: "error", message: response.message },
        );
        return;
      }
      const item = readVulnerability(response.data);
      setStatus(item ? { kind: "ready", item } : { kind: "empty", cve: value });
    },
    [sessionStatus],
  );

  // El CVE de la URL se busca solo cuando ya hay sesión.
  useEffect(() => {
    if (!signedIn || !initial || !CVE.test(initial.trim())) return;
    setCve(initial.trim().toUpperCase());
    void search(initial);
  }, [initial, signedIn, search]);

  const showSignIn = session.status === "unauthenticated" || status.kind === "unauthorized";

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Buscá un CVE y mirá si se está explotando."
        lead="Si la fuente lo marca como explotado, se indica así. Eso no significa que una organización concreta esté comprometida."
      />

      <section aria-label="Buscar CVE" className={pwnPanelClass}>
        <SearchForm
          id="cve-search"
          label="Identificador CVE"
          value={cve}
          onChange={setCve}
          onSubmit={() => void search(cve)}
          placeholder="CVE-2024-12345"
          submitLabel={status.kind === "loading" ? "Buscando…" : "Buscar"}
          error={formError}
          autoComplete="off"
          hint="Fuentes: NVD y el catálogo KEV de CISA."
        />
      </section>

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {showSignIn ? <UnauthorizedState callbackPath="/pwn/vulnerabilities" description="La búsqueda de CVE requiere una sesión." /> : null}

      {signedIn && status.kind === "idle" ? (
        <EmptyState
          icon={<FileSearch className="h-5 w-5" aria-hidden />}
          title="Buscá un CVE"
          description="Escribí un identificador para consultar las fuentes de vulnerabilidades."
        />
      ) : null}
      {signedIn && status.kind === "loading" ? <LoadingState label="Consultando el CVE…" /> : null}
      {signedIn && status.kind === "disabled" ? <DisabledState title="Vulnerabilidades no configuradas" /> : null}
      {signedIn && status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void search(cve)} /> : null}
      {signedIn && status.kind === "empty" ? (
        <EmptyState
          title="Sin resultados"
          description={`Ni NVD ni el catálogo KEV de CISA tienen registros para ${status.cve}. Revisá que el identificador esté bien escrito.`}
        />
      ) : null}
      {signedIn && status.kind === "ready" ? <VulnerabilityCard item={status.item} /> : null}
    </FadeIn>
  );
}

function VulnerabilityCard({ item }: { item: VulnerabilityView }) {
  const checked = formatWhen(item.checkedAt);
  return (
    <article aria-labelledby="pwn-cve-title" className={pwnCardClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 id="pwn-cve-title" className="mv-data text-xl font-semibold text-[var(--text-primary)] md:text-2xl">
          {item.cve}
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {item.severity ? <RiskBadge level={item.severity} /> : null}
          {item.knownExploited ? <KnownExploitedBadge /> : null}
        </div>
      </div>
      {item.stale ? (
        <div className="mt-4">
          <PwnNotice tone="neutral">
            NVD no respondió; se muestra el último dato guardado{checked ? ` (${checked})` : ""}.
          </PwnNotice>
        </div>
      ) : checked ? (
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          Revisado <span className="mv-data">{checked}</span>
        </p>
      ) : null}
      {item.description ? <p className="mv-body mt-3">{item.description}</p> : null}
      <MetaGrid>
        <Meta label="CVSS" mono>
          {item.cvss === null ? "—" : item.cvss}
        </Meta>
        <Meta label="Publicación">{formatDay(item.publishedAt) ?? "No indicada"}</Meta>
        {item.knownExploited !== null ? <Meta label="En el catálogo KEV de CISA">{item.knownExploited ? "Sí" : "No"}</Meta> : null}
        <Meta label="Fuente">
          <SourceBadge source={item.source} href={item.sourceUrl} />
        </Meta>
      </MetaGrid>
      {item.references.length ? (
        <div className="mt-5 border-t border-[var(--mv-hairline)] pt-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Referencias</h3>
          <ul className="mt-1 flex flex-col text-sm">
            {item.references.map((ref) => (
              <li key={ref.href} className="min-w-0">
                <a
                  href={ref.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mv-link inline-flex min-h-11 max-w-full items-center gap-1 break-all ${focusRing}`}
                >
                  <span className="min-w-0 break-all">{ref.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="sr-only"> (abre en otra pestaña)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
// creado por pato dev y askforvini
