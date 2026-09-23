"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pwnFetch, readBreaches, type BreachView, type Pagination } from "@/components/pwn/api";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge, VerificationBadge, verificationMeta } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls } from "@/components/pwn/ListControls";
import { FadeIn } from "@/components/pwn/PwnShell";
import { formatCount, formatScore, formatWhen } from "@/components/pwn/format";

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
      return [item.name, item.source, item.description].join(" ").toLowerCase().includes(q);
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
    <FadeIn className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Filtraciones</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
          Cada registro muestra su fuente, su estado de verificación y su confianza. Lo que no está verificado se presenta como no verificado.
        </p>
      </header>

      {status.kind === "loading" ? <LoadingState label="Cargando filtraciones…" /> : null}
      {status.kind === "disabled" ? <DisabledState title="Filtraciones no configuradas" /> : null}
      {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/breaches" /> : null}
      {status.kind === "error" ? <ErrorState message={status.message} onRetry={() => void load(page)} /> : null}
      {status.kind === "ready" && total === 0 ? <EmptyState title="No hay filtraciones registradas" description="Cuando una fuente aporte registros, aparecerán aquí con su atribución." /> : null}

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
                <li key={item.id} className={`rounded-3xl border bg-bg-secondary/70 p-5 ${dashed ? "border-dashed border-white/30" : "border-white/5"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl text-white">{item.name}</h2>
                    <VerificationBadge status={item.verificationStatus} />
                    {item.severity ? <RiskBadge level={item.severity} /> : null}
                  </div>
                  {note ? <p className="mt-3 text-sm text-gray-200">{note}</p> : null}
                  {item.description ? <p className="mt-3 text-sm leading-relaxed text-gray-400">{item.description}</p> : null}
                  {item.dataTypes.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {item.dataTypes.map((type) => (
                        <li key={type} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300">
                          {type}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-gray-500">Confianza</dt>
                      <dd className="text-white">{formatScore(item.confidenceScore) ?? "No indicada"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Publicación</dt>
                      <dd className="text-white">{formatWhen(item.publishedAt ?? item.discoveredAt) ?? "No indicada"}</dd>
                    </div>
                    {item.claimedRecordCount !== null ? (
                      <div>
                        <dt className="text-gray-500">Registros declarados</dt>
                        <dd className="text-white">{formatCount(item.claimedRecordCount)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-gray-500">Fuente</dt>
                      <dd className="mt-1">
                        <SourceBadge source={item.source} href={item.sourceUrl} />
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </FadeIn>
  );
}
