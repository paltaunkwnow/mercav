"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Ban, ChevronLeft, ChevronRight, Download, Gift, Loader2, Mail, Phone, Scale, Search, ShieldCheck, UserPlus, Users, X } from "@/components/icons";
import { HolderBadge, HolderPanel } from "@/components/business/loyalty/staff/HolderPanel";
import { RegisterCustomerForm } from "@/components/business/loyalty/staff/RegisterCustomerForm";
import { sendJson } from "@/lib/business/client";
import { CARD_FILTERS, CARD_FILTER_LABELS, type CardFilter, type CustomerDetail, type CustomerRow } from "@/lib/business/loyalty/stats-core";
import type { LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { cn } from "@/lib/utils";
import { NumberInput, Segmented } from "./controls";
import { EVENT_LABELS, SOURCE_LABELS, formatBirthday, formatDay, formatDayTime, initials, relativeDay, unitWord } from "./format";

type ListData = { items: CustomerRow[]; total: number; page: number; pages: number; pageSize: number };

function Badges({ row, type }: { row: CustomerRow; type: LoyaltyTypeKey }) {
  return (
    <>
      {row.status === "BLOCKED" ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500">
          <Ban className="h-3 w-3" aria-hidden />
          Bloqueada
        </span>
      ) : null}
      {row.rewardReady ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold">
          <Gift className="h-3 w-3" aria-hidden />
          Premio
        </span>
      ) : null}
      {row.atRisk ? <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">En riesgo</span> : null}
      {row.tier ? <span className="rounded-full border border-[var(--mv-hairline-strong)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">{row.tier}</span> : null}
      <span className="sr-only">
        {" "}
        · Saldo {row.balance} {unitWord(type, row.balance)}
      </span>
    </>
  );
}

function AdjustForm({ type, busy, onSubmit, onCancel }: { type: LoyaltyTypeKey; busy: boolean; onSubmit: (delta: number, note: string) => void; onCancel: () => void }) {
  const [sign, setSign] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (note.trim().length < 3) return setError("Contá el motivo del ajuste (queda registrado).");
    setError(null);
    onSubmit(sign === "add" ? amount : -amount, note.trim());
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
      <Segmented
        name="adjust-sign"
        legend="Ajustar saldo"
        value={sign}
        onChange={setSign}
        options={[
          { value: "add", label: "Sumar" },
          { value: "remove", label: "Restar" },
        ]}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="adjust-amount" className="text-sm font-semibold text-[var(--text-primary)]">
          Cuántos {unitWord(type, 2)}
        </label>
        <NumberInput id="adjust-amount" value={amount} min={1} max={100_000} onChange={setAmount} className="max-w-[9rem]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="adjust-note" className="text-sm font-semibold text-[var(--text-primary)]">
          Motivo
        </label>
        <input
          id="adjust-note"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej.: sellos de la tarjeta de papel"
          className="mv-input h-11"
          autoComplete="off"
          required
          minLength={3}
        />
        <p className="text-xs text-[var(--text-secondary)]">Queda en el historial del cliente y en la auditoría.</p>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="mv-btn mv-btn-primary mv-btn-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {sign === "add" ? "Sumar" : "Restar"} {amount} {unitWord(type, amount)}
        </button>
        <button type="button" onClick={onCancel} className="mv-btn mv-btn-ghost mv-btn-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function DetailView({
  slug,
  detail,
  type,
  canManage,
  busy,
  error,
  onAdjust,
  onToggleBlock,
  onHolderChanged,
}: {
  slug: string;
  detail: CustomerDetail;
  type: LoyaltyTypeKey;
  canManage: boolean;
  onHolderChanged: () => void;
  busy: string | null;
  error: string | null;
  onAdjust: (delta: number, note: string) => Promise<boolean>;
  onToggleBlock: () => void;
}) {
  const [adjusting, setAdjusting] = useState(false);
  useEffect(() => setAdjusting(false), [detail.id]);
  const rows: [string, string][] = [
    ["N.º de cliente", `#${detail.customerNo}`],
    ["Saldo", `${detail.balance.toLocaleString("es")} ${unitWord(type, detail.balance)}`],
    ["Acumulado", `${detail.lifetime.toLocaleString("es")} ${unitWord(type, detail.lifetime)}`],
    ["Visitas", detail.visits.toLocaleString("es")],
    ["Última visita", relativeDay(detail.lastVisitAt)],
    ["Se sumó", formatDay(detail.createdAt)],
    ["Cumpleaños", formatBirthday(detail.birthday)],
    ["Nivel", detail.tier ?? "—"],
    ["Invitó", detail.referrals ? `${detail.referrals} ${detail.referrals === 1 ? "amigo" : "amigos"}` : "—"],
    ["Mensajes", detail.marketingConsent ? "Acepta recibirlos" : "No acepta"],
  ];
  if (detail.expiresOn) rows.push(["Vence el saldo", formatDay(`${detail.expiresOn}T12:00:00Z`)]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        <Badges row={detail} type={type} />
      </div>
      {detail.phone || detail.email ? (
        <div className="flex flex-col gap-1.5">
          {detail.phone ? (
            <a href={`tel:${detail.phone}`} className="mv-link inline-flex w-fit items-center gap-2 text-sm">
              <Phone className="h-4 w-4" aria-hidden />
              {detail.phone}
            </a>
          ) : null}
          {detail.email ? (
            <a href={`mailto:${detail.email}`} className="mv-link inline-flex w-fit items-center gap-2 break-all text-sm">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {detail.email}
            </a>
          ) : null}
        </div>
      ) : null}

      <HolderPanel
        slug={slug}
        cardId={detail.id}
        status={detail.holderStatus}
        customerName={detail.name}
        accountName={detail.holderAccountName}
        verifiedDoc={detail.holderDoc}
        canUnlink={canManage}
        onChange={onHolderChanged}
      />

      <p className="rounded-2xl bg-gold/10 px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
        {detail.progressLabel}
        {detail.nextTier && detail.toNextTier ? (
          <span className="mt-0.5 block text-xs font-normal text-[var(--text-secondary)]">
            Le {detail.toNextTier === 1 ? "falta" : "faltan"} {detail.toNextTier} para el nivel {detail.nextTier}.
          </span>
        ) : null}
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] text-[var(--text-tertiary)]">{label}</dt>
            <dd className="truncate text-sm font-semibold text-[var(--text-primary)]">{value}</dd>
          </div>
        ))}
      </dl>

      {canManage ? (
        <div className="flex flex-col gap-3">
          {adjusting ? (
            <AdjustForm
              type={type}
              busy={busy === "adjust"}
              onCancel={() => setAdjusting(false)}
              onSubmit={async (delta, note) => {
                if (await onAdjust(delta, note)) setAdjusting(false);
              }}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setAdjusting(true)} disabled={!!busy} className="mv-btn mv-btn-secondary mv-btn-sm">
                <Scale className="h-4 w-4" aria-hidden />
                Ajustar saldo
              </button>
              <button
                type="button"
                onClick={onToggleBlock}
                disabled={!!busy}
                className={cn("mv-btn mv-btn-sm", detail.status === "BLOCKED" ? "mv-btn-secondary" : "mv-btn-ghost text-red-500")}
              >
                {busy === "block" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : detail.status === "BLOCKED" ? <ShieldCheck className="h-4 w-4" aria-hidden /> : <Ban className="h-4 w-4" aria-hidden />}
                {detail.status === "BLOCKED" ? "Desbloquear" : "Bloquear"}
              </button>
            </div>
          )}
          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Historial</h3>
        {detail.history.length ? (
          <ol className="flex flex-col">
            {detail.history.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 border-b border-[var(--mv-hairline)] py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)]">
                    {EVENT_LABELS[e.type]}
                    {e.rewardName ? `: ${e.rewardName}` : ""}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {formatDayTime(e.createdAt)} · {SOURCE_LABELS[e.source]}
                    {e.actorName ? ` · ${e.actorName}` : ""}
                  </p>
                  {e.note ? <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{e.note}</p> : null}
                </div>
                {e.amount !== 0 ? (
                  <span className={cn("shrink-0 text-sm font-semibold tabular-nums", e.amount > 0 ? "text-emerald-500" : "text-[var(--text-secondary)]")}>
                    {e.amount > 0 ? "+" : "−"}
                    {Math.abs(e.amount).toLocaleString("es")}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Sin movimientos.</p>
        )}
      </div>
    </div>
  );
}

export function CustomersPanel({
  slug,
  programId,
  type,
  canManage,
  initialFilter,
  initialCardId,
  emptyHref,
}: {
  slug: string;
  programId: string;
  type: LoyaltyTypeKey;
  canManage: boolean;
  initialFilter: CardFilter;
  initialCardId: string | null;
  /** A dónde mandar para conseguir clientes (pestaña Mostrador). */
  emptyHref: string;
}) {
  const api = `/api/business/${slug}/loyalty/programs/${programId}/cards`;
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<CardFilter>(initialFilter);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<string | null>(initialCardId);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [registering, setRegistering] = useState(false);
  const lastTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);
  useEffect(() => setPage(1), [debounced, filter]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setListError(null);
    const params = new URLSearchParams({ filter, page: String(page) });
    if (debounced) params.set("q", debounced);
    fetch(`${api}?${params}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok || !j?.success) throw new Error(j?.error ?? "No pudimos cargar los clientes.");
        setData(j.data as ListData);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setListError(err.message || "Sin conexión. Probá de nuevo.");
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [api, filter, page, debounced, reload]);

  const loadDetail = useCallback(
    async (id: string, signal?: AbortSignal) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const r = await fetch(`${api}/${id}`, { signal, cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.success) throw new Error(j?.error === "No encontrado" ? "No encontramos ese cliente." : j?.error ?? "No pudimos cargar el cliente.");
        setDetail(j.data as CustomerDetail);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setDetailError((err as Error).message);
      } finally {
        if (!signal?.aborted) setDetailLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    setActionError(null);
    if (!selected) {
      setDetail(null);
      return;
    }
    const ctrl = new AbortController();
    void loadDetail(selected, ctrl.signal);
    return () => ctrl.abort();
  }, [selected, loadDetail]);

  // En el celular la ficha es una hoja encima de la lista: Escape la cierra y el fondo no se desplaza.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    const prev = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    if (detail && headingRef.current) headingRef.current.focus({ preventScroll: true });
  }, [detail?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function open(id: string, trigger: HTMLElement) {
    lastTrigger.current = trigger;
    setSelected(id);
  }

  function close() {
    setSelected(null);
    lastTrigger.current?.focus();
  }

  async function act(body: Record<string, unknown>, key: string) {
    if (!detail) return false;
    setBusy(key);
    setActionError(null);
    const res = await sendJson<CustomerDetail>(`${api}/${detail.id}`, "PATCH", body);
    setBusy(null);
    if (!res.ok) {
      setActionError(res.error);
      return false;
    }
    setDetail(res.data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { birthday, progressLabel, nextTier, toNextTier, expiresOn, referrals, history, ...row } = res.data;
    setData((d) => (d ? { ...d, items: d.items.map((r) => (r.id === row.id ? row : r)) } : d));
    return true;
  }

  const exportHref = `${api}/export?${new URLSearchParams({ filter, ...(debounced ? { q: debounced } : {}) })}`;
  const showEmptyProgram = !loading && !listError && data && data.total === 0 && filter === "all" && !debounced;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, celular, correo, #número o MercavClub"
              aria-label="Buscar clientes"
              className="mv-input h-11 pl-10"
              autoComplete="off"
            />
          </div>
          <button type="button" onClick={() => setRegistering(true)} className="mv-btn mv-btn-primary mv-btn-sm shrink-0">
            <UserPlus className="h-4 w-4" aria-hidden />
            Nuevo cliente
          </button>
          <a href={exportHref} className="mv-btn mv-btn-secondary mv-btn-sm shrink-0" download>
            <Download className="h-4 w-4" aria-hidden />
            Exportar Excel
          </a>
        </div>

        {registering ? (
          <section aria-label="Nuevo cliente" className="mv-panel p-5">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Nuevo cliente</h2>
            <RegisterCustomerForm
              slug={slug}
              programs={[{ id: programId, name: "" }]}
              programId={programId}
              onCancel={() => {
                setRegistering(false);
                setReload((n) => n + 1);
              }}
            />
          </section>
        ) : null}

        <div role="group" aria-label="Filtrar clientes" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {CARD_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "mv-focus inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                filter === f
                  ? "border-transparent bg-gold text-[var(--mv-on-gold)]"
                  : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {CARD_FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="text-xs text-[var(--text-secondary)]">
          {data && !loading ? `${data.total.toLocaleString("es")} ${data.total === 1 ? "cliente" : "clientes"}` : loading ? "Cargando…" : ""}
        </div>

        {listError ? (
          <div role="alert" className="mv-panel flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-[var(--text-primary)]">
            {listError}
            <button type="button" onClick={() => setReload((n) => n + 1)} className="mv-btn mv-btn-secondary mv-btn-sm">
              Reintentar
            </button>
          </div>
        ) : showEmptyProgram ? (
          <div className="mv-panel flex flex-col items-start gap-3 p-6">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/10 text-gold">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Todavía no hay clientes</p>
            <p className="text-sm text-[var(--text-secondary)]">Compartí el link o imprimí el cartel con el QR para el mostrador.</p>
            <Link href={emptyHref} className="mv-btn mv-btn-primary mv-btn-sm">
              Ir a Mostrador
            </Link>
          </div>
        ) : (
          <ul aria-busy={loading} className={cn("mv-panel divide-y divide-[var(--mv-hairline)] p-1", loading && data && "opacity-60")}>
            {!data && loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <li key={i} className="flex items-center gap-3 p-3" aria-hidden>
                    <span className="h-10 w-10 animate-pulse rounded-full bg-[var(--mv-panel-hover)] motion-reduce:animate-none" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-1/3 animate-pulse rounded bg-[var(--mv-panel-hover)] motion-reduce:animate-none" />
                      <span className="block h-3 w-1/4 animate-pulse rounded bg-[var(--mv-panel-hover)] motion-reduce:animate-none" />
                    </span>
                  </li>
                ))
              : data?.items.length
                ? data.items.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={(e) => open(row.id, e.currentTarget)}
                        aria-current={selected === row.id ? "true" : undefined}
                        className={cn(
                          "mv-focus flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-[var(--mv-panel-hover)]",
                          selected === row.id && "bg-[var(--mv-panel-hover)]",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold",
                            row.status === "BLOCKED" ? "bg-red-500/10 text-red-500" : "bg-gold/10 text-gold",
                          )}
                        >
                          {initials(row.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-[var(--text-primary)]">{row.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <span className="shrink-0 tabular-nums text-[var(--text-tertiary)]">#{row.customerNo}</span>
                            <span className="truncate">{row.phone ?? row.email ?? "Sin contacto"}</span>
                            <Badges row={row} type={type} />
                            <HolderBadge status={row.holderStatus} />
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                            {row.balance.toLocaleString("es")} <span className="text-xs font-normal text-[var(--text-secondary)]">{unitWord(type, row.balance)}</span>
                          </span>
                          <span className="block text-[11px] text-[var(--text-tertiary)]">
                            {row.visits} {row.visits === 1 ? "visita" : "visitas"} · {relativeDay(row.lastVisitAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                : (
                    <li className="p-5 text-sm text-[var(--text-secondary)]">{debounced ? `No encontramos clientes para “${debounced}”.` : "No hay clientes con este filtro."}</li>
                  )}
          </ul>
        )}

        {data && data.pages > 1 ? (
          <nav aria-label="Páginas" className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="mv-btn mv-btn-ghost mv-btn-sm">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </button>
            <span className="text-xs tabular-nums text-[var(--text-secondary)]">
              Página {data.page} de {data.pages}
            </span>
            <button type="button" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages || loading} className="mv-btn mv-btn-ghost mv-btn-sm">
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>
        ) : null}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[130] flex items-end bg-black/50 lg:static lg:z-auto lg:block lg:bg-transparent"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <section
            aria-labelledby="customer-title"
            className="mv-panel max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-b-none bg-[var(--color-bg-primary)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:rounded-b-[1.5rem] lg:bg-[var(--mv-panel)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="customer-title" ref={headingRef} tabIndex={-1} className="min-w-0 truncate font-display text-xl font-semibold text-[var(--text-primary)] outline-none">
                {detail?.id === selected ? detail.name : "Cliente"}
              </h2>
              <button type="button" onClick={close} className="mv-focus -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)]">
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Cerrar ficha</span>
              </button>
            </div>
            {detailError ? (
              <p role="alert" className="text-sm text-red-500">
                {detailError}
              </p>
            ) : detailLoading && detail?.id !== selected ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Cargando…
              </div>
            ) : detail ? (
              <DetailView
                slug={slug}
                onHolderChanged={() => {
                  void loadDetail(detail.id);
                  setReload((n) => n + 1);
                }}
                detail={detail}
                type={type}
                canManage={canManage}
                busy={busy}
                error={actionError}
                onAdjust={(delta, note) => act({ action: "adjust", delta, note }, "adjust")}
                onToggleBlock={() => {
                  const blocking = detail.status === "ACTIVE";
                  if (blocking && !window.confirm(`¿Bloquear la tarjeta de ${detail.name}? No va a poder sumar ni canjear hasta que la desbloquees.`)) return;
                  void act({ action: blocking ? "block" : "unblock" }, "block");
                }}
              />
            ) : null}
          </section>
        </div>
      ) : (
        <aside className="mv-panel hidden flex-col items-start gap-2 p-6 lg:sticky lg:top-28 lg:flex">
          <p className="font-display text-base font-semibold text-[var(--text-primary)]">Ficha del cliente</p>
          <p className="text-sm text-[var(--text-secondary)]">Elegí un cliente para ver su saldo, su historial y ajustar si hace falta.</p>
        </aside>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
