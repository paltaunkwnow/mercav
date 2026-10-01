"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MoonStar } from "lucide-react";
import { toast } from "sonner";
import { DENOMINATION, STREAM } from "@/lib/kosher/labels";
import { kosherFetch } from "@/components/kosher/KosherViewer";
import { fieldClass, labelClass, primaryButton } from "@/components/kosher/ui";
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

const field = fieldClass;

export function KosherProfileForm({ communities, initial, role }: { communities: Community[]; initial: Initial; role: string }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const reduce = useReducedMotion();
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
      <section aria-labelledby="k-pref-city" className="mv-panel p-6 md:p-8">
        <h2 id="k-pref-city" className="mv-h3">Tu ciudad y tu corriente</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">La ciudad abre tu sala de chat por defecto y calcula el horario de Shabat.</p>
        <label className={cn(labelClass, "mt-6")} htmlFor="k-city-select">Ciudad</label>
        <select
          id="k-city-select"
          className={field}
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

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="k-denom">Corriente</label>
            <select id="k-denom" className={field} value={state.denomination ?? ""} onChange={(e) => setState((s) => ({ ...s, denomination: e.target.value || null }))}>
              <option value="">Prefiero no decir</option>
              {Object.entries(DENOMINATION).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="k-stream">Dentro de la ortodoxia</label>
            <select id="k-stream" className={cn(field, "disabled:opacity-50")} disabled={state.denomination !== "orthodox"} value={state.orthodoxStream ?? ""} onChange={(e) => setState((s) => ({ ...s, orthodoxStream: e.target.value || null }))}>
              <option value="">—</option>
              {Object.entries(STREAM).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" disabled={saving} onClick={() => save()} className={cn(primaryButton, "mt-6 w-full sm:w-auto")}>
          {saving ? "Guardando…" : "Guardar preferencias"}
        </button>
      </section>

      <section aria-labelledby="k-pref-shabbat" className="mv-panel p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id="k-pref-shabbat" className="mv-h3 flex items-center gap-2">
              <MoonStar className="h-5 w-5 text-techelet" aria-hidden /> Modo Shabat
            </h2>
            <p id="k-shabbat-desc" className="mt-2 text-sm text-[var(--text-secondary)]">
              Mercav Kosher queda en solo lectura desde el encendido de velas hasta Havdalá en tu ciudad.
            </p>
            {selected?.candles && selected.havdalah && (
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                Este Shabat en {selected.city}: velas {clock(selected.candles)}, Havdalá {clock(selected.havdalah)} (18 y 42 minutos). Confirmá los zmanim con tu rabino.
              </p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.shabbatMode}
            aria-labelledby="k-pref-shabbat"
            aria-describedby="k-shabbat-desc"
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
            className={cn("mv-focus relative mt-1 h-8 w-14 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60", state.shabbatMode ? "bg-techelet" : "bg-[var(--mv-panel-hover)] ring-1 ring-inset ring-[var(--mv-hairline-strong)]")}
          >
            <motion.span
              layout={!reduce}
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
              className={cn("absolute top-1 h-6 w-6 rounded-full bg-white shadow", state.shabbatMode ? "right-1" : "left-1")}
            />
          </button>
        </div>
      </section>

      <p className="px-1 text-sm text-[var(--text-secondary)]">Rol en Mercav Kosher: <span className="font-semibold text-[var(--text-primary)]">{role}</span>.</p>
    </div>
  );
}
