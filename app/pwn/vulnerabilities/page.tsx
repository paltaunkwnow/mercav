"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { pwnFetch, readVulnerability, type VulnerabilityView } from "@/components/pwn/api";
import { SearchForm } from "@/components/pwn/SearchForm";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatWhen, pwnPanelClass } from "@/components/pwn/format";

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
  const initial = params.get("cve") ?? "";
  const [cve, setCve] = useState(initial);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function search(raw: string) {
    const value = raw.trim().toUpperCase();
    if (!CVE.test(value)) {
      setFormError("Usa un identificador con la forma CVE-2024-12345.");
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
    <FadeIn className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Vulnerabilidades</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Busca un CVE. Si la fuente lo marca como explotado, se indica así. Eso no significa que una organización concreta esté comprometida.
        </p>
      </header>

      <section className={pwnPanelClass}>
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
        />
      </section>

      {status.kind === "idle" ? <EmptyState title="Busca un CVE" description="Escribe un identificador para consultar las fuentes de vulnerabilidades." /> : null}
      {status.kind === "loading" ? <LoadingState label="Consultando el CVE…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Vulnerabilidades no configuradas" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/vulnerabilities" description="La búsqueda de CVE requiere una sesión." /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void search(cve)} /> : null}
      {status.kind === "empty" ? <EmptyState title="Sin resultados" description={`Mercav Pwn no tiene registros para ${status.cve}.`} /> : null}
      {status.kind === "ready" ? (
        <ul className="space-y-4">
          {[status.item].map((item) => (
            <li key={item.id} className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-lg text-white">{item.cve}</h2>
                {item.severity ? <RiskBadge level={item.severity} /> : null}
              </div>
              {item.description ? <p className="mt-3 text-sm leading-relaxed text-gray-400">{item.description}</p> : null}
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">CVSS</dt>
                  <dd className="text-white">{item.cvss === null ? "—" : item.cvss}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Publicación</dt>
                  <dd className="text-white">{formatWhen(item.publishedAt) ?? "No indicada"}</dd>
                </div>
                {item.knownExploited !== null ? (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Vulnerabilidad explotada conocida</dt>
                    <dd className="text-white">{item.knownExploited ? "Sí" : "No"}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-4">
                <SourceBadge source={item.source} href={item.sourceUrl} />
              </div>
              {item.references.length ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {item.references.map((ref) => (
                    <li key={ref.href}>
                      <a href={ref.href} target="_blank" rel="noreferrer" className="text-gold underline-offset-4 hover:underline">
                        {ref.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
