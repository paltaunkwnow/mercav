"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Clock, LocateFixed } from "@/components/icons";
import { toast } from "sonner";
import type { KosherFood, KosherPlaceType, KosherStatus } from "@prisma/client";
import { FOOD, PLACE_TYPES, isFoodPlace } from "@/lib/kosher/labels";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { SlideConfirm } from "@/components/motion/SlideConfirm";
import { SignInCard, fieldClass, labelClass } from "@/components/kosher/ui";
import { HoursEditor } from "@/components/kosher/manage/HoursEditor";
import { PricePicker, ServicesPicker, StatusSelect } from "@/components/kosher/manage/PlaceFields";
import { DEFAULT_SUGGEST_STATUS, SUGGEST_STATUSES, draftProblems, draftToHours, emptyDraft, servicesFor } from "@/components/kosher/manage/details";
import { buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

const field = fieldClass;
const label = labelClass;
const legend = "mv-h3 mb-5";

export function SuggestPlaceForm() {
  const viewer = useKosherViewer();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState({
    name: "",
    type: "restaurant" as KosherPlaceType,
    address: "",
    city: viewer.city ?? "",
    country: "",
    countryCode: "",
    lat: "",
    lng: "",
    foodCategory: "" as KosherFood | "",
    agencyName: "",
    notes: "",
  });
  // Opcionales: nivel de kashrut, horario, precio y servicios.
  const [status, setStatus] = useState<KosherStatus>(DEFAULT_SUGGEST_STATUS);
  const [showHours, setShowHours] = useState(false);
  const [hours, setHours] = useState(emptyDraft);
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!viewer.signedIn) {
    return (
      <SignInCard callbackUrl="/kosher/sugerir">
        Así sabemos quién sugiere cada lugar y podemos contactarte si falta un dato.
      </SignInCard>
    );
  }

  function here() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
      () => toast.error("No pudimos acceder a tu ubicación. Pegá las coordenadas desde Google Maps."),
    );
  }

  const food = isFoodPlace(form.type);
  const allowedServices = servicesFor(form.type);
  const hourProblems = showHours ? draftProblems(hours) : {};
  const hoursOk = Object.keys(hourProblems).length === 0;

  const lat = Number(form.lat);
  const lng = Number(form.lng);
  const valid =
    hoursOk &&
    form.name.trim().length >= 2 &&
    form.address.trim().length >= 2 &&
    form.city.trim().length >= 2 &&
    form.country.trim().length >= 2 &&
    /^[a-zA-Z]{2}$/.test(form.countryCode) &&
    form.lat !== "" && form.lng !== "" &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const missing = [
    form.name.trim().length < 2 && "nombre",
    form.address.trim().length < 2 && "dirección",
    form.city.trim().length < 2 && "ciudad",
    form.country.trim().length < 2 && "país",
    !/^[a-zA-Z]{2}$/.test(form.countryCode) && "código de país",
    !(form.lat !== "" && form.lng !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) && "ubicación",
    !hoursOk && "revisar el horario",
  ].filter(Boolean) as string[];

  async function submit() {
    try {
      const res = await kosherFetch<{ slug: string; published: boolean }>("/api/kosher/places", {
        method: "POST",
        json: {
          name: form.name,
          type: form.type,
          address: form.address,
          city: form.city,
          country: form.country,
          countryCode: form.countryCode,
          lat,
          lng,
          foodCategory: form.foodCategory || undefined,
          agencyName: (food && form.agencyName) || undefined,
          notes: form.notes || undefined,
          status: food ? status : undefined,
          hours: showHours ? (draftToHours(hours) ?? undefined) : undefined,
          priceLevel: food ? priceLevel : undefined,
          services: services.filter((s) => allowedServices.includes(s as (typeof allowedServices)[number])),
        },
      });
      if (res.published) {
        toast.success("Publicado en el mapa.");
        router.push(`/kosher/mapa?lugar=${res.slug}`);
      } else {
        toast.success("Gracias. Un moderador lo revisa y lo publica.");
        router.push("/kosher/mapa");
      }
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="mv-panel space-y-10 p-6 md:p-8" noValidate>
      <fieldset>
        <legend className={legend}>El lugar</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={label} htmlFor="k-name">Nombre</label>
            <input id="k-name" required autoComplete="organization" className={field} value={form.name} onChange={set("name")} maxLength={120} placeholder="Ej.: Panadería Shalom" />
          </div>
          <div>
            <label className={label} htmlFor="k-type">Tipo</label>
            <select id="k-type" className={field} value={form.type} onChange={set("type")}>
              {Object.entries(PLACE_TYPES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="k-food">
              Categoría <span className="font-normal text-[var(--text-tertiary)]">· opcional</span>
            </label>
            <select id="k-food" className={field} value={form.foodCategory} onChange={set("foodCategory")}>
              <option value="">No aplica</option>
              {Object.entries(FOOD).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Dónde está</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={label} htmlFor="k-address">Dirección</label>
            <input id="k-address" required autoComplete="street-address" className={field} value={form.address} onChange={set("address")} maxLength={200} placeholder="Calle y número o referencia" />
          </div>
          <div>
            <label className={label} htmlFor="k-city">Ciudad</label>
            <input id="k-city" required autoComplete="address-level2" className={field} value={form.city} onChange={set("city")} maxLength={80} />
          </div>
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <div>
              <label className={label} htmlFor="k-country">País</label>
              <input id="k-country" required autoComplete="country-name" className={field} value={form.country} onChange={set("country")} maxLength={80} />
            </div>
            <div>
              <label className={label} htmlFor="k-cc">Código</label>
              <input
                id="k-cc"
                required
                autoComplete="country"
                autoCapitalize="characters"
                aria-describedby="k-cc-hint"
                className={cn(field, "mv-data uppercase")}
                value={form.countryCode}
                onChange={set("countryCode")}
                maxLength={2}
                placeholder="BO"
              />
            </div>
          </div>
          <p id="k-cc-hint" className="-mt-2 text-xs text-[var(--text-secondary)] md:col-span-2">
            El código de país son dos letras: AR, BO, BR, CL, UY…
          </p>
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span id="k-loc-label" className={cn(label, "mb-0")}>Ubicación</span>
              <button type="button" onClick={here} className={buttonClass("secondary", "sm", "h-10 px-4 text-sm")}>
                <LocateFixed className="h-4 w-4" aria-hidden /> Estoy acá
              </button>
            </div>
            <div role="group" aria-labelledby="k-loc-label" aria-describedby="k-loc-hint" className="grid grid-cols-2 gap-3">
              <input aria-label="Latitud" inputMode="decimal" autoComplete="off" className={cn(field, "mv-data")} value={form.lat} onChange={set("lat")} placeholder="-17.7833" />
              <input aria-label="Longitud" inputMode="decimal" autoComplete="off" className={cn(field, "mv-data")} value={form.lng} onChange={set("lng")} placeholder="-63.1821" />
            </div>
            <p id="k-loc-hint" className="mt-2 text-xs text-[var(--text-secondary)]">
              Latitud y longitud. Usá «Estoy acá» si estás en el lugar, o copialas desde Google Maps.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>{food ? "Kashrut y notas" : "Notas"}</legend>
        <div className="grid gap-5">
          {food && (
            <StatusSelect
              id="k-status"
              type={form.type}
              value={status}
              options={SUGGEST_STATUSES}
              onChange={setStatus}
              note="«Certificado» lo marca moderación cuando el lugar envía su certificado vigente. Si sabés qué agencia lo certifica, escribila abajo."
            />
          )}
          <div className={food ? "" : "hidden"}>
            <label className={label} htmlFor="k-agency">
              Agencia certificadora <span className="font-normal text-[var(--text-tertiary)]">· si la tiene</span>
            </label>
            <input id="k-agency" className={field} value={form.agencyName} onChange={set("agencyName")} maxLength={80} placeholder="Ej.: OU, Jabad, Rabinato local" />
          </div>
          <div>
            <label className={label} htmlFor="k-notes">
              Notas <span className="font-normal text-[var(--text-tertiary)]">· opcional</span>
            </label>
            <textarea id="k-notes" className={cn(field, "h-28 resize-none py-3")} value={form.notes} onChange={set("notes")} maxLength={600} placeholder="Qué se consigue, cómo se maneja la kashrut, si cierra en los jaguim…" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Horario{food ? ", precio" : ""} y servicios</legend>
        <p className="-mt-3 mb-5 text-sm text-[var(--text-secondary)]">Todo opcional. Si no estás seguro de un dato, dejalo vacío.</p>
        <div className="grid gap-7">
          <div>
            <button
              type="button"
              aria-expanded={showHours}
              aria-controls="k-hours-editor"
              onClick={() => setShowHours((v) => !v)}
              className={buttonClass("secondary", "sm", "h-10 px-4 text-sm")}
            >
              <Clock className="h-4 w-4" aria-hidden /> {showHours ? "Quitar el horario" : "Sumar el horario"}
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 motion-reduce:transition-none", showHours && "rotate-180")} aria-hidden />
            </button>
            {showHours && (
              <div id="k-hours-editor" className="mt-5">
                <HoursEditor value={hours} onChange={setHours} problems={hourProblems} />
                <p className="mt-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  En la hora local del lugar. Para un turno que pasa la medianoche, poné la hora de cierre del día siguiente: 20:00 a 02:00.
                </p>
              </div>
            )}
          </div>
          {food && <PricePicker name="k-price" value={priceLevel} onChange={setPriceLevel} />}
          <ServicesPicker options={allowedServices} value={services} onChange={setServices} />
        </div>
      </fieldset>

      <div className="space-y-4 border-t border-[var(--mv-hairline)] pt-8">
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Al enviar confirmás que la información es de buena fe según los{" "}
          <Link href="/kosher/terminos" className="mv-link">Términos de Mercav Kosher</Link>. Mercav Kosher no emite hechsher: si el lugar tiene
          certificación, la revisamos con la agencia.
        </p>
        <div className={cn("transition-opacity duration-200", !valid && "opacity-50")}>
          <SlideConfirm
            key={attempt}
            variant="gold"
            disabled={!valid}
            label={valid ? "Deslizá para enviar" : "Completá los datos"}
            className="w-full rounded-[2rem]"
            onConfirm={() => {
              submit().catch(() => window.setTimeout(() => setAttempt((n) => n + 1), 900));
            }}
          />
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-[var(--text-secondary)]">
          {!valid && missing.length > 0 ? `Falta: ${missing.join(", ")}.` : ""}
        </p>
      </div>
    </form>
  );
}
