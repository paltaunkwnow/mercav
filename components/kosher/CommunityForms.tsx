"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Link2, LocateFixed, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { fieldClass, labelClass, primaryButton, secondaryButton } from "@/components/kosher/ui";
import { CHESED_KIND, EVENT_KIND, MEALS, PRAYER } from "@/lib/kosher/labels";
import { formatKm, haversineKm } from "@/lib/kosher/geo";
import { cn } from "@/lib/utils";

type Option = [value: string, label: string];
type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "datetime" | "date" | "url" | "tel" | "select" | "checkboxes";
  options?: Option[];
  required?: boolean;
  max?: number;
  min?: number;
  placeholder?: string;
  hint?: string;
  half?: boolean;
};
type Values = Record<string, string | string[]>;

function initialValues(fields: Field[], initial: Values = {}): Values {
  return Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === "checkboxes" ? [] : "")]));
}

function serialize(fields: Field[], values: Values) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "checkboxes") out[f.name] = v;
    else if (v === "") out[f.name] = null;
    else if (f.type === "number") out[f.name] = Number(v);
    else out[f.name] = v;
  }
  return out;
}

function KosherForm({
  fields,
  action,
  method = "POST",
  submitLabel,
  initial,
  transform,
  success,
  reset = true,
  onDone,
  className,
}: {
  fields: Field[];
  action: string;
  method?: "POST" | "PUT" | "PATCH";
  submitLabel: string;
  initial?: Values;
  transform?: (data: Record<string, unknown>) => unknown;
  success: string;
  reset?: boolean;
  onDone?: (data: Record<string, unknown>) => void;
  className?: string;
}) {
  const router = useRouter();
  const viewer = useKosherViewer();
  const [values, setValues] = useState(() => initialValues(fields, initial));
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = serialize(fields, values);
      const data = await kosherFetch<{ message?: string }>(action, { method, json: transform ? transform(body) : body });
      toast.success(data.message ?? success);
      if (reset) setValues(initialValues(fields, initial));
      onDone?.(data as Record<string, unknown>);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = (name: string, value: string | string[]) => setValues((v) => ({ ...v, [name]: value }));

  return (
    <form onSubmit={submit} aria-busy={busy} className={cn("grid gap-5 md:grid-cols-2", className)}>
      {fields.map((f) => {
        const id = `kf-${action.replace(/\W/g, "")}-${f.name}`;
        const hintId = f.hint ? `${id}-hint` : undefined;
        const value = values[f.name];
        const autoComplete = f.name === "contactName" ? "name" : f.name === "contactRole" ? "organization-title" : f.type === "tel" ? "tel" : f.type === "url" ? "url" : undefined;
        return (
          <div key={f.name} className={f.half ? "" : "md:col-span-2"}>
            {f.type === "checkboxes" ? (
              <fieldset>
                <legend className={labelClass}>{f.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {f.options!.map(([v, l]) => {
                    const on = (value as string[]).includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => set(f.name, on ? (value as string[]).filter((x) => x !== v) : [...(value as string[]), v])}
                        className={cn(
                          "mv-focus inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                          on
                            ? "bg-[var(--mv-gold-wash)] text-gold ring-1 ring-inset ring-[var(--color-border-gold)]"
                            : "border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)]",
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                        {l}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <>
                <label htmlFor={id} className={labelClass}>
                  {f.label}
                  {!f.required && <span className="font-normal text-[var(--text-tertiary)]"> · opcional</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    id={id}
                    rows={4}
                    required={f.required}
                    aria-describedby={hintId}
                    maxLength={f.max}
                    placeholder={f.placeholder}
                    value={value as string}
                    onChange={(e) => set(f.name, e.target.value)}
                    className={cn(fieldClass, "h-auto min-h-[7.5rem] resize-y py-3")}
                  />
                ) : f.type === "select" ? (
                  <select id={id} required={f.required} aria-describedby={hintId} value={value as string} onChange={(e) => set(f.name, e.target.value)} className={fieldClass}>
                    {!f.required && <option value="">—</option>}
                    {f.required && !value && <option value="">Elegí una opción</option>}
                    {f.options!.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={f.type === "datetime" ? "datetime-local" : f.type}
                    required={f.required}
                    aria-describedby={hintId}
                    autoComplete={autoComplete}
                    inputMode={f.type === "number" ? "numeric" : undefined}
                    maxLength={f.max && f.type !== "number" ? f.max : undefined}
                    min={f.type === "number" ? f.min : undefined}
                    max={f.type === "number" ? f.max : undefined}
                    placeholder={f.placeholder}
                    value={value as string}
                    onChange={(e) => set(f.name, e.target.value)}
                    className={fieldClass}
                  />
                )}
                {f.hint && <p id={hintId} className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{f.hint}</p>}
              </>
            )}
          </div>
        );
      })}
      <div className="flex flex-col gap-3 md:col-span-2">
        <button type="submit" disabled={busy || viewer.shabbatLocked} className={cn(primaryButton, "w-full sm:w-auto sm:self-start")}>
          {busy ? "Enviando…" : submitLabel}
        </button>
        {viewer.shabbatLocked && <p className="text-xs text-[var(--text-secondary)]">Modo Shabat activo: vas a poder enviar después de Havdalá.</p>}
      </div>
    </form>
  );
}

type CityOpt = { slug: string; city: string };
type PlaceOpt = { slug: string; name: string; city: string };
const cityOptions = (cities: CityOpt[]): Option[] => cities.map((c) => [c.slug, c.city]);
const placeOptions = (places: PlaceOpt[]): Option[] => places.map((p) => [p.slug, `${p.name} · ${p.city}`]);

export function EventForm({ cities, places, city }: { cities: CityOpt[]; places: PlaceOpt[]; city: string }) {
  return (
    <KosherForm
      action="/api/kosher/events"
      submitLabel="Enviar a la agenda"
      success="Enviado. Un moderador lo revisa antes de publicarlo."
      initial={{ citySlug: city, kind: "comunidad" }}
      fields={[
        { name: "title", label: "Título", type: "text", required: true, max: 120 },
        { name: "kind", label: "Tipo", type: "select", required: true, options: Object.entries(EVENT_KIND), half: true },
        { name: "citySlug", label: "Ciudad", type: "select", required: true, options: cityOptions(cities), half: true },
        { name: "startsAt", label: "Empieza", type: "datetime", required: true, half: true, hint: "En la hora local de la ciudad." },
        { name: "endsAt", label: "Termina", type: "datetime", half: true },
        { name: "placeSlug", label: "Lugar del atlas", type: "select", options: placeOptions(places), hint: "Si lo organiza una institución que administra su ficha, se publica como oficial." },
        { name: "body", label: "Detalles", type: "textarea", max: 1500, placeholder: "Quién lo da, para quién es, si hay que inscribirse…" },
      ]}
    />
  );
}

export function MinyanForm({ cities, places, city }: { cities: CityOpt[]; places: PlaceOpt[]; city: string }) {
  return (
    <KosherForm
      action="/api/kosher/minyanim"
      submitLabel="Pedir minián"
      success="Publicado. Te sumamos como el primero de los diez."
      initial={{ citySlug: city, prayer: "mincha" }}
      fields={[
        { name: "prayer", label: "Tefilá", type: "select", required: true, options: Object.entries(PRAYER), half: true },
        { name: "startsAt", label: "Cuándo", type: "datetime", required: true, half: true, hint: "En la hora local de la ciudad." },
        { name: "citySlug", label: "Ciudad", type: "select", required: true, options: cityOptions(cities), half: true },
        { name: "placeSlug", label: "Sinagoga o lugar", type: "select", options: placeOptions(places), half: true },
        { name: "locationNote", label: "Punto de encuentro", type: "text", max: 160, placeholder: "Si no es en una sinagoga: zona o referencia pública" },
        { name: "note", label: "Nota", type: "text", max: 200, placeholder: "Ej.: es para decir kadish por mi padre" },
      ]}
    />
  );
}

export function ChesedForm({ cities, city }: { cities: CityOpt[]; city: string }) {
  return (
    <KosherForm
      action="/api/kosher/chesed"
      submitLabel="Enviar al tablón"
      success="Enviado. Un moderador de la kehilá lo revisa antes de publicarlo."
      initial={{ citySlug: city, kind: "volunteer", days: "14" }}
      fields={[
        { name: "title", label: "Título", type: "text", required: true, max: 120 },
        { name: "kind", label: "Tipo", type: "select", required: true, options: Object.entries(CHESED_KIND), half: true },
        { name: "citySlug", label: "Ciudad", type: "select", required: true, options: cityOptions(cities), half: true },
        { name: "body", label: "Qué se necesita", type: "textarea", required: true, max: 1500 },
        { name: "contact", label: "Cómo contactar", type: "text", max: 160, placeholder: "Institución, teléfono público o «escribime por el chat de la ciudad»", hint: "No publiques datos de salud ni direcciones de terceros.", half: true },
        { name: "days", label: "Visible durante", type: "select", required: true, options: [["7", "7 días"], ["14", "14 días"], ["30", "30 días"]], half: true },
      ]}
      transform={(d) => ({ ...d, days: Number(d.days) })}
    />
  );
}

export function HostForm({ cities, initial, existing }: { cities: CityOpt[]; initial: Values; existing: boolean }) {
  return (
    <KosherForm
      action="/api/kosher/hosts"
      method="PUT"
      reset={false}
      submitLabel={existing ? "Guardar cambios" : "Ofrecer mi mesa"}
      success="Guardado. Un moderador de la kehilá lo revisa antes de mostrarlo."
      initial={initial}
      fields={[
        { name: "citySlug", label: "Ciudad", type: "select", required: true, options: cityOptions(cities), half: true },
        { name: "capacity", label: "Invitados por Shabat", type: "number", required: true, min: 1, max: 20, half: true },
        { name: "meals", label: "Comidas", type: "checkboxes", options: Object.entries(MEALS) },
        { name: "kashrut", label: "Kashrut de tu casa", type: "text", required: true, max: 160, placeholder: "Ej.: cocina con hashgajá, carne Ajdut, jalav Israel" },
        { name: "about", label: "Sobre tu mesa", type: "textarea", required: true, max: 1000, placeholder: "Idiomas, familia, niños, zona aproximada. La dirección se comparte solo al aceptar." },
        { name: "active", label: "Estado", type: "select", required: true, options: [["yes", "Recibiendo invitados"], ["no", "En pausa"]], half: true },
      ]}
      transform={(d) => ({ ...d, active: d.active === "yes" })}
    />
  );
}

export function HostRequestForm({ hostId, onDone }: { hostId: string; onDone?: () => void }) {
  return (
    <KosherForm
      action={`/api/kosher/hosts/${hostId}/requests`}
      submitLabel="Enviar pedido"
      success="Pedido enviado. Te avisamos cuando responda."
      initial={{ guests: "1" }}
      onDone={onDone}
      fields={[
        { name: "date", label: "Shabat del", type: "date", required: true, half: true, hint: "El viernes o el sábado." },
        { name: "guests", label: "Personas", type: "number", required: true, min: 1, max: 10, half: true },
        { name: "message", label: "Presentate", type: "textarea", required: true, max: 600, placeholder: "Quiénes son, de dónde vienen, restricciones de comida." },
      ]}
    />
  );
}

export function ClaimForm({ slug, kind }: { slug: string; kind: "ownership" | "certificate" }) {
  const certificate: Field[] = [
    { name: "agencyName", label: "Agencia certificadora", type: "text", required: true, max: 80, half: true },
    { name: "certExpiresAt", label: "Vence el", type: "date", required: true, half: true },
    { name: "certificateUrl", label: "Enlace al certificado", type: "url", required: true, max: 300, hint: "PDF o página de la agencia. Lo verificamos con la agencia antes de marcar «Certificado»." },
  ];
  return (
    <KosherForm
      action={`/api/kosher/places/${slug}/claim`}
      submitLabel={kind === "ownership" ? "Solicitar administrar la ficha" : "Enviar certificado"}
      success="Recibido. Un moderador lo verifica y te avisa."
      transform={(d) => ({ ...d, kind })}
      fields={[
        { name: "contactName", label: "Tu nombre", type: "text", required: true, max: 80, half: true },
        { name: "contactRole", label: "Tu rol", type: "text", required: true, max: 80, placeholder: "Dueño, gerente, secretaría…", half: true },
        { name: "contactPhone", label: "Teléfono del lugar", type: "tel", max: 40, half: true },
        ...(kind === "certificate" ? certificate : []),
        { name: "evidence", label: "Cómo lo verificamos", type: "textarea", required: true, max: 800, placeholder: "Correo con el dominio del lugar, página oficial donde figurás, o un teléfono público al que podamos llamar." },
      ]}
    />
  );
}

export function ManageForm({ slug, initial }: { slug: string; initial: Values }) {
  return (
    <KosherForm
      action={`/api/kosher/places/${slug}/manage`}
      method="PATCH"
      reset={false}
      submitLabel="Guardar ficha"
      success="Ficha actualizada."
      initial={initial}
      fields={[
        { name: "phone", label: "Teléfono", type: "tel", max: 40, half: true },
        { name: "website", label: "Sitio web", type: "url", max: 300, half: true },
        { name: "shacharit", label: "Shajarit", type: "text", max: 20, placeholder: "07:30", half: true },
        { name: "mincha", label: "Minjá", type: "text", max: 20, placeholder: "18:15", half: true },
        { name: "maariv", label: "Arvit", type: "text", max: 20, placeholder: "19:00", half: true },
        { name: "notes", label: "Información para la comunidad", type: "textarea", max: 800 },
      ]}
      transform={(d) => ({
        phone: d.phone,
        website: d.website,
        notes: d.notes,
        prayerTimes: d.shacharit || d.mincha || d.maariv ? { shacharit: d.shacharit ?? undefined, mincha: d.mincha ?? undefined, maariv: d.maariv ?? undefined } : null,
      })}
    />
  );
}

export function InviteRedeemForm({ token, slug }: { token: string; slug: string }) {
  const router = useRouter();
  return (
    <KosherForm
      action={`/api/kosher/invites/${token}`}
      submitLabel="Aceptar y administrar la ficha"
      success="Listo. Ya administrás esta ficha."
      onDone={() => router.push(`/kosher/lugar/${slug}/administrar`)}
      fields={[
        { name: "contactName", label: "Tu nombre", type: "text", required: true, max: 80, half: true },
        { name: "contactRole", label: "Tu rol en la institución", type: "text", required: true, max: 80, half: true },
        { name: "contactPhone", label: "Teléfono de contacto", type: "tel", max: 40 },
      ]}
    />
  );
}

export function AlertsForm({
  cities,
  topics,
  initial,
}: {
  cities: { slug: string; city: string; countryCode: string }[];
  topics: Record<string, string>;
  initial: { city: string; countryCode: string; topics: string[] }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const subs = new Map(initial.map((a) => [`${a.city}|${a.countryCode}`, a.topics]));

  async function toggle(c: (typeof cities)[number], topic: string) {
    const current = subs.get(`${c.city}|${c.countryCode}`) ?? [];
    const next = current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic];
    setBusy(`${c.slug}-${topic}`);
    try {
      await kosherFetch("/api/kosher/alerts", { method: "PUT", json: { citySlug: c.slug, topics: next } });
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="k-alerts" className="mv-panel mt-4 p-6 md:p-8">
      <h2 id="k-alerts" className="mv-h3">Alertas por ciudad</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">Te avisamos en la campana de Mercav. Elegí qué querés recibir en cada ciudad.</p>
      <ul className="mt-5 divide-y divide-[var(--mv-hairline)]">
        {cities.map((c) => {
          const on = subs.get(`${c.city}|${c.countryCode}`) ?? [];
          return (
            <li key={c.slug} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{c.city}</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(topics).map(([topic, label]) => {
                  const active = on.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      role="switch"
                      aria-checked={active}
                      aria-label={`${label} en ${c.city}`}
                      disabled={busy === `${c.slug}-${topic}`}
                      onClick={() => toggle(c, topic)}
                      className={cn(
                        "mv-focus inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200 disabled:opacity-50",
                        active
                          ? "bg-techelet-dim text-techelet ring-1 ring-inset ring-techelet/40"
                          : "border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:border-techelet/40 hover:text-[var(--text-primary)]",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" aria-hidden />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function act(url: string, init: RequestInit & { json?: unknown }, ok: string, router: ReturnType<typeof useRouter>) {
  try {
    const data = await kosherFetch<{ message?: string }>(url, init);
    toast.success(data.message ?? ok);
    router.refresh();
  } catch (e) {
    toast.error((e as Error).message);
  }
}

export function RsvpButton({ id, going }: { id: string; going: boolean }) {
  const router = useRouter();
  const viewer = useKosherViewer();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy || viewer.shabbatLocked}
      aria-pressed={going}
      onClick={async () => {
        if (!viewer.signedIn) return router.push("/login?callbackUrl=/kosher/comunidad/minian");
        setBusy(true);
        await act(`/api/kosher/minyanim/${id}/rsvp`, { method: "POST" }, going ? "Te bajaste del minián." : "Anotado. Gracias por sumar.", router);
        setBusy(false);
      }}
      className={going ? secondaryButton : primaryButton}
    >
      <UserCheck className="h-4 w-4" aria-hidden />
      {going ? "No voy a poder" : "Voy"}
    </button>
  );
}

export function RowAction({ url, method = "PATCH", json, label, done, tone = "secondary" }: { url: string; method?: string; json?: unknown; label: string; done: string; tone?: "primary" | "secondary" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await act(url, { method, json }, done, router);
        setBusy(false);
      }}
      className={cn(tone === "primary" ? primaryButton : secondaryButton, "px-4 text-sm")}
    >
      {label}
    </button>
  );
}

export function HostRequestActions({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <RowAction url={`/api/kosher/host-requests/${id}`} json={{ status: "declined" }} label="No puedo" done="Respondiste que no." />
      <RowAction url={`/api/kosher/host-requests/${id}`} json={{ status: "accepted" }} label="Aceptar" done="Aceptado. Le avisamos." tone="primary" />
    </div>
  );
}

export function HostRequestToggle({ hostId, name }: { hostId: string; name: string }) {
  const viewer = useKosherViewer();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (viewer.signedIn ? setOpen(true) : router.push("/login?callbackUrl=/kosher/comunidad/shabat"))}
        className={cn(primaryButton, "w-full sm:w-auto")}
      >
        Pedir lugar en su mesa
      </button>
    );
  }
  return (
    <div className="mv-fade mt-4 rounded-2xl border border-[var(--mv-hairline-strong)] bg-[var(--mv-panel)] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Pedido a {name}</p>
        <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="mv-focus -mr-1 grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <HostRequestForm hostId={hostId} onDone={() => setOpen(false)} />
    </div>
  );
}

export function NearestCityButton({ cities, basePath }: { cities: { slug: string; city: string; lat: number; lng: number }[]; basePath: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (!navigator.geolocation) return toast.error("Tu navegador no comparte ubicación. Elegí la ciudad de la lista.");
        setBusy(true);
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const here = { lat: coords.latitude, lng: coords.longitude };
            const nearest = [...cities].sort((a, b) => haversineKm(here, a) - haversineKm(here, b))[0];
            const km = haversineKm(here, nearest);
            toast.success(km > 150 ? `La comunidad más cercana es ${nearest.city}, a ${formatKm(km)}.` : `Estás en ${nearest.city}.`);
            router.push(`${basePath}?ciudad=${nearest.slug}`);
            setBusy(false);
          },
          () => {
            toast.error("No pudimos leer tu ubicación. Elegí la ciudad de la lista.");
            setBusy(false);
          },
          { maximumAge: 600_000, timeout: 10_000 },
        );
      }}
      className={secondaryButton}
    >
      <LocateFixed className="h-4 w-4" aria-hidden />
      {busy ? "Buscando…" : "Usar mi ubicación"}
    </button>
  );
}

export function InviteButton({ slug }: { slug: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (url) {
    return (
      <div className="rounded-2xl border border-techelet/30 bg-techelet-dim p-3">
        <p className="text-xs text-[var(--text-secondary)]">Enlace de invitación, válido 30 días y para una sola persona:</p>
        <div className="mt-2 flex gap-2">
          <input readOnly value={url} aria-label="Enlace de invitación" className={cn(fieldClass, "mv-data h-11 text-xs")} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            aria-label="Copiar enlace"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              toast.success("Enlace copiado");
            }}
            className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-[var(--mv-on-gold)] transition-transform duration-150 active:scale-[0.97]"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const data = await kosherFetch<{ token: string }>(`/api/kosher/places/${slug}/invites`, { method: "POST" });
          setUrl(`${window.location.origin}/kosher/invitacion/${data.token}`);
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
      className={secondaryButton}
    >
      <Link2 className="h-4 w-4" aria-hidden /> Invitar a la institución
    </button>
  );
}
