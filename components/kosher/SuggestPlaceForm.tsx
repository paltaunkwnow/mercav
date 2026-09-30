"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import type { KosherFood, KosherPlaceType } from "@prisma/client";
import { FOOD, PLACE_TYPES } from "@/lib/kosher/labels";
import { kosherFetch, useKosherViewer } from "@/components/kosher/KosherViewer";
import { SlideConfirm } from "@/components/motion/SlideConfirm";
import { cn } from "@/lib/utils";

const field =
  "h-12 w-full rounded-xl border border-border bg-bg-tertiary px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] hover:border-gold/30 focus:border-gold/50 focus:ring-2 focus:ring-gold/15";
const label = "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";

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
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!viewer.signedIn) {
    return (
      <div className="rounded-[2rem] border border-border bg-bg-secondary p-8 text-center">
        <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Entrá con tu cuenta Mercav</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Así sabemos quién sugiere cada lugar y podemos contactarte si falta un dato.</p>
        <Link href="/login?callbackUrl=/kosher/sugerir" className="mt-6 inline-flex h-12 items-center rounded-full bg-gold px-7 text-sm font-semibold text-black">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  function here() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
      () => toast.error("No pudimos acceder a tu ubicación. Pegá las coordenadas desde Google Maps."),
    );
  }

  const lat = Number(form.lat);
  const lng = Number(form.lng);
  const valid =
    form.name.trim().length >= 2 &&
    form.address.trim().length >= 2 &&
    form.city.trim().length >= 2 &&
    form.country.trim().length >= 2 &&
    /^[a-zA-Z]{2}$/.test(form.countryCode) &&
    form.lat !== "" && form.lng !== "" &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

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
          agencyName: form.agencyName || undefined,
          notes: form.notes || undefined,
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
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5 rounded-[2rem] border border-border bg-bg-secondary p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label} htmlFor="k-name">Nombre</label>
          <input id="k-name" className={field} value={form.name} onChange={set("name")} maxLength={120} placeholder="Ej.: Panadería Shalom" />
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
          <label className={label} htmlFor="k-food">Categoría</label>
          <select id="k-food" className={field} value={form.foodCategory} onChange={set("foodCategory")}>
            <option value="">No aplica</option>
            {Object.entries(FOOD).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="k-address">Dirección</label>
          <input id="k-address" className={field} value={form.address} onChange={set("address")} maxLength={200} placeholder="Calle y número o referencia" />
        </div>
        <div>
          <label className={label} htmlFor="k-city">Ciudad</label>
          <input id="k-city" className={field} value={form.city} onChange={set("city")} maxLength={80} />
        </div>
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <div>
            <label className={label} htmlFor="k-country">País</label>
            <input id="k-country" className={field} value={form.country} onChange={set("country")} maxLength={80} />
          </div>
          <div>
            <label className={label} htmlFor="k-cc">Código</label>
            <input id="k-cc" className={cn(field, "uppercase")} value={form.countryCode} onChange={set("countryCode")} maxLength={2} placeholder="BO" />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className={cn(label, "mb-0")}>Ubicación</span>
            <button type="button" onClick={here} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-gold/40">
              <LocateFixed className="h-3.5 w-3.5" aria-hidden /> Estoy acá
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input aria-label="Latitud" inputMode="decimal" className={field} value={form.lat} onChange={set("lat")} placeholder="Latitud, ej. -17.7833" />
            <input aria-label="Longitud" inputMode="decimal" className={field} value={form.lng} onChange={set("lng")} placeholder="Longitud, ej. -63.1821" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="k-agency">Agencia certificadora (si la tiene)</label>
          <input id="k-agency" className={field} value={form.agencyName} onChange={set("agencyName")} maxLength={80} placeholder="Ej.: OU, Jabad, Rabinato local" />
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="k-notes">Notas</label>
          <textarea id="k-notes" className={cn(field, "h-24 resize-none py-3")} value={form.notes} onChange={set("notes")} maxLength={600} placeholder="Horarios, qué se consigue, cómo se maneja la kashrut…" />
        </div>
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">
        Al enviar confirmás que la información es de buena fe según los{" "}
        <Link href="/kosher/terminos" className="underline underline-offset-4 hover:text-gold">Términos de Mercav Kosher</Link>.
      </p>
      <div className={cn("transition-opacity", !valid && "opacity-40")}>
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
    </form>
  );
}
