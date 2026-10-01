"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Container, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { BackLink, SERVICE_CATEGORY_LABEL, Field, FormSection, ImageListEditor, PageLoading, SavedOverlay, textareaClass } from "@/components/anuncios/market-ui";

export default function EditarServicioPage() {
  const { id } = (useParams() ?? {}) as { id?: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    category: "DESARROLLO_WEB",
    images: []
  });
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            title: data.data.title,
            description: data.data.description,
            category: data.data.category,
            images: data.data.images?.map((img: any) => img.url) || []
          });
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
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
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/servicios/mis-servicios"), 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Cargando tu servicio…" />;
  }

  const set = (patch: Record<string, unknown>) => setFormData({ ...formData, ...patch });

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <BackLink href="/servicios/mis-servicios">Volver a mis servicios</BackLink>
        <header className="mt-6 flex max-w-3xl flex-col gap-4">
          <p className="mv-kicker">Mercav Services</p>
          <h1 className="mv-h2">Editar servicio</h1>
          <p className="mv-lead">Ajustá tu propuesta y tus imágenes. Los precios de los paquetes no se editan desde acá.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection id="sed-info" title="Tu propuesta">
              <Field label="Título del servicio" htmlFor="sed-title" required>
                <input
                  id="sed-title"
                  required 
                  value={formData.title}
                  onChange={(e) => set({ title: e.target.value })}
                  className="mv-input"
                />
              </Field>
              <Field label="Descripción" htmlFor="sed-desc" required hint="Proceso, entregables y qué necesitás del cliente para empezar.">
                <textarea 
                  id="sed-desc"
                  required 
                  rows={8}
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                  aria-describedby="sed-desc-hint"
                  className={textareaClass}
                />
              </Field>
            </FormSection>

            <FormSection id="sed-media" title="Imágenes" description="La primera es la portada del catálogo.">
              <ImageListEditor
                id="sed-image"
                images={formData.images}
                draft={imageUrl}
                onDraftChange={setImageUrl}
                onAdd={addImage}
                onRemove={removeImage}
              />
            </FormSection>
          </div>

          <aside aria-label="Clasificación y guardado" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <FormSection id="sed-class" title="Clasificación">
              <ChoiceMenu
                label="Categoría"
                value={formData.category}
                onChange={(val) => set({ category: val })}
                options={Object.entries(SERVICE_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
              />
              <p className="rounded-2xl border border-[var(--mv-hairline)] p-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                El precio, el plazo y las revisiones de los paquetes se mantienen como los publicaste.
              </p>
              <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                <button type="submit" disabled={saving} aria-busy={saving} className={buttonClass("primary", "lg", "w-full")}>
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                <Link href="/servicios/mis-servicios" className={buttonClass("ghost", "md", "w-full")}>
                  Cancelar
                </Link>
              </div>
            </FormSection>
          </aside>
        </form>
      </Container>

      {success ? <SavedOverlay title="Cambios guardados" body="Tu servicio ya se ve actualizado en Mercav Services." /> : null}
    </div>
  );
}
// creado por pato dev y askforvini
