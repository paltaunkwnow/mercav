"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "@/components/icons";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { Container, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { BackLink, Field, FormSection, MediaFrame, SwitchRow, formatMoney, textareaClass } from "@/components/anuncios/market-ui";

const normalizeStr = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const LATAM_LOCATIONS: Record<string, string[]> = {
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta"],
  "Bolivia": ["La Paz", "Santa Cruz de la Sierra", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "El Alto"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "Viña del Mar", "Antofagasta", "Temuco", "La Serena", "Rancagua"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Manizales"],
  "Costa Rica": ["San José", "Alajuela", "Cartago", "Heredia", "Puntarenas", "Limón"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Manta", "Portoviejo", "Loja"],
  "El Salvador": ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Santa Tecla"],
  "Guatemala": ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla"],
  "Honduras": ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso"],
  "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "Querétaro", "Mérida", "Cancún", "León", "San Luis Potosí"],
  "Nicaragua": ["Managua", "León", "Masaya", "Granada", "Chinandega", "Estelí"],
  "Panamá": ["Ciudad de Panamá", "Colón", "David", "Santiago", "La Chorrera"],
  "Paraguay": ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Lambaré", "Capiatá"],
  "Perú": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Huancayo", "Iquitos"],
  "República Dominicana": ["Santo Domingo", "Santiago de los Caballeros", "La Romana", "Punta Cana", "Puerto Plata", "San Pedro de Macorís", "San Francisco de Macorís"],
  "Uruguay": ["Montevideo", "Salto", "Paysandú", "Maldonado", "Las Piedras", "Rivera"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "San Cristóbal", "Barcelona"]
};

export default function PublicarEspacioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [createPost, setCreatePost] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "LETRERO",
    address: "",
    city: "",
    country: "Bolivia",
    width: "",
    height: "",
    unit: "M",
    hasLighting: false,
    trafficEstimate: "",
    pricePerMonth: "",
    currency: "USD",
    imageUrl: "",
    orientation: "Horizontal",
    material: "Lona Vinílica",
    minContractMonths: "1",
  });

  const countries = useMemo(() => {
    return Object.keys(LATAM_LOCATIONS).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, []);

  const cities = useMemo(() => {
    if (!formData.country) return [];
    const matchedKey = Object.keys(LATAM_LOCATIONS).find(
      key => normalizeStr(key) === normalizeStr(formData.country)
    );
    return matchedKey ? LATAM_LOCATIONS[matchedKey].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })) : [];
  }, [formData.country]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          trafficEstimate: formData.trafficEstimate ? parseInt(formData.trafficEstimate) : null,
          pricePerMonth: parseFloat(formData.pricePerMonth),
          minContractMonths: parseInt(formData.minContractMonths),
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
              content: `¡Tengo un nuevo espacio publicitario disponible! 📢\n\n${formData.title}\n\n📍 Ubicado en ${formData.city}, ${formData.country}.\n\n📏 Dimensiones: ${formData.width}x${formData.height} ${formData.unit}\n💎 Material: ${formData.material}\n\n¡Consúltame disponibilidad!`,
              module: "ADS",
              spaceId: data.data.id,
              images: formData.imageUrl ? [formData.imageUrl] : []
            }),
          });
        }
        showToast("Anuncio publicado con éxito", "success");
        setTimeout(() => router.push("/anuncios"), 1500);
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
  const pricePreview = formatMoney(formData.pricePerMonth, formData.currency);

  return (
    <div className="relative w-full bg-bg-primary pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container className="relative">
        <BackLink href="/anuncios">Volver a Mercav Publicidad</BackLink>
        <header className="mt-6 flex max-w-3xl flex-col gap-4">
          <h1 className="font-display text-[1.9rem] font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-[2.4rem]">Publicar un espacio publicitario</h1>
          <p className="mv-lead">Cargá la ubicación, las medidas y el precio mensual. Las marcas ven tu calendario y reservan las fechas libres; tu primer alquiler no paga comisión de plataforma.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection id="ad-basics" step={1} title="Lo esencial" description="Así aparece tu espacio en el catálogo.">
              <Field label="Título" htmlFor="ad-title" required hint="Que se entienda qué es y dónde está. Ej.: Valla 8×4 en Av. Cristo Redentor.">
                <input
                  id="ad-title"
                  required 
                  value={formData.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="Ej. Pantalla LED en intersección norte"
                  aria-describedby="ad-title-hint"
                  className="mv-input"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <ChoiceMenu
                  label="Tipo de soporte"
                  value={formData.type}
                  onChange={(val) => set({ type: val })}
                  options={[
                    { value: "VALLA", label: "Valla / espectacular" },
                    { value: "LETRERO", label: "Letrero / banner" },
                    { value: "VIDRIERA", label: "Vidriera / local" },
                    { value: "PANTALLA", label: "Pantalla digital" },
                    { value: "AUTO", label: "Transporte" },
                    { value: "OTRO", label: "Otro soporte" },
                  ]}
                />
                <Field label="Tránsito estimado por mes" htmlFor="ad-traffic" optional hint="Personas o vehículos que lo ven. Solo si tenés un dato confiable.">
                  <input
                    id="ad-traffic"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={formData.trafficEstimate}
                    onChange={(e) => set({ trafficEstimate: e.target.value })}
                    placeholder="Ej. 120000"
                    aria-describedby="ad-traffic-hint"
                    className="mv-input mv-data"
                  />
                </Field>
              </div>
              <Field label="Descripción" htmlFor="ad-desc" optional hint="Referencias de la zona, horarios de mayor tránsito, qué incluye el alquiler.">
                <textarea
                  id="ad-desc"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Frente a la salida del centro comercial, visible desde ambos sentidos…"
                  aria-describedby="ad-desc-hint"
                  className={textareaClass}
                />
              </Field>
            </FormSection>

            <FormSection id="ad-location" step={2} title="Ubicación">
              <Field label="Dirección" htmlFor="ad-address" required hint="Calle, número y una referencia para encontrarlo.">
                <input
                  id="ad-address"
                  required 
                  value={formData.address}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder="Calle, número, referencia"
                  autoComplete="street-address"
                  aria-describedby="ad-address-hint"
                  className="mv-input"
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <ChoiceMenu
                  label="País"
                  icon={MapPin}
                  value={formData.country}
                  placeholder="Elegí un país"
                  options={countries}
                  onChange={(country) => set({ country, city: "" })}
                />
                <ChoiceMenu
                  label="Ciudad"
                  icon={MapPin}
                  value={formData.city}
                  placeholder="Elegí una ciudad"
                  options={cities}
                  disabled={!formData.country}
                  disabledText="Elegí un país primero"
                  onChange={(city) => set({ city })}
                />
              </div>
            </FormSection>

            <FormSection id="ad-specs" step={3} title="Ficha técnica" description="Las marcas comparan espacios por medidas y soporte.">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                <Field label="Ancho" htmlFor="ad-width">
                  <input id="ad-width" type="number" inputMode="decimal" min={0} step="any" value={formData.width} onChange={(e) => set({ width: e.target.value })} className="mv-input mv-data" />
                </Field>
                <Field label="Alto" htmlFor="ad-height">
                  <input id="ad-height" type="number" inputMode="decimal" min={0} step="any" value={formData.height} onChange={(e) => set({ height: e.target.value })} className="mv-input mv-data" />
                </Field>
                <ChoiceMenu
                  label="Unidad"
                  value={formData.unit}
                  onChange={(val) => set({ unit: val })}
                  options={[{ value: "M", label: "Metros" }, { value: "CM", label: "Centímetros" }]}
                />
                <ChoiceMenu
                  label="Orientación"
                  value={formData.orientation}
                  onChange={(val) => set({ orientation: val })}
                  options={[{ value: "Horizontal", label: "Horizontal" }, { value: "Vertical", label: "Vertical" }]}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Soporte / material" htmlFor="ad-material" hint="Ej.: lona vinílica, LED, vinilo adhesivo.">
                  <input id="ad-material" value={formData.material} onChange={(e) => set({ material: e.target.value })} aria-describedby="ad-material-hint" className="mv-input" />
                </Field>
                <Field label="Contrato mínimo (meses)" htmlFor="ad-min-months">
                  <input id="ad-min-months" type="number" inputMode="numeric" min={1} value={formData.minContractMonths} onChange={(e) => set({ minContractMonths: e.target.value })} className="mv-input mv-data" />
                </Field>
              </div>
              <SwitchRow
                id="ad-lighting"
                checked={formData.hasLighting}
                onChange={() => set({ hasLighting: !formData.hasLighting })}
                title="Tiene iluminación"
                description="Se ve de noche. Aparece como etiqueta en el catálogo."
              />
            </FormSection>

            <FormSection id="ad-media" step={4} title="Foto principal" description="Una foto real del espacio, de día y con buena luz.">
              <div className="grid gap-5 md:grid-cols-[14rem_1fr] md:items-start">
                <MediaFrame src={formData.imageUrl || null} alt="Vista previa de la foto" emptyLabel="Sin foto" className="rounded-2xl border border-[var(--mv-hairline)]" />
                <Field label="Enlace de la imagen" htmlFor="ad-image" optional hint="Pegá la URL pública de la foto (https://…).">
                  <input
                    id="ad-image"
                    type="url"
                    inputMode="url"
                    value={formData.imageUrl}
                    onChange={(e) => set({ imageUrl: e.target.value })}
                    placeholder="https://servidor.com/valla.jpg"
                    aria-describedby="ad-image-hint"
                    className="mv-input"
                  />
                </Field>
              </div>
            </FormSection>
          </div>

          <aside aria-label="Precio y publicación" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <FormSection id="ad-price" step={5} title="Precio">
              <Field label="Precio mensual (USD)" htmlFor="ad-price-input" hint="Lo que paga una marca por un mes completo.">
                <input 
                  id="ad-price-input"
                  type="number" 
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={formData.pricePerMonth} 
                  onChange={(e) => set({ pricePerMonth: e.target.value })} 
                  placeholder="0"
                  aria-describedby="ad-price-input-hint"
                  className="mv-input mv-data text-lg"
                />
              </Field>
              <SwitchRow
                id="ad-post"
                checked={createPost}
                onChange={() => setCreatePost(!createPost)}
                title="Anunciarlo en el feed"
                description="Crea una publicación automática en tu perfil."
              />
              <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                {pricePreview ? (
                  <p className="flex items-baseline justify-between text-sm text-[var(--text-secondary)]">
                    Se verá como
                    <span className="mv-data font-semibold text-[var(--text-primary)]">{pricePreview} / mes</span>
                  </p>
                ) : null}
                <button type="submit" disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {loading ? "Publicando…" : "Publicar espacio"}
                </button>
                <Link href="/anuncios" className={buttonClass("ghost", "md", "w-full")}>
                  Cancelar
                </Link>
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
