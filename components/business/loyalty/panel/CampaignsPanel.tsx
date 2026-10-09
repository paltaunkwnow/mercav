"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BellRing, Loader2, Megaphone, Send, Users } from "@/components/icons";
import { Field, Notice } from "@/components/business/ui";
import { sendJson } from "@/lib/business/client";
import { AUDIENCE_LABELS, type CampaignAudience } from "@/lib/business/loyalty/campaigns";
import type { CampaignView } from "@/lib/business/loyalty/stats-core";
import { cn } from "@/lib/utils";
import { CharCount, NumberInput, optionCard } from "./controls";
import type { ProgramStatus } from "./status";

type Kind = CampaignAudience["kind"];

function useFormatter(timeZone: string) {
  return useMemo(() => {
    const full = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone });
    const day = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone });
    return { full: (iso: string) => full.format(new Date(iso)), day: (iso: string) => day.format(new Date(iso)) };
  }, [timeZone]);
}

export function CampaignsPanel({
  slug,
  programId,
  status,
  canManage,
  tiers,
  initialCampaigns,
  timeZone,
  today,
  maxDay,
}: {
  slug: string;
  programId: string;
  status: ProgramStatus;
  canManage: boolean;
  tiers: string[];
  initialCampaigns: CampaignView[];
  timeZone: string;
  /** yyyy-mm-dd de hoy y de dentro de un año, en la zona de la empresa. */
  today: string;
  maxDay: string;
}) {
  const api = `/api/business/${slug}/loyalty/programs/${programId}/campaigns`;
  const fmt = useFormatter(timeZone);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [days, setDays] = useState(30);
  const [tier, setTier] = useState(tiers[0] ?? "");
  const [withExpiry, setWithExpiry] = useState(false);
  const [expiresOn, setExpiresOn] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const canSend = canManage && (status === "ACTIVE" || status === "PAUSED");

  const audience: CampaignAudience = useMemo(() => {
    if (kind === "atRisk") return { kind, days };
    if (kind === "tier") return { kind, tier };
    return { kind } as CampaignAudience;
  }, [kind, days, tier]);

  useEffect(() => {
    if (!canManage) return;
    if (audience.kind === "tier" && !audience.tier) return setCount(0);
    let alive = true;
    setCounting(true);
    const t = window.setTimeout(async () => {
      const res = await sendJson<{ recipients: number }>(`${api}?preview=1`, "POST", { audience });
      if (!alive) return;
      setCounting(false);
      setCount(res.ok ? res.data.recipients : null);
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [api, audience, canManage]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(null);
    if (title.trim().length < 2) return setError("Poné un título.");
    if (body.trim().length < 2) return setError("Escribí el mensaje.");
    if (withExpiry && !expiresOn) return setError("Elegí hasta cuándo se muestra, o sacá la fecha.");
    if (count === 0) return setError("Con ese público no le llega a nadie. Probá con otro.");
    if (!window.confirm(`¿Mandar “${title.trim()}” a ${count ?? "tus"} ${count === 1 ? "cliente" : "clientes"}?`)) return;
    setBusy(true);
    const res = await sendJson<CampaignView>(api, "POST", { title: title.trim(), body: body.trim(), audience, expiresOn: withExpiry ? expiresOn : null });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setCampaigns((list) => [res.data, ...list]);
    setSent(`Listo. Le llega a ${res.data.recipients} ${res.data.recipients === 1 ? "cliente" : "clientes"}.`);
    setTitle("");
    setBody("");
    setWithExpiry(false);
    setExpiresOn("");
  }

  const kinds: Kind[] = ["all", "atRisk", "rewardReady", ...(tiers.length ? (["tier"] as Kind[]) : []), "birthdayMonth"];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      {canManage ? (
        <form onSubmit={submit} className="mv-panel flex flex-col gap-5 p-5 sm:p-6" aria-labelledby="compose-title">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 id="compose-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Nuevo mensaje
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">Una promo, un aviso o un “te extrañamos”. Corto y claro funciona mejor.</p>
            </div>
          </div>

          {!canSend ? (
            <Notice tone="warn">{status === "DRAFT" ? "Activá el programa para mandar mensajes." : "El programa está archivado. Restauralo para mandar mensajes."}</Notice>
          ) : null}

          <fieldset disabled={!canSend || busy} className="flex flex-col gap-5 disabled:opacity-70">
            <Field label="Título" htmlFor="campaign-title" hint={<CharCount value={title} max={60} />}>
              <input id="campaign-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Martes de 2x1" className="mv-input h-11" autoComplete="off" />
            </Field>
            <Field label="Mensaje" htmlFor="campaign-body" hint={<CharCount value={body} max={240} />}>
              <textarea
                id="campaign-body"
                value={body}
                maxLength={240}
                rows={3}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Mostrá tu tarjeta este martes y llevate dos cafés por el precio de uno."
                className="mv-input h-auto min-h-[6rem] resize-y py-3 leading-relaxed"
              />
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">¿A quién le llega?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {kinds.map((k) => (
                  <label key={k} className="relative">
                    <input type="radio" name="campaign-audience" checked={kind === k} onChange={() => setKind(k)} className="peer sr-only" />
                    <span className={cn(optionCard, "items-center p-3 text-sm font-medium text-[var(--text-primary)]")}>{AUDIENCE_LABELS[k]}</span>
                  </label>
                ))}
              </div>
              {kind === "atRisk" ? (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span>Sin venir hace</span>
                  <NumberInput id="campaign-days" label="Días sin venir" value={days} min={7} max={365} onChange={setDays} className="w-24" />
                  <span>días o más</span>
                </div>
              ) : null}
              {kind === "tier" ? (
                <div className="mt-1 max-w-xs">
                  <label htmlFor="campaign-tier" className="sr-only">
                    Nivel
                  </label>
                  <select id="campaign-tier" value={tier} onChange={(e) => setTier(e.target.value)} className="mv-input h-11">
                    {tiers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </fieldset>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <input type="checkbox" checked={withExpiry} onChange={(e) => setWithExpiry(e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
                Que deje de mostrarse en una fecha
              </label>
              {withExpiry ? (
                <div className="max-w-xs">
                  <label htmlFor="campaign-expiry" className="sr-only">
                    Último día
                  </label>
                  <input id="campaign-expiry" type="date" value={expiresOn} min={today} max={maxDay} onChange={(e) => setExpiresOn(e.target.value)} className="mv-input h-11" />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Se muestra hasta el final de ese día.</p>
                </div>
              ) : null}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 rounded-2xl bg-[var(--mv-panel-hover)] p-4">
            <p className="flex items-center gap-2 text-sm text-[var(--text-primary)]" aria-live="polite">
              <Users className="h-4 w-4 text-gold" aria-hidden />
              {counting ? (
                <span className="text-[var(--text-secondary)]">Contando…</span>
              ) : count === null ? (
                <span className="text-[var(--text-secondary)]">No pudimos contar los destinatarios.</span>
              ) : (
                <span>
                  Le llega a <strong className="font-semibold tabular-nums">{count.toLocaleString("es")}</strong> {count === 1 ? "cliente" : "clientes"}
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Solo a quienes aceptaron recibir mensajes y tienen la tarjeta activa.</p>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
            Hoy el mensaje aparece en la tarjeta web de cada cliente, la próxima vez que la abra. Muy pronto también va a llegar como aviso en Apple Wallet y Google Wallet.
          </p>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}
          {sent ? (
            <p role="status" className="text-sm font-medium text-emerald-500">
              {sent}
            </p>
          ) : null}

          <button type="submit" disabled={!canSend || busy || counting} className="mv-btn mv-btn-primary mv-btn-sm w-fit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Mandar mensaje
          </button>
        </form>
      ) : (
        <Notice>Solo quien administra el programa puede mandar mensajes. Acá ves los que ya se mandaron.</Notice>
      )}

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
          Mensajes enviados
        </h2>
        {campaigns.length ? (
          <ul className="flex flex-col gap-3">
            {campaigns.map((c) => {
              const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;
              return (
                <li key={c.id} className="mv-panel flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-semibold text-[var(--text-primary)]">{c.title}</p>
                    <span className="mv-chip shrink-0 tabular-nums">
                      <Users className="h-3 w-3" aria-hidden />
                      {c.recipients.toLocaleString("es")}
                      <span className="sr-only"> destinatarios</span>
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {c.audienceLabel} · <time dateTime={c.createdAt} suppressHydrationWarning>{fmt.full(c.createdAt)}</time>
                    {c.createdByName ? ` · ${c.createdByName}` : ""}
                  </p>
                  {c.expiresAt ? (
                    <p className={cn("text-xs", expired ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]")} suppressHydrationWarning>
                      {expired ? "Ya no se muestra" : "Se muestra hasta el"} {fmt.day(c.expiresAt)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mv-panel p-5 text-sm text-[var(--text-secondary)]">Todavía no mandaste mensajes.</p>
        )}
      </section>
    </div>
  );
}
// creado por pato dev y askforvini
