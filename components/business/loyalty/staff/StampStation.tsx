"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CircleCheck, Crown, Gift, Keyboard, Loader2, Phone, RotateCcw, ScanLine, TriangleAlert, UserPlus, X } from "@/components/icons";
import { HolderPanel } from "./HolderPanel";
import { RegisterCustomerForm } from "./RegisterCustomerForm";
import { pointsForPurchase } from "@/lib/business/loyalty/engine";
import type { LoyaltyCardView, LoyaltyEventView, LoyaltyProgramView } from "@/lib/business/loyalty/types";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { ActivityList } from "@/components/business/loyalty/public/ActivityList";
import { cardVisualProps, firstName, moneyRound, publicProgram, timeZoneFor, unitWord, units } from "@/components/business/loyalty/public/format";
import { cn } from "@/lib/utils";
import { QrScanner, qrCameraSupported } from "./QrScanner";

/*
 * Pantalla de caja para sellar tarjetas. Pensada para el celular y una sola mano:
 * escanear → ver a quién → un toque para sumar o canjear → escanear la siguiente.
 * Cada toque lleva su propia referencia (clientRef); si se corta la señal, "Reintentar" reenvía la misma
 * y el servidor no duplica el sello.
 */

type Payload = { program: LoyaltyProgramView; card: LoyaltyCardView; history: LoyaltyEventView[] };
type EventResponse = { card: LoyaltyCardView; event: { type: LoyaltyEventView["type"]; amount: number; rewardName?: string }; replayed: boolean; history: LoyaltyEventView[] };
type Pending = { key: string; cardId: string; ref: string; body: { action: "earn" | "redeem"; qty?: number; amount?: number; rewardId?: string } };
type Result = { id: number; tone: "ok" | "error"; title: string; detail?: string | null; retry?: Pending | null };
type LogItem = { id: string; name: string; text: string; at: number };

type PostResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; code?: string };

async function post<T>(url: string, body: unknown): Promise<PostResult<T>> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: string; code?: string } | null;
    if (res.ok && json?.success) return { ok: true, data: json.data as T };
    if (res.status === 401) return { ok: false, status: 401, error: "Tu sesión venció. Volvé a entrar para seguir sellando." };
    return { ok: false, status: res.status, error: json?.error ?? "Algo salió mal. Probá de nuevo.", code: json?.code };
  } catch {
    return { ok: false, status: 0, error: "Sin conexión. Revisá la señal y reintentá." };
  }
}

function newRef() {
  try {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* contexto sin randomUUID */
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** "1.234,50" o "1234.5" → 1234.5 */
function parseAmount(raw: string) {
  const text = raw.replace(/\s/g, "");
  if (!text) return 0;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const decimal = lastComma > lastDot ? "," : ".";
  const normalized = decimal === "," ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function buzz() {
  try {
    navigator.vibrate?.(30);
  } catch {
    /* sin vibración */
  }
}

function clock(at: number) {
  return new Date(at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function StampStation({ slug, programs, initialCode }: { slug: string; programs: LoyaltyProgramView[]; initialCode: string | null }) {
  const storageKey = `mv:sellar:${slug}`;
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [cameraOk, setCameraOk] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phone, setPhone] = useState("");
  // Alta de un cliente nuevo (con lo que se buscó y no apareció) y elección cuando hay varios resultados.
  const [registering, setRegistering] = useState<{ phone?: string; clubCode?: string } | null>(null);
  const [choices, setChoices] = useState<{ serial: string; programName: string; customerName: string; customerNo: number }[] | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [log, setLog] = useState<LogItem[]>([]);
  const resultSeq = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    setCameraOk(qrCameraSupported());
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && programs.some((p) => p.id === saved)) setProgramId(saved);
    } catch {
      /* almacenamiento bloqueado */
    }
  }, [storageKey, programs]);

  function chooseProgram(id: string) {
    setProgramId(id);
    try {
      window.localStorage.setItem(storageKey, id);
    } catch {
      /* almacenamiento bloqueado */
    }
  }

  const show = useCallback((payload: Payload) => {
    setData(payload);
    setResult(null);
    setConfirm(null);
    setAmount("");
    setOpenError(null);
    if (programs.some((p) => p.id === payload.program.id)) setProgramId(payload.program.id);
  }, [programs]);

  const openCard = useCallback(
    async (code: string) => {
      setScanning(false);
      setOpening(true);
      setOpenError(null);
      const res = await post<Payload>(`/api/business/${slug}/loyalty/scan`, { code, programId });
      setOpening(false);
      if (res.ok) {
        show(res.data);
        setManual("");
        buzz();
      } else {
        setOpenError(res.error);
      }
    },
    [slug, programId, show],
  );

  // Viene de "Sellar esta tarjeta" en la tarjeta web (?card=SERIAL).
  useEffect(() => {
    if (started.current || !initialCode) return;
    started.current = true;
    void openCard(initialCode);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("card");
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {
      /* sin history */
    }
  }, [initialCode, openCard]);

  /** Buscar por número de cliente (#12), código MercavClub (MC-…) o celular, en el club elegido. */
  async function lookup(e: FormEvent) {
    e.preventDefault();
    const query = phone.trim();
    if (!query) return;
    setOpening(true);
    setOpenError(null);
    setNotFound(null);
    setChoices(null);
    const res = await post<{ match?: Payload; choices?: { serial: string; programName: string; customerName: string; customerNo: number }[] }>(
      `/api/business/${slug}/loyalty/search`,
      { query, programId },
    );
    setOpening(false);
    if (res.ok && res.data.match) {
      show(res.data.match);
      setPhone("");
      buzz();
    } else if (res.ok && res.data.choices) {
      setChoices(res.data.choices);
    } else if (!res.ok && res.code === "NOT_FOUND") {
      setNotFound(query);
    } else if (!res.ok) {
      setOpenError(res.error);
    }
  }

  function registerFrom(query: string | null) {
    const q = query?.trim() ?? "";
    setRegistering(/^MC/i.test(q) ? { clubCode: q } : /\d{6,}/.test(q.replace(/\D/g, "")) ? { phone: q } : {});
    setNotFound(null);
  }

  function reset(openScanner: boolean) {
    setData(null);
    setResult(null);
    setConfirm(null);
    setAmount("");
    setOpenError(null);
    if (openScanner && cameraOk) setScanning(true);
  }

  async function send(p: Pending) {
    if (busy) return;
    setBusy(p.key);
    setResult(null);
    const res = await post<EventResponse>(`/api/business/${slug}/loyalty/cards/${p.cardId}/events`, { ...p.body, clientRef: p.ref });
    setBusy(null);
    const id = ++resultSeq.current;
    if (!res.ok) {
      const retry = res.status === 0 || res.status >= 500 ? p : null;
      setResult({ id, tone: "error", title: res.error, detail: retry ? "No sabemos si llegó: reintentá y no se va a sumar dos veces." : null, retry });
      return;
    }
    const { card, event, replayed, history } = res.data;
    setData((d) => (d && d.card.id === card.id ? { ...d, card, history } : d));
    setConfirm(null);
    setAmount("");
    const type = data?.program.type ?? "STAMPS";
    const name = firstName(card.customerName);
    const title =
      event.type === "REDEEM" ? `${name} canjeó ${event.rewardName ?? "un premio"}` : `+${units(type, event.amount)} para ${name}`;
    setResult({ id, tone: "ok", title, detail: replayed ? "Ya estaba registrado: no se sumó dos veces." : card.progress.label });
    setLog((l) => [{ id: `${id}-${card.id}`, name: card.customerName, text: event.type === "REDEEM" ? `Canjeó ${event.rewardName ?? "un premio"}` : `+${units(type, event.amount)}`, at: Date.now() }, ...l].slice(0, 8));
    buzz();
  }

  function earnStamps(qty: number) {
    if (!data) return;
    void send({ key: `stamps-${qty}`, cardId: data.card.id, ref: newRef(), body: { action: "earn", qty } });
  }

  function earnPurchase(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    const value = parseAmount(amount);
    if (!value) return;
    void send({ key: "purchase", cardId: data.card.id, ref: newRef(), body: { action: "earn", amount: value } });
  }

  function redeemReward(rewardId: string) {
    if (!data) return;
    void send({ key: `redeem-${rewardId}`, cardId: data.card.id, ref: newRef(), body: { action: "redeem", rewardId } });
  }

  const selected = programs.find((p) => p.id === programId) ?? programs[0];

  // ——— Tarjeta abierta ———
  if (data) {
    const { program, card, history } = data;
    const pub = publicProgram(program);
    const type = program.type;
    const active = program.status === "ACTIVE";
    const quick = [1, 2, 3].filter((q) => q <= program.rules.maxPerAction);
    const purchase = parseAmount(amount);
    const preview = type === "POINTS" ? pointsForPurchase(purchase, program.rules) : 0;
    const pending = program.rewards.filter((r) => r.active && r.cost > card.balance).sort((a, b) => a.cost - b.cost);
    const money = (v: number) => moneyRound(v, program.workspace.country, program.workspace.currency);

    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <section aria-label="Cliente" className="mv-panel flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--text-tertiary)]">{program.name}</p>
              <h2 className="truncate font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">{card.customerName}</h2>
            </div>
            <button type="button" onClick={() => reset(false)} className="mv-btn mv-btn-ghost h-10 w-10 shrink-0 px-0" aria-label="Cerrar tarjeta">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {card.tier.current ? (
              <span className="mv-chip mv-chip-gold">
                <Crown className="h-3.5 w-3.5" aria-hidden />
                {card.tier.current.name}
              </span>
            ) : null}
            <span className="mv-chip tabular-nums">{type === "STAMPS" ? `${card.balance} de ${program.rules.stampsGoal} sellos` : units("POINTS", card.balance)}</span>
            <span className="mv-chip tabular-nums">
              {card.visits} {card.visits === 1 ? "visita" : "visitas"}
            </span>
            <span className="mv-chip tabular-nums">Cliente #{card.customerNo}</span>
          </div>
          <p className="text-[15px] font-medium text-[var(--text-primary)]">{card.progress.label}</p>
          <HolderPanel
            slug={slug}
            cardId={card.id}
            status={card.holderStatus}
            customerName={card.customerName}
            canUnlink={false}
            onChange={(next) => setData((d) => (d && d.card.id === next.card.id ? { ...d, ...next } : d))}
          />
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--mv-gold-wash)]" aria-hidden>
            <div className="h-full rounded-full bg-gold transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${card.progress.percent}%` }} />
          </div>
        </section>

        {result ? (
          <div
            key={result.id}
            role={result.tone === "error" ? "alert" : "status"}
            className={cn(
              "mv-pop flex flex-col items-center gap-2 rounded-[1.5rem] border p-5 text-center",
              result.tone === "ok" ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]" : "border-red-500/30 bg-red-500/10",
            )}
          >
            {result.tone === "ok" ? <CircleCheck className="h-10 w-10 text-gold" aria-hidden /> : <TriangleAlert className="h-8 w-8 text-red-400" aria-hidden />}
            <p className={cn("font-display font-semibold leading-tight text-[var(--text-primary)]", result.tone === "ok" ? "text-2xl" : "text-lg")}>{result.title}</p>
            {result.detail ? <p className="text-sm text-[var(--text-secondary)]">{result.detail}</p> : null}
            {result.retry ? (
              <button type="button" onClick={() => result.retry && send(result.retry)} disabled={!!busy} className="mv-btn mv-btn-primary mt-1">
                {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
                Reintentar
              </button>
            ) : null}
          </div>
        ) : null}

        {!active ? (
          <p className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-[var(--text-primary)]">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            Este club no está activo: no se pueden sumar ni canjear {unitWord(type, 2)}.
          </p>
        ) : type === "STAMPS" ? (
          <section aria-label="Sumar sellos" className="flex flex-col gap-2">
            <button type="button" onClick={() => earnStamps(1)} disabled={!!busy} className="mv-btn mv-btn-primary h-16 w-full text-lg">
              {busy === "stamps-1" ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
              +1 sello
            </button>
            {quick.length > 1 ? (
              <div className="grid grid-cols-2 gap-2">
                {quick.slice(1).map((q) => (
                  <button key={q} type="button" onClick={() => earnStamps(q)} disabled={!!busy} className="mv-btn mv-btn-secondary h-12 w-full" aria-label={`Sumar ${q} sellos`}>
                    {busy === `stamps-${q}` ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}+{q}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <form onSubmit={earnPurchase} aria-label="Sumar puntos" className="mv-panel flex flex-col gap-3 p-4 sm:p-5">
            <label htmlFor="purchase-amount" className="text-sm font-semibold text-[var(--text-primary)]">
              Monto de la compra
            </label>
            <input
              id="purchase-amount"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,\s]/g, ""))}
              placeholder={money(program.rules.unitAmount * 5)}
              className="mv-input h-14 text-xl font-semibold tabular-nums"
              aria-describedby="purchase-hint"
            />
            <p id="purchase-hint" className="text-xs text-[var(--text-secondary)]">
              {units("POINTS", program.rules.pointsPerUnit)} cada {money(program.rules.unitAmount)}
              {purchase > 0 && preview === 0 ? ` · el mínimo es ${money(program.rules.unitAmount)}` : ""}
            </p>
            <button type="submit" disabled={!!busy || preview < 1} className="mv-btn mv-btn-primary h-14 w-full text-lg">
              {busy === "purchase" ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
              {preview > 0 ? `Sumar ${units("POINTS", preview)}` : "Sumar puntos"}
            </button>
          </form>
        )}

        {active && card.progress.available.length ? (
          <section aria-labelledby="redeem-title" className="mv-panel flex flex-col gap-3 p-4 sm:p-5">
            <h3 id="redeem-title" className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Gift className="h-4 w-4 text-gold" aria-hidden />
              Para canjear
            </h3>
            <ul className="flex flex-col gap-2">
              {card.progress.available.map((r) => (
                <li key={r.id} className="rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-3">
                  {confirm === r.id ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                        ¿Canjear {r.name}? Se descuentan {units(type, r.cost)}.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setConfirm(null)} className="mv-btn mv-btn-secondary h-12">
                          Cancelar
                        </button>
                        <button type="button" onClick={() => redeemReward(r.id)} disabled={!!busy} className="mv-btn mv-btn-primary h-12" autoFocus>
                          {busy === `redeem-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                          Sí, canjear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{r.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{units(type, r.cost)}</p>
                      </div>
                      <button type="button" onClick={() => setConfirm(r.id)} disabled={!!busy} className="mv-btn mv-btn-primary h-11 shrink-0 px-5">
                        Canjear
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-label="Detalle de la tarjeta" className="mv-panel flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex justify-center">
            <LoyaltyCard {...cardVisualProps(pub, card)} side="back" size="sm" />
          </div>
          {pending.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-[var(--text-secondary)]">
                  <span className="truncate">{r.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {r.cost - card.balance === 1 ? "falta" : "faltan"} {units(type, r.cost - card.balance)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {card.tier.next && card.tier.toNext !== null ? (
            <p className="text-xs text-[var(--text-secondary)]">
              {units(type, card.tier.toNext)} para el nivel {card.tier.next.name}
            </p>
          ) : null}
          <div className="border-t border-[var(--mv-hairline)] pt-2">
            <p className="pt-1 text-xs font-semibold text-[var(--text-tertiary)]">Últimos movimientos</p>
            <ActivityList events={history} type={type} timeZone={timeZoneFor(program.workspace.country)} voice="staff" compact />
          </div>
        </section>

        <button type="button" onClick={() => reset(true)} className="mv-btn mv-btn-secondary mv-btn-lg w-full">
          <ScanLine className="h-5 w-5" aria-hidden />
          Escanear otra
        </button>

        {scanning ? <QrScanner onDetected={openCard} onClose={() => setScanning(false)} /> : null}
      </div>
    );
  }

  // ——— Lista para escanear ———
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      {programs.length > 1 ? (
        <div role="radiogroup" aria-label="Club" className="flex flex-wrap gap-2">
          {programs.map((p) => {
            const on = p.id === selected?.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => chooseProgram(p.id)}
                className={cn(
                  "mv-focus h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                  on ? "border-transparent bg-gold text-[var(--mv-on-gold)]" : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {selected && selected.type === "STAMPS" && selected.rules.selfService ? (
        <a
          href={`/business/${slug}/fidelizacion/${selected.id}/mostrador`}
          className="mv-panel mv-panel-interactive mv-focus flex items-center justify-between gap-3 px-4 py-3 text-left text-sm"
        >
          <span>
            <span className="block font-semibold text-[var(--text-primary)]">Pantalla de autoservicio</span>
            <span className="block text-xs text-[var(--text-secondary)]">Abrila en la tablet del mostrador: tus clientes suman su sello escaneando el QR.</span>
          </span>
          <span aria-hidden className="text-gold">→</span>
        </a>
      ) : null}

      {registering ? (
        <section aria-label="Nuevo cliente" className="mv-panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Nuevo cliente</h2>
          <RegisterCustomerForm
            slug={slug}
            programs={programs}
            programId={programId}
            prefill={registering}
            onCancel={() => setRegistering(null)}
            onDone={(r) => {
              setRegistering(null);
              show({ program: r.program, card: r.card, history: r.history });
            }}
          />
        </section>
      ) : null}

      <section aria-labelledby="scan-title" className={cn("mv-panel flex flex-col items-center gap-4 p-6 text-center", registering && "hidden")}>
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--mv-gold-wash)] text-gold" aria-hidden>
          {opening ? <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none" /> : <ScanLine className="h-7 w-7" />}
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="scan-title" className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {opening ? "Abriendo tarjeta…" : "Escaneá la tarjeta del cliente"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {selected ? `${selected.name}: pedile que abra su tarjeta y apuntá al QR.` : "Pedile que abra su tarjeta y apuntá al QR."}
          </p>
        </div>
        {cameraOk ? (
          <button type="button" onClick={() => setScanning(true)} disabled={opening} className="mv-btn mv-btn-primary h-16 w-full text-lg">
            <ScanLine className="h-5 w-5" aria-hidden />
            Escanear tarjeta
          </button>
        ) : (
          <p className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-3 text-left text-sm leading-snug text-[var(--text-secondary)]">
            Este navegador no lee QR con la cámara. En iPhone, escaneá la tarjeta con la app Cámara y tocá «Sellar esta tarjeta», o escribí el código.
          </p>
        )}
        {openError ? (
          <p role="alert" className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
            {openError}
          </p>
        ) : null}
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) void openCard(manual.trim());
        }}
        className="mv-panel flex flex-col gap-2 p-4"
      >
        <label htmlFor="card-code" className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Keyboard className="h-4 w-4 text-gold" aria-hidden />
          Código de la tarjeta
        </label>
        <div className="flex gap-2">
          <input
            id="card-code"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="ABCD EFGH IJKL…"
            className="mv-input mv-data min-w-0 flex-1 uppercase placeholder:font-sans placeholder:normal-case"
          />
          <button type="submit" disabled={!manual.trim() || opening} className="mv-btn mv-btn-secondary shrink-0 px-5">
            Abrir
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">Está debajo del QR, en grupos de 4.</p>
      </form>

      <div className="mv-panel flex flex-col p-4">
        <button
          type="button"
          onClick={() => setPhoneOpen((v) => !v)}
          aria-expanded={phoneOpen}
          aria-controls="phone-lookup"
          className="mv-focus -m-1 flex items-center gap-2 rounded-xl p-1 text-left text-sm font-semibold text-[var(--text-primary)]"
        >
          <Phone className="h-4 w-4 text-gold" aria-hidden />
          Buscar cliente
          <span className="ml-auto text-xs font-medium text-[var(--text-tertiary)]">{phoneOpen ? "Ocultar" : "N.º de cliente, MercavClub o celular"}</span>
        </button>
        {phoneOpen ? (
          <form id="phone-lookup" onSubmit={lookup} className="mt-3 flex flex-col gap-2">
            <label htmlFor="lookup-phone" className="sr-only">
              Celular del cliente
            </label>
            <div className="flex gap-2">
              <input
                id="lookup-phone"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="#12, MC-XXXX-XXXXX o celular"
                className="mv-input min-w-0 flex-1"
              />
              <button type="submit" disabled={!phone.trim() || opening} className="mv-btn mv-btn-secondary shrink-0 px-5">
                Buscar
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {programs.length > 1 && selected ? `Busca en ${selected.name}. ` : ""}El número de cliente está en su tarjeta; el código MercavClub, en su cuenta Mercav.
            </p>
            {choices ? (
              <ul className="mt-1 flex flex-col gap-1.5" aria-label="Resultados">
                {choices.map((c) => (
                  <li key={c.serial}>
                    <button type="button" onClick={() => { setChoices(null); void openCard(c.serial); }} className="mv-panel mv-panel-interactive mv-focus flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm">
                      <span className="min-w-0 truncate font-semibold text-[var(--text-primary)]">{c.customerName}</span>
                      <span className="shrink-0 text-[var(--text-secondary)]">#{c.customerNo} · {c.programName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {notFound ? (
              <div role="status" className="mt-1 flex flex-col gap-2 rounded-[1rem] bg-[var(--mv-panel-sunk)] p-3 text-sm text-[var(--text-primary)]">
                No encontramos a ese cliente en tu negocio.
                <button type="button" onClick={() => registerFrom(notFound)} className="mv-btn mv-btn-secondary mv-btn-sm w-fit">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Registrarlo
                </button>
              </div>
            ) : null}
          </form>
        ) : null}
        {!registering ? (
          <button type="button" onClick={() => registerFrom(null)} className="mv-btn mv-btn-ghost mv-btn-sm mt-3 w-fit">
            <UserPlus className="h-4 w-4" aria-hidden />
            Nuevo cliente
          </button>
        ) : null}
      </div>

      {log.length ? (
        <section aria-labelledby="log-title" className="flex flex-col gap-2">
          <h2 id="log-title" className="text-sm font-semibold text-[var(--text-secondary)]">
            Últimas acciones
          </h2>
          <ul className="mv-panel flex flex-col divide-y divide-[var(--mv-hairline)] px-4">
            {log.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate font-medium text-[var(--text-primary)]">{item.name}</span>
                <span className="shrink-0 text-[var(--text-secondary)]">
                  {item.text} · <time>{clock(item.at)}</time>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {scanning ? <QrScanner onDetected={openCard} onClose={() => setScanning(false)} /> : null}
    </div>
  );
}
// creado por pato dev y askforvini
