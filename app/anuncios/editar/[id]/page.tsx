"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin } from "@/components/icons";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Container, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { BackLink, Field, FormSection, ImageListEditor, PageLoading, SavedOverlay, formatMoney, textareaClass } from "@/components/anuncios/market-ui";

export default function EditarEspacioPage() {
  const { id } = (useParams() ?? {}) as { id?: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    type: "VALLA",
    city: "",
    pricePerMonth: "",
    width: "",
    height: "",
    orientation: "NORTE",
    material: "LONA",
    images: []
  });
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`/api/spaces/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            title: data.data.title,
            description: data.data.description,
            type: data.data.type,
            city: data.data.city,
            pricePerMonth: data.data.pricePerMonth,
            width: data.data.width,
            height: data.data.height,
            orientation: data.data.orientation || "NORTE",
            material: data.data.material || "LONA",
            images: data.data.images?.map((img: any) => img.url) || []
          });
        }
      } catch (error) {
        console.error("Error fetching space:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpace();
  }, [id]);

  const addImage = () => {
    if (imageUrl && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl("");
    }
  };

  const removeImage = (url: string) => {
    setFormData({ ...formData, images: formData.images.filter((img: string) => img !== url) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/spaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/anuncios/mis-espacios"), 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Cargando tu espacio…" />;
  }

  const set = (patch: Record<string, unknown>) => setFormData({ ...formData, ...patch });

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <BackLink href="/anuncios/mis-espacios">Volver a mis espacios</BackLink>
        <header className="mt-6 flex max-w-3xl flex-col gap-4">
          <p className="mv-kicker">Mercav Publicidad</p>
          <h1 className="mv-h2">Editar espacio</h1>
          <p className="mv-lead">Actualizá fotos, descripción y ficha técnica. Los cambios se ven en el catálogo apenas guardás.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection id="ed-media" title="Fotos" description="La primera imagen es la que se muestra en el catálogo.">
              <ImageListEditor
                id="ed-image"
                images={formData.images}
                draft={imageUrl}
                onDraftChange={setImageUrl}
                onAdd={addImage}
                onRemove={removeImage}
              />
            </FormSection>

            <FormSection id="ed-info" title="Información general">
              <Field label="Título" htmlFor="ed-title" required>
                <input
                  id="ed-title"
                  required 
                  value={formData.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="Ej. Valla premium en Segundo Anillo"
                  className="mv-input"
                />
              </Field>
              <Field label="Descripción y referencias" htmlFor="ed-desc" required hint="Puntos de referencia, visibilidad, qué incluye el alquiler.">
                <textarea 
                  id="ed-desc"
                  required 
                  rows={6}
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Describí los puntos de referencia exactos…"
                  aria-describedby="ed-desc-hint"
                  className={textareaClass}
                />
              </Field>
            </FormSection>
          </div>

          <aside aria-label="Ficha técnica y guardado" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <FormSection id="ed-specs" title="Ficha técnica">
              <ChoiceMenu
                label="Tipo de soporte"
                value={formData.type}
                onChange={(val) => set({ type: val })}
                options={[
                  { value: "VALLA", label: "Valla publicitaria" },
                  { value: "PANTALLA", label: "Pantalla digital" },
                  { value: "LETRERO", label: "Letrero" },
                  { value: "VIDRIERA", label: "Vidriera / local" },
                  { value: "AUTO", label: "Transporte" },
                  { value: "OTRO", label: "Otro soporte" },
                ]}
              />
              <Field label="Ciudad" htmlFor="ed-city" required>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" aria-hidden />
                  <input id="ed-city" type="text" required autoComplete="address-level2" value={formData.city} onChange={(e) => set({ city: e.target.value })} className="mv-input pl-11" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ancho (m)" htmlFor="ed-width">
                  <input id="ed-width" type="number" inputMode="decimal" step="any" min={0} value={formData.width} onChange={(e) => set({ width: e.target.value })} className="mv-input mv-data" />
                </Field>
                <Field label="Alto (m)" htmlFor="ed-height">
                  <input id="ed-height" type="number" inputMode="decimal" step="any" min={0} value={formData.height} onChange={(e) => set({ height: e.target.value })} className="mv-input mv-data" />
                </Field>
              </div>
              <ChoiceMenu
                label="Orientación"
                value={formData.orientation}
                onChange={(val) => set({ orientation: val })}
                options={[
                  { value: "NORTE", label: "Norte" },
                  { value: "SUR", label: "Sur" },
                  { value: "ESTE", label: "Este" },
                  { value: "OESTE", label: "Oeste" },
                ]}
              />
              <ChoiceMenu
                label="Material"
                value={formData.material}
                onChange={(val) => set({ material: val })}
                options={[
                  { value: "LONA", label: "Lona vinílica" },
                  { value: "LED", label: "Digital / LED" },
                  { value: "METAL", label: "Estructura metálica" },
                  { value: "OTRO", label: "Otro material" },
                ]}
              />
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--text-secondary)]">Precio mensual</span>
                  <span className="mv-data font-semibold text-[var(--text-primary)]">{formatMoney(formData.pricePerMonth) ?? "Sin precio"}</span>
                </div>
                <span className="mv-chip">No editable</span>
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                <button type="submit" disabled={saving} aria-busy={saving} className={buttonClass("primary", "lg", "w-full")}>
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                <Link href="/anuncios/mis-espacios" className={buttonClass("ghost", "md", "w-full")}>
                  Cancelar
                </Link>
              </div>
            </FormSection>
          </aside>
        </form>
      </Container>

      {success ? <SavedOverlay title="Cambios guardados" body="Tu espacio ya se ve actualizado en Mercav Publicidad." /> : null}
    </div>
  );
}
// creado por pato dev y askforvini
