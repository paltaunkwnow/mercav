"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "@/components/icons";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { Container, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { BackLink, SERVICE_CATEGORY_LABEL, Field, FormSection, MediaFrame, SwitchRow, formatMoney, textareaClass } from "@/components/anuncios/market-ui";

/** Longest title the form accepts (also used to trim ?titulo= coming from Mercav Tools). */
const TITLE_MAX = 100;

export default function PublicarServicioPage() {
  return (
    <Suspense fallback={null}>
      <PublicarServicioForm />
    </Suspense>
  );
}

function PublicarServicioForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [createPost, setCreatePost] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "DESARROLLO_WEB",
    subcategory: "",
    // Número o "" mientras el campo está vacío: parseInt("") daba NaN y React avisa por value={NaN}.
    deliveryDays: 5 as number | "",
    revisions: 3 as number | "",
    packagePrice: "",
    imageUrl: "",
  });

  // Prefill from /servicios/publicar?titulo=…&precio=… (links from Mercav Tools). Without params nothing changes.
  const searchParams = useSearchParams();
  useEffect(() => {
    const titulo = searchParams?.get("titulo")?.trim();
    const precio = searchParams?.get("precio")?.trim();
    const patch: { title?: string; packagePrice?: string } = {};
    if (titulo) patch.title = titulo.slice(0, TITLE_MAX);
    if (precio) {
      const n = Number(precio.replace(",", "."));
      if (Number.isFinite(n) && n > 0) patch.packagePrice = String(n);
    }
    if (patch.title || patch.packagePrice) setFormData((prev) => ({ ...prev, ...patch }));
  }, [searchParams]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          packagePrice: parseFloat(formData.packagePrice),
          images: formData.imageUrl ? [formData.imageUrl] : []
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (createPost) {
          await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `¡He lanzado un nuevo servicio en Mercav! 🚀\n\n${formData.title}\n\n"${formData.description.slice(0, 150)}..."\n\n¿Buscas a alguien para este tipo de trabajos? ¡Hablemos!`,
              module: "SERVICES",
              serviceId: data.data.id,
              images: formData.imageUrl ? [formData.imageUrl] : []
            }),
          });
        }
        showToast("Servicio publicado con éxito", "success");
        setTimeout(() => router.push("/servicios"), 1500);
      } else {
        showToast(data.error || "Error al publicar", "error");
      }
    } catch (error) {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (patch: Partial<typeof formData>) => setFormData({ ...formData, ...patch });
  const pricePreview = formatMoney(formData.packagePrice);

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <BackLink href="/servicios">Volver a Mercav Services</BackLink>
        <header className="mt-6 flex max-w-3xl flex-col gap-4">
          <p className="mv-kicker">Mercav Services</p>
          <h1 className="mv-h2">Ofrecer un servicio</h1>
          <p className="mv-lead">Contá qué hacés, cuánto cuesta y en cuánto tiempo lo entregás. Cobrás por hitos: el pago del cliente queda en custodia hasta cada entrega.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection id="svc-basics" step={1} title="Tu propuesta" description="Lo primero que ve un cliente en el catálogo.">
              <Field label="Título del servicio" htmlFor="svc-title" required hint="Qué entregás, en una frase (hasta 100 caracteres). Ej.: Landing page en Next.js lista para vender.">
                <input
                  id="svc-title"
                  required 
                  maxLength={TITLE_MAX}
                  value={formData.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="Ej. Identidad visual para marcas nuevas"
                  aria-describedby="svc-title-hint"
                  className="mv-input"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <ChoiceMenu
                  label="Categoría"
                  value={formData.category}
                  onChange={(val) => set({ category: val })}
                  options={Object.entries(SERVICE_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
                />
                <Field label="Subcategoría" htmlFor="svc-sub" optional>
                  <input
                    id="svc-sub"
                    value={formData.subcategory}
                    onChange={(e) => set({ subcategory: e.target.value })}
                    placeholder="Ej. Logos, e-commerce"
                    className="mv-input"
                  />
                </Field>
              </div>
              <Field label="Descripción" htmlFor="svc-desc" required hint="Proceso, entregables y qué necesitás del cliente para empezar.">
                <textarea 
                  id="svc-desc"
                  required 
                  rows={7}
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Describí el proceso, los entregables y por qué deberían contratarte…"
                  aria-describedby="svc-desc-hint"
                  className={textareaClass}
                />
              </Field>
            </FormSection>

            <FormSection id="svc-media" step={2} title="Imagen de portada" description="Una muestra de tu trabajo. Se ve en la tarjeta del catálogo.">
              <div className="grid gap-5 md:grid-cols-[14rem_1fr] md:items-start">
                <MediaFrame src={formData.imageUrl || null} alt="Vista previa de la portada" ratio="aspect-[16/10]" emptyLabel="Sin imagen" className="rounded-2xl border border-[var(--mv-hairline)]" />
                <Field label="Enlace de la imagen" htmlFor="svc-image" optional hint="URL pública de la imagen (https://…).">
                  <input 
                    id="svc-image"
                    type="url"
                    inputMode="url"
                    value={formData.imageUrl}
                    onChange={(e) => set({ imageUrl: e.target.value })}
                    placeholder="https://servidor.com/portada.jpg"
                    aria-describedby="svc-image-hint"
                    className="mv-input"
                  />
                </Field>
              </div>
            </FormSection>
          </div>

          <aside aria-label="Condiciones y publicación" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <FormSection id="svc-terms" step={3} title="Paquete básico" description="Podés sumar más paquetes después.">
              <Field label="Precio (USD)" htmlFor="svc-price" required>
                <input 
                  id="svc-price"
                  required 
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={formData.packagePrice}
                  onChange={(e) => set({ packagePrice: e.target.value })}
                  placeholder="0"
                  className="mv-input mv-data text-lg"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Entrega (días)" htmlFor="svc-days" required>
                  <input 
                    id="svc-days"
                    required 
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={formData.deliveryDays}
                    onChange={(e) => set({ deliveryDays: e.target.value === "" ? "" : parseInt(e.target.value, 10) })}
                    className="mv-input mv-data"
                  />
                </Field>
                <Field label="Revisiones" htmlFor="svc-revisions" required>
                  <input 
                    id="svc-revisions"
                    required 
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={formData.revisions}
                    onChange={(e) => set({ revisions: e.target.value === "" ? "" : parseInt(e.target.value, 10) })}
                    className="mv-input mv-data"
                  />
                </Field>
              </div>
              <SwitchRow
                id="svc-post"
                checked={createPost}
                onChange={() => setCreatePost(!createPost)}
                title="Anunciarlo en el feed"
                description="Crea una publicación automática en tu perfil."
              />
              <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                {pricePreview ? (
                  <p className="flex items-baseline justify-between text-sm text-[var(--text-secondary)]">
                    Se verá como
                    <span className="mv-data font-semibold text-[var(--text-primary)]">Desde {pricePreview}</span>
                  </p>
                ) : null}
                <button type="submit" disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {loading ? "Publicando…" : "Publicar servicio"}
                </button>
                <Link href="/servicios" className={buttonClass("ghost", "md", "w-full")}>
                  Cancelar
                </Link>
                <p className="flex items-start gap-2.5 pt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  El cliente paga con Stripe y los fondos se liberan a vos cuando aprueba cada entrega.
                </p>
              </div>
            </FormSection>
          </aside>
        </form>
      </Container>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
}
// creado por pato dev y askforvini
