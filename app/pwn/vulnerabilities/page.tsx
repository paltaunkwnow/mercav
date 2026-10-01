"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pwnFetch, readVulnerability, type VulnerabilityView } from "@/components/pwn/api";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { focusRing, formatWhen, pwnCardClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnPageHeader } from "@/components/pwn/ui";
import { ArrowUpRight, FileSearch } from "lucide-react";

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
  const params = useSearchParams();
  const initial = params?.get("cve") ?? "";
  const [cve, setCve] = useState(initial);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function search(raw: string) {
    const value = raw.trim().toUpperCase();
    if (!CVE.test(value)) {
      setFormError("Usá un identificador con la forma CVE-2024-12345.");
      return;
    }
    setFormError(null);
    setStatus({ kind: "loading" });
    const response = await pwnFetch(`/api/pwn/vulnerabilities?cve=${encodeURIComponent(value)}`);
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
  }

  useEffect(() => {
    if (initial && CVE.test(initial)) {
      setCve(initial.toUpperCase());
      void search(initial);
    }
    // The query string is the only trigger for the first lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Vulnerabilidades"
        title="Buscá un CVE y mirá si se está explotando."
        lead="Si la fuente lo marca como explotado, se indica así. Eso no significa que una organización concreta esté comprometida."
      />

      <section aria-label="Buscar CVE" className="liquid-glass rounded-[1.75rem] p-4 sm:p-5 md:p-7">
        <SearchForm
          id="cve-search"
          label="Identificador CVE"
          value={cve}
          onChange={setCve}
          onSubmit={() => void search(cve)}
          placeholder="CVE-2024-12345"
          submitLabel={status.kind === "loading" ? "Buscando…" : "Buscar"}
          disabled={status.kind === "loading"}
          error={formError}
          autoComplete="off"
          hint="Fuentes: NVD y el catálogo KEV de CISA."
        />
      </section>

      {status.kind === "idle" ? (
        <EmptyState
          icon={<FileSearch className="h-5 w-5" aria-hidden />}
          title="Buscá un CVE"
          description="Escribí un identificador para consultar las fuentes de vulnerabilidades."
        />
      ) : null}
      {status.kind === "loading" ? <LoadingState label="Consultando el CVE…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Vulnerabilidades no configuradas" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/vulnerabilities" description="La búsqueda de CVE requiere una sesión." /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void search(cve)} /> : null}
      {status.kind === "empty" ? <EmptyState title="Sin resultados" description={`Mercav Pwn no tiene registros para ${status.cve}.`} /> : null}
      {status.kind === "ready" ? (
        <ul className="space-y-4">
          {[status.item].map((item) => (
            <li key={item.id} className={pwnCardClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="mv-data text-xl font-semibold text-[var(--text-primary)] md:text-2xl">{item.cve}</h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.severity ? <RiskBadge level={item.severity} /> : null}
                  {item.knownExploited ? (
                    <span className="inline-flex h-6 items-center rounded-full border border-red-400/40 bg-red-500/10 px-2.5 text-[11px] font-semibold text-red-200 [.light_&]:border-red-700/30 [.light_&]:text-red-800">
                      Explotación conocida
                    </span>
                  ) : null}
                </div>
              </div>
              {item.description ? <p className="mv-body mt-3">{item.description}</p> : null}
              <MetaGrid>
                <Meta label="CVSS" mono>
                  {item.cvss === null ? "—" : item.cvss}
                </Meta>
                <Meta label="Publicación">{formatWhen(item.publishedAt) ?? "No indicada"}</Meta>
                {item.knownExploited !== null ? (
                  <Meta label="Vulnerabilidad explotada conocida">{item.knownExploited ? "Sí" : "No"}</Meta>
                ) : null}
                <Meta label="Fuente">
                  <SourceBadge source={item.source} href={item.sourceUrl} />
                </Meta>
              </MetaGrid>
              {item.references.length ? (
                <div className="mt-5 border-t border-[var(--mv-hairline)] pt-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Referencias</h3>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                    {item.references.map((ref) => (
                      <li key={ref.href} className="min-w-0">
                        <a href={ref.href} target="_blank" rel="noreferrer" className={`mv-link inline-flex max-w-full items-center gap-1 break-all ${focusRing}`}>
                          <span className="min-w-0 break-all">{ref.label}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
