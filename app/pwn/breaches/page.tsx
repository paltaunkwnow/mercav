"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pwnFetch, readBreaches, type BreachView, type Pagination } from "@/components/pwn/api";
import { SourceBadge } from "@/components/pwn/SourceBadge";
import { RiskBadge, VerificationBadge, verificationMeta } from "@/components/pwn/RiskBadge";
import { DisabledState, EmptyState, ErrorState, LoadingState, UnauthorizedState } from "@/components/pwn/EmptyState";
import { ListControls } from "@/components/pwn/ListControls";
import { FadeIn } from "@/components/pwn/PwnShell";
import { usePwnSession } from "@/components/pwn/session";
import {
  focusRing,
  formatCount,
  formatDay,
  formatScore,
  pwnCardClass,
  pwnHitAreaClass,
  pwnInsetClass,
  pwnTagClass,
  pwnUnverifiedCardClass,
} from "@/components/pwn/format";
import { Meta, MetaGrid, PwnPageHeader } from "@/components/pwn/ui";

const PAGE_SIZE = 20;
const QUERY_MAX = 120;
const QUERY_DEBOUNCE_MS = 300;

type Verification = "all" | "unverified" | "corroborated" | "confirmed" | "disputed";
type Sort = "recent" | "name" | "confidence";

const FILTER_OPTIONS: { value: Verification; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "unverified", label: "Sin verificar" },
  { value: "corroborated", label: "Corroboradas" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "disputed", label: "En disputa" },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "name", label: "Nombre" },
  { value: "confidence", label: "Confianza" },
];

type Status =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: BreachView[]; pagination: Pagination | null };

type Params = { page: number; q: string; verification: Verification; sort: Sort };

function asVerification(value: string): Verification {
  return FILTER_OPTIONS.find((option) => option.value === value)?.value ?? "all";
}

function asSort(value: string): Sort {
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? "recent";
}

function breachesUrl({ page, q, verification, sort }: Params) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
  if (q) params.set("q", q);
  if (verification !== "all") params.set("verification", verification);
  return `/api/pwn/breaches?${params.toString()}`;
}

/** Fecha de la filtración, solo el día (UTC): la de publicación si está; si no, la que haya, con su nombre real. */
function breachDate(item: BreachView): { label: string; value: string | null } {
  if (item.publishedAt) return { label: "Publicación", value: formatDay(item.publishedAt) };
  if (item.discoveredAt) return { label: "Descubrimiento", value: formatDay(item.discoveredAt) };
  return { label: "Primera detección", value: formatDay(item.firstSeenAt) };
}

/** Una sola solicitud viva: la nueva cancela la anterior (y se cancela al salir de la página). */
function useLatestRequest() {
  const ref = useRef<AbortController | null>(null);
  useEffect(() => () => ref.current?.abort(), []);
  return useCallback(() => {
    ref.current?.abort();
    const controller = new AbortController();
    ref.current = controller;
    return controller.signal;
  }, []);
}

export default function BreachesPage() {
  const session = usePwnSession();
  const authenticated = session.status === "authenticated";
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [filter, setFilter] = useState<Verification>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);
  const nextRequest = useLatestRequest();

  const load = useCallback(
    async (params: Params) => {
      const signal = nextRequest();
      setBusy(true);
      // Si ya hay resultados, quedan a la vista mientras llega la página nueva.
      setStatus((current) => (current.kind === "ready" ? current : { kind: "loading" }));
      const response = await pwnFetch(breachesUrl(params), { signal });
      if (signal.aborted || (!response.ok && response.reason === "aborted")) return;
      setBusy(false);
      if (!response.ok) {
        setStatus(
          response.reason === "disabled"
            ? { kind: "disabled" }
            : response.reason === "unauthorized"
              ? { kind: "unauthorized" }
              : { kind: "error", message: response.message },
        );
        return;
      }
      const { items, pagination } = readBreaches(response.data);
      setStatus({ kind: "ready", items, pagination });
    },
    [nextRequest],
  );

  // La búsqueda va al servidor 300 ms después de dejar de escribir y vuelve a la página 1.
  useEffect(() => {
    const next = query.trim().slice(0, QUERY_MAX);
    if (next === appliedQuery) return;
    const id = window.setTimeout(() => {
      setAppliedQuery(next);
      setPage(1);
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query, appliedQuery]);

  // Sin sesión no se pide nada.
  useEffect(() => {
    if (!authenticated) return;
    void load({ page, q: appliedQuery, verification: filter, sort });
  }, [authenticated, load, page, appliedQuery, filter, sort]);

  const serverPages = status.kind === "ready" ? Math.max(1, status.pagination?.pages ?? 1) : null;

  // Si la página pedida ya no existe (cambió el total), ir a la última.
  useEffect(() => {
    if (serverPages !== null && page > serverPages) setPage(serverPages);
  }, [serverPages, page]);

  const hasFilters = appliedQuery !== "" || filter !== "all";
  const total = status.kind === "ready" ? (status.pagination?.total ?? status.items.length) : 0;
  const pages = serverPages ?? 1;
  const showList = status.kind === "ready" && (total > 0 || hasFilters || query.trim() !== "");

  return (
    <FadeIn className="space-y-8">
      <PwnPageHeader
        title="Lo confirmado, separado de lo que solo se afirma."
        lead="Cada registro muestra su fuente, su estado de verificación y su confianza. Lo que no está verificado se presenta como no verificado."
      />

      {session.status === "loading" ? <LoadingState label="Comprobando tu sesión…" /> : null}
      {session.status === "unauthenticated" ? (
        <UnauthorizedState callbackPath="/pwn/breaches" description="El catálogo de filtraciones se muestra a cuentas con sesión iniciada." />
      ) : null}

      {authenticated ? (
        <>
          {status.kind === "loading" ? <LoadingState label="Cargando filtraciones…" /> : null}
          {status.kind === "disabled" ? <DisabledState title="Filtraciones no configuradas" /> : null}
          {status.kind === "unauthorized" ? <UnauthorizedState callbackPath="/pwn/breaches" /> : null}
          {status.kind === "error" ? (
            <ErrorState message={status.message} onRetry={() => void load({ page, q: appliedQuery, verification: filter, sort })} />
          ) : null}
          {status.kind === "ready" && !showList ? (
            <EmptyState title="No hay filtraciones registradas" description="Cuando una fuente aporte registros, van a aparecer acá con su atribución." />
          ) : null}

          {status.kind === "ready" && showList ? (
            <>
              <ListControls
                query={query}
                onQuery={setQuery}
                queryLabel="Buscar filtraciones"
                filter={filter}
                onFilter={(value) => {
                  setFilter(asVerification(value));
                  setPage(1);
                }}
                filterLabel="Verificación"
                filterOptions={FILTER_OPTIONS}
                sort={sort}
                onSort={(value) => {
                  setSort(asSort(value));
                  setPage(1);
                }}
                sortOptions={SORT_OPTIONS}
                page={Math.min(page, pages)}
                pages={pages}
                total={total}
                onPage={(next) => setPage(Math.min(Math.max(1, next), pages))}
              />
              <p className="sr-only" role="status" aria-live="polite">
                {busy ? "Actualizando resultados…" : ""}
              </p>
              {status.items.length === 0 ? (
                <EmptyState title="Ninguna filtración coincide" description="Probá con otra búsqueda o cambiá el filtro de verificación." />
              ) : null}
              <ul aria-busy={busy} className={`space-y-4 transition-opacity duration-200 ${busy ? "opacity-60" : ""}`}>
                {status.items.map((item) => {
                  const verification = (item.verificationStatus ?? "").toUpperCase();
                  const dashed = verification === "UNVERIFIED" || verification === "DISPUTED";
                  const note = verificationMeta(item.verificationStatus)?.note;
                  const date = breachDate(item);
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
                        <p className={`${pwnInsetClass} mt-3 border-dashed !border-[var(--mv-hairline-strong)] text-sm text-[var(--text-primary)]`}>{note}</p>
                      ) : null}
                      {item.description ? <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-primary)]">{item.description}</p> : null}
                      {item.descriptionDetail ? <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.descriptionDetail}</p> : null}
                      {item.descriptionImplication ? (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.descriptionImplication}</p>
                      ) : null}
                      {item.descriptionLinks.length ? (
                        <ul className="mt-3 flex flex-wrap gap-x-1.5 gap-y-3">
                          {item.descriptionLinks.map((link) => (
                            <li key={link.href}>
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${pwnTagClass} ${pwnHitAreaClass} transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-gold ${focusRing}`}
                              >
                                {link.label}
                                <span className="sr-only"> (abre en otra pestaña)</span>
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
                        <Meta label={date.label}>{date.value ?? "No indicada"}</Meta>
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
        </>
      ) : null}
    </FadeIn>
  );
}
// creado por pato dev y askforvini
