"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { KosherPlaceType, KosherStatus } from "@prisma/client";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { fieldClass, labelClass, primaryButton } from "@/components/kosher/ui";
import { HoursEditor } from "@/components/kosher/manage/HoursEditor";
import { PricePicker, ServicesPicker, StatusSelect } from "@/components/kosher/manage/PlaceFields";
import { draftProblems, draftToHours, editableStatuses, hoursToDraft, servicesFor, statusLockedFor } from "@/components/kosher/manage/details";
import { isFoodPlace } from "@/lib/kosher/labels";
import type { DayKey, WeeklyHours } from "@/lib/kosher/hours";
import { cn } from "@/lib/utils";

function useSave(slug: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function save(json: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      await kosherFetch(`/api/kosher/places/${slug}/manage`, { method: "PATCH", json });
      toast.success(success);
      router.refresh();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, save };
}

function SaveRow({ busy, dirty, label }: { busy: boolean; dirty: boolean; label: string }) {
  const viewer = useKosherViewer();
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <button type="submit" disabled={busy || viewer.shabbatLocked} className={cn(primaryButton, "w-full sm:w-auto")}>
        {busy ? "Guardando…" : label}
      </button>
      <p aria-live="polite" className="text-xs text-[var(--text-secondary)]">
        {viewer.shabbatLocked ? "Modo Shabat activo: vas a poder guardar después de Havdalá." : dirty ? "Tenés cambios sin guardar." : ""}
      </p>
    </div>
  );
}

/** Zonas agrupadas por región para el <select>: America, Asia, Europe… */
function groupZones(zones: readonly string[]) {
  const groups = new Map<string, string[]>();
  for (const zone of zones) {
    const region = zone.includes("/") ? zone.split("/")[0] : "Otras";
    groups.set(region, [...(groups.get(region) ?? []), zone]);
  }
  return Array.from(groups.entries());
}

export function HoursSection({
  slug,
  initialHours,
  initialTimezone,
  defaultTimezone,
  zones,
}: {
  slug: string;
  initialHours: WeeklyHours | null;
  initialTimezone: string | null;
  defaultTimezone: string;
  zones: readonly string[];
}) {
  const viewer = useKosherViewer();
  const { busy, save } = useSave(slug);
  const [draft, setDraft] = useState(() => hoursToDraft(initialHours));
  const [timezone, setTimezone] = useState(initialTimezone ?? "");
  const [problems, setProblems] = useState<Partial<Record<DayKey, string>>>({});
  const [saved, setSaved] = useState(() => JSON.stringify({ h: hoursToDraft(initialHours), t: initialTimezone ?? "" }));
  const dirty = JSON.stringify({ h: draft, t: timezone }) !== saved;
  const grouped = useMemo(() => groupZones(zones.includes(timezone) || !timezone ? zones : [timezone, ...zones]), [zones, timezone]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = draftProblems(draft);
    setProblems(found);
    if (Object.keys(found).length) {
      toast.error("Revisá el horario marcado en rojo.");
      return;
    }
    const ok = await save({ hours: draftToHours(draft), timezone: timezone || null }, "Horario guardado.");
    if (ok) setSaved(JSON.stringify({ h: draft, t: timezone }));
  }

  return (
    <form onSubmit={submit} noValidate>
      <HoursEditor
        value={draft}
        disabled={viewer.shabbatLocked}
        problems={problems}
        onChange={(next) => {
          setDraft(next);
          // Después de un intento fallido, los avisos se actualizan mientras se corrige.
          if (Object.keys(problems).length) setProblems(draftProblems(next));
        }}
      />
      <p className="mt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
        Para un turno que pasa la medianoche, poné la hora de cierre del día siguiente: 20:00 a 02:00. De 00:00 a 00:00 es abierto las 24 horas. Si
        dejás todos los días cerrados, la ficha muestra «Sin horario cargado».
      </p>

      <div className="mt-6 border-t border-[var(--mv-hairline)] pt-6">
        <label htmlFor="k-manage-tz" className={labelClass}>
          Zona horaria
        </label>
        <select id="k-manage-tz" className={fieldClass} value={timezone} aria-describedby="k-manage-tz-hint" onChange={(e) => setTimezone(e.target.value)}>
          <option value="">Automática, la del país ({defaultTimezone.replace(/_/g, " ")})</option>
          {grouped.map(([region, list]) => (
            <optgroup key={region} label={region}>
              {list.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p id="k-manage-tz-hint" className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          El horario se lee en la hora local del lugar. Si el país tiene más de una zona horaria, elegí la del lugar.
        </p>
      </div>

      <SaveRow busy={busy} dirty={dirty} label="Guardar horario" />
    </form>
  );
}

export function KashrutSection({
  slug,
  type,
  isModerator,
  initial,
}: {
  slug: string;
  type: KosherPlaceType;
  isModerator: boolean;
  initial: { status: KosherStatus; priceLevel: number | null; services: string[] };
}) {
  const viewer = useKosherViewer();
  const { busy, save } = useSave(slug);
  const food = isFoodPlace(type);
  const [status, setStatus] = useState(initial.status);
  const [priceLevel, setPriceLevel] = useState(initial.priceLevel);
  const [services, setServices] = useState<string[]>(initial.services);
  const [saved, setSaved] = useState(initial);
  const options = editableStatuses(isModerator);
  const locked = statusLockedFor(saved.status, isModerator);
  const dirty = status !== saved.status || priceLevel !== saved.priceLevel || services.join() !== saved.services.join();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const json: Record<string, unknown> = { services };
    if (food) json.priceLevel = priceLevel;
    if (food && status !== saved.status) json.status = status;
    const ok = await save(json, "Datos guardados.");
    if (ok) setSaved({ status, priceLevel, services });
  }

  const note =
    saved.status === "certified" && status !== "certified"
      ? "Al guardar otro nivel, la ficha deja de mostrar el certificado y su vencimiento."
      : locked
        ? "Hay reportes que se contradicen sobre este lugar. El nivel lo resuelve moderación."
        : "«Certificado» no se elige acá: se pide con el certificado vigente y lo verifica moderación con la agencia.";

  return (
    <form onSubmit={submit} className="space-y-7">
      {food && (
        <StatusSelect
          id="k-manage-status"
          type={type}
          value={status}
          options={options}
          current={saved.status}
          onChange={setStatus}
          disabled={locked || viewer.shabbatLocked}
          note={note}
        />
      )}
      {food && <PricePicker name="k-manage-price" value={priceLevel} onChange={setPriceLevel} disabled={viewer.shabbatLocked} />}
      <ServicesPicker options={servicesFor(type)} value={services} onChange={setServices} disabled={viewer.shabbatLocked} />
      <SaveRow busy={busy} dirty={dirty} label="Guardar" />
    </form>
  );
}
// creado por pato dev y askforvini
