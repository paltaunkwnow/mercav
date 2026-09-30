"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { MoonStar } from "lucide-react";
import { toast } from "sonner";
import { DENOMINATION, STREAM } from "@/lib/kosher/labels";
import { kosherFetch } from "@/components/kosher/KosherViewer";
import { cn } from "@/lib/utils";

type Community = { slug: string; name: string; city: string; countryCode: string; lat: number; lng: number; timezone: string; candles: string | null; havdalah: string | null };
type Initial = {
  city: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  shabbatMode: boolean;
  denomination: string | null;
  orthodoxStream: string | null;
};

const field =
  "h-12 w-full rounded-xl border border-border bg-bg-tertiary px-4 text-sm text-[var(--text-primary)] outline-none hover:border-gold/30 focus:border-gold/50 focus:ring-2 focus:ring-gold/15";

export function KosherProfileForm({ communities, initial, role }: { communities: Community[]; initial: Initial; role: string }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const selected = communities.find((c) => c.city === state.city && c.countryCode === state.countryCode);
  const clock = (iso: string) => new Intl.DateTimeFormat("es", { timeZone: selected!.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

  async function save(next = state) {
    setSaving(true);
    try {
      await kosherFetch("/api/kosher/profile", {
        method: "PATCH",
        json: {
          city: next.city,
          countryCode: next.countryCode,
          lat: next.lat,
          lng: next.lng,
          timezone: next.timezone,
          shabbatMode: next.shabbatMode,
          denomination: next.denomination || null,
          orthodoxStream: next.orthodoxStream || null,
        },
      });
      toast.success("Preferencias guardadas");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setState(initial);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-border bg-bg-secondary p-6 md:p-8">
        <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Tu ciudad</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Abre tu sala de chat por defecto y calcula el horario de Shabat.</p>
        <label className="sr-only" htmlFor="k-city-select">Ciudad</label>
        <select
          id="k-city-select"
          className={cn(field, "mt-4")}
          value={selected?.slug ?? ""}
          onChange={(e) => {
            const c = communities.find((x) => x.slug === e.target.value);
            setState((s) => ({ ...s, city: c?.city ?? null, countryCode: c?.countryCode ?? null, lat: c?.lat ?? null, lng: c?.lng ?? null, timezone: c?.timezone ?? null }));
          }}
        >
          <option value="">Elegí tu comunidad</option>
          {communities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]" htmlFor="k-denom">Corriente</label>
            <select id="k-denom" className={field} value={state.denomination ?? ""} onChange={(e) => setState((s) => ({ ...s, denomination: e.target.value || null }))}>
              <option value="">Prefiero no decir</option>
              {Object.entries(DENOMINATION).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]" htmlFor="k-stream">Dentro de la ortodoxia</label>
            <select id="k-stream" className={field} disabled={state.denomination !== "orthodox"} value={state.orthodoxStream ?? ""} onChange={(e) => setState((s) => ({ ...s, orthodoxStream: e.target.value || null }))}>
              <option value="">—</option>
              {Object.entries(STREAM).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" disabled={saving} onClick={() => save()} className="mt-6 h-11 rounded-full bg-gold px-6 text-sm font-semibold text-black disabled:opacity-50">
          Guardar
        </button>
      </section>

      <section className="rounded-[2rem] border border-border bg-bg-secondary p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-[var(--text-primary)]">
              <MoonStar className="h-5 w-5 text-techelet" aria-hidden /> Modo Shabat
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Mercav Kosher queda en solo lectura desde el encendido de velas hasta Havdalá en tu ciudad.
            </p>
            {selected?.candles && selected.havdalah && (
              <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                Este Shabat en {selected.city}: velas {clock(selected.candles)}, Havdalá {clock(selected.havdalah)} (18 y 42 minutos). Confirmá los zmanim con tu rabino.
              </p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.shabbatMode}
            aria-label="Modo Shabat"
            disabled={saving}
            onClick={() => {
              const next = { ...state, shabbatMode: !state.shabbatMode };
              if (next.shabbatMode && next.lat == null) {
                toast.error("Elegí tu ciudad primero.");
                return;
              }
              setState(next);
              save(next);
            }}
            className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", state.shabbatMode ? "bg-techelet" : "bg-bg-tertiary ring-1 ring-border")}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
              className={cn("absolute top-1 h-6 w-6 rounded-full bg-white shadow", state.shabbatMode ? "right-1" : "left-1")}
            />
          </button>
        </div>
      </section>

      <p className="px-2 text-xs text-[var(--text-tertiary)]">Rol en Mercav Kosher: {role}.</p>
    </div>
  );
}
