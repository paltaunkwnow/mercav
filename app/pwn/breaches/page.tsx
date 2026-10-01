"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pwnFetch, readBreaches, type BreachView, type Pagination } from "@/components/pwn/api";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge, VerificationBadge, verificationMeta } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls } from "@/components/pwn/ListControls";
import { FadeIn } from "@/components/pwn/PwnShell";
import { focusRing, formatCount, formatScore, formatWhen, pwnCardClass, pwnTagClass, pwnUnverifiedCardClass } from "@/components/pwn/format";
import { Meta, MetaGrid, PwnPageHeader } from "@/components/pwn/ui";

const PAGE_SIZE = 20;

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: BreachView[]; pagination: Pagination | null };

function stamp(item: BreachView) {
  const raw = item.publishedAt ?? item.discoveredAt ?? item.firstSeenAt;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

export default function BreachesPage() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  const load = useCallback(async (targetPage: number, signal?: AbortSignal) => {
    setStatus({ kind: "loading" });
    const response = await pwnFetch(`/api/pwn/breaches?page=${targetPage}&limit=${PAGE_SIZE}`, { signal });
    if (signal?.aborted || (!response.ok && response.reason === "aborted")) return;
    if (!response.ok) {
      setStatus(response.reason === "disabled" ? { kind: "disabled" } : response.reason === "unauthorized" ? { kind: "unauthorized" } : { kind: "error", message: response.message });
      return;
    }
    const { items, pagination } = readBreaches(response.data);
    setStatus({ kind: "ready", items, pagination });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(page, controller.signal);
    return () => controller.abort();
  }, [load, page]);

  const visible = useMemo(() => {
    if (status.kind !== "ready") return [];
    const q = query.trim().toLowerCase();
    const filtered = status.items.filter((item) => {
      const verification = (item.verificationStatus ?? "").toUpperCase();
      if (filter === "unverified" && verification !== "UNVERIFIED") return false;
      if (filter === "corroborated" && verification !== "CORROBORATED" && verification !== "PARTIALLY_CORROBORATED") return false;
      if (filter === "confirmed" && verification !== "CONFIRMED") return false;
      if (filter === "disputed" && verification !== "DISPUTED") return false;
      if (!q) return true;
      return [item.name, item.source, item.description, item.descriptionDetail, item.descriptionImplication].join(" ").toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "confidence") return (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
      return stamp(b) - stamp(a);
    });
  }, [status, query, filter, sort]);

  const total = status.kind === "ready" ? (status.pagination?.total ?? status.items.length) : 0;
  const pages = status.kind === "ready" ? Math.max(1, status.pagination?.pages ?? 1) : 1;

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        kicker="Filtraciones"
        title="Lo confirmado, separado de lo que solo se afirma."
        lead="Cada registro muestra su fuente, su estado de verificación y su confianza. Lo que no está verificado se presenta como no verificado."
      />

      {status.kind === "loading" ? <LoadingState label="Cargando filtraciones…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Filtraciones no configuradas" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/breaches" /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load(page)} /> : null}
      {status.kind === "ready" && total === 0 ? <EmptyState title="No hay filtraciones registradas" description="Cuando una fuente aporte registros, van a aparecer acá con su atribución." /> : null}

      {status.kind === "ready" && total > 0 ? (
        <>
          <ListControls
            query={query}
            onQuery={setQuery}
            queryLabel="Buscar en esta página"
            filter={filter}
            onFilter={setFilter}
            filterLabel="Verificación"
            filterOptions={[
              { value: "all", label: "Todas" },
              { value: "unverified", label: "Sin verificar" },
              { value: "corroborated", label: "Corroboradas" },
              { value: "confirmed", label: "Confirmadas" },
              { value: "disputed", label: "En disputa" },
            ]}
            sort={sort}
            onSort={setSort}
            sortOptions={[
              { value: "recent", label: "Más recientes" },
              { value: "name", label: "Nombre" },
              { value: "confidence", label: "Confianza" },
            ]}
            page={Math.min(page, pages)}
            pages={pages}
            total={total}
            onPage={(next) => setPage(Math.min(Math.max(1, next), pages))}
          />
          {visible.length === 0 ? <EmptyState title="Ningún resultado con estos filtros en esta página" /> : null}
          <ul className="space-y-4">
            {visible.map((item) => {
              const verification = (item.verificationStatus ?? "").toUpperCase();
              const dashed = verification === "UNVERIFIED" || verification === "DISPUTED";
              const note = verificationMeta(item.verificationStatus)?.note;
              return (
                <li key={item.id} className={`${pwnCardClass} ${dashed ? pwnUnverifiedCardClass : ""}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="mv-h3">{item.name}</h2>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <VerificationBadge status={item.verificationStatus} />
                      {item.severity ? <RiskBadge level={item.severity} /> : null}
                    </div>
                  </div>
                  {note ? (
                    <p className="mt-3 rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-2.5 text-sm text-[var(--text-primary)]">{note}</p>
                  ) : null}
                  {item.description ? <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-primary)]">{item.description}</p> : null}
                  {item.descriptionDetail ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.descriptionDetail}</p> : null}
                  {item.descriptionImplication ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.descriptionImplication}</p> : null}
                  {item.descriptionLinks.length ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {item.descriptionLinks.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className={`${pwnTagClass} transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-gold ${focusRing}`}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.dataTypes.length ? (
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tipos de dato">
                      {item.dataTypes.map((type) => (
                        <li key={type} className={pwnTagClass}>
                          {type}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <MetaGrid>
                    <Meta label="Confianza">{formatScore(item.confidenceScore) ?? "No indicada"}</Meta>
                    <Meta label="Publicación">{formatWhen(item.publishedAt ?? item.discoveredAt) ?? "No indicada"}</Meta>
                    {item.claimedRecordCount !== null ? (
                      <Meta label="Registros declarados" mono>
                        {formatCount(item.claimedRecordCount)}
                      </Meta>
                    ) : null}
                    <Meta label="Fuente">
                      <SourceBadge source={item.source} href={item.sourceUrl} />
                    </Meta>
                  </MetaGrid>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
