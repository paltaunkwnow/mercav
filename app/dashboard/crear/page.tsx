"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import {
  Loader2,
  Megaphone,
  MonitorPlay,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  AlertCircle,
} from "@/components/icons";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Container, buttonClass } from "@/components/site/primitives";

const EASE = [0.23, 1, 0.32, 1] as const;

function CrearPublicacionUnified() {
  const [step, setStep] = useState(1); // 1: Select Type, 2: Fill Details
  const [type, setType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();
  
  const [formData, setFormData] = useState<any>({
    title: "", description: "", price: "", city: "",
    // Service specifics
    category: "DESARROLLO_WEB",
    // Job specifics
    employmentType: "TIEMPO_COMPLETO", salaryMin: "", salaryMax: "",
    // Space specifics
    spaceType: "VALLA", width: "0", height: "0", unit: "M"
  });

  const types = [
    { id: 'ads', label: 'Espacio publicitario', icon: Megaphone, desc: 'Vallas, pantallas LED y letreros físicos para alquilar en Ads.' },
    { id: 'service', label: 'Servicio freelance', icon: MonitorPlay, desc: 'Ofrecé tu trabajo profesional en Services.' },
    { id: 'job', label: 'Vacante de empleo', icon: Briefcase, desc: 'Publicá una búsqueda y recibí postulantes en Empleos.' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    
    let endpoint = "";
    let payload = {};

    if (type === "ads") {
      endpoint = "/api/spaces";
      payload = {
        title: formData.title,
        description: formData.description,
        type: formData.spaceType,
        city: formData.city,
        country: "Bolivia",
        pricePerMonth: Number(formData.price),
        width: Number(formData.width),
        height: Number(formData.height),
        unit: formData.unit,
        currency: "USD",
        images: []
      };
    } else if (type === "service") {
      endpoint = "/api/services";
      payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        packages: [{ name: "Básico", price: Number(formData.price), deliveryDays: 7, revisions: 1 }]
      };
    } else if (type === "job") {
      endpoint = "/api/jobs";
      payload = {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        country: "Bolivia",
        employmentType: formData.employmentType,
        workMode: "PRESENCIAL", // Default
        experienceLevel: "JUNIOR", // Default
        requirements: "Habilidades profesionales y compromiso.", // Default
        salaryMin: Number(formData.salaryMin || 0),
        salaryMax: Number(formData.salaryMax || 0),
        salaryCurrency: "USD"
      };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccess(true);
        return;
      }
      // Los endpoints responden { success: false, error } con mensajes ya pensados para el usuario
      // (límite del plan, sesión vencida, etc.). Si no hay cuerpo legible, usamos uno por estado.
      let serverMessage: string | null = null;
      try {
        const data = await res.json();
        if (data && typeof data.error === "string" && data.error.trim()) serverMessage = data.error;
      } catch {}
      const fallback =
        res.status === 401 ? "Tu sesión venció. Iniciá sesión de nuevo para publicar; tus datos siguen en el formulario."
        : res.status === 403 ? "Tu plan actual no permite esta publicación. Revisá tu plan o eliminá alguna publicación activa."
        : res.status === 400 ? "Revisá los datos del formulario: hay campos con valores no válidos."
        : "No pudimos publicar en este momento. Probá de nuevo en unos minutos.";
      setError(serverMessage && res.status !== 500 && res.status !== 401 ? serverMessage : fallback);
    } catch (err) {
      console.error(err);
      setError("No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo; tus datos siguen en el formulario.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        role="status"
        className="liquid-glass mx-auto flex w-full max-w-2xl flex-col items-center rounded-[2rem] px-6 py-14 text-center sm:px-10 md:py-20"
      >
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
          <CheckCircle2 className="h-7 w-7 text-green-400" aria-hidden />
        </span>
        <h2 className="mv-h2">Publicación lista</h2>
        <p className="mv-lead mx-auto mt-4">Recibimos tu publicación y ya está visible en Mercav. Podés editarla cuando quieras desde tu panel.</p>
        <button type="button" className={buttonClass("primary", "lg", "mt-8 w-full sm:w-auto")} onClick={() => window.location.href = '/dashboard'}>
          Volver al panel
        </button>
      </motion.div>
    );
  }

  const fieldLabel = "mb-2 block text-sm font-medium text-[var(--text-secondary)]";
  const selectedType = types.find(t => t.id === type);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={reduce ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 12 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <header className="flex flex-col gap-5">
              <p className="mv-kicker">
                <Link href="/dashboard" className="-my-2 rounded py-2 hover:underline mv-focus">Panel</Link>
                <span aria-hidden>/</span>
                <span>Nueva publicación</span>
              </p>
              <h1 className="mv-h1 max-w-3xl">¿Qué querés publicar?</h1>
              <p className="mv-lead">Elegí el tipo de publicación. En el siguiente paso completás los detalles.</p>
            </header>

            <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {types.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => { setType(t.id); setStep(2); setError(null); }}
                    aria-pressed={type === t.id}
                    className={`mv-panel mv-panel-interactive mv-focus group flex h-full w-full flex-col items-start gap-4 p-6 text-left outline-none md:p-7 ${
                      type === t.id ? 'border-[var(--color-border-gold)]' : ''
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                      <t.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="flex flex-col gap-1.5">
                      <span className="mv-h3">{t.label}</span>
                      <span className="mv-body">{t.desc}</span>
                    </span>
                    <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-gold">
                      Empezar <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <header className="flex flex-col gap-5">
              <p className="mv-kicker">
                <button type="button" onClick={() => setStep(1)} className="-my-2 inline-flex items-center gap-1.5 rounded py-2 hover:underline mv-focus">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Cambiar tipo
                </button>
                <span aria-hidden>/</span>
                <span>{selectedType?.label}</span>
              </p>
              <h1 className="mv-h1 max-w-3xl">Completá los detalles</h1>
              <p className="mv-lead">Con esta información la publicación queda lista para que otros la encuentren.</p>
            </header>

            <form onSubmit={handleSubmit} className="mv-panel mt-10 flex flex-col gap-8 p-5 sm:p-8 md:p-10">
              <div className="flex flex-col gap-6">
                <div>
                  <label htmlFor="crear-title" className={fieldLabel}>Título</label>
                  <input
                    id="crear-title"
                    name="title"
                    required
                    autoComplete="off"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Un título claro y específico"
                    className="mv-input"
                  />
                </div>

                <div>
                  <label htmlFor="crear-description" className={fieldLabel}>Descripción</label>
                  <textarea
                    id="crear-description"
                    name="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Contá qué ofrecés, para quién es y qué incluye."
                    className="mv-input h-auto resize-y py-3 leading-relaxed"
                  />
                </div>

                {type === "ads" && (
                  <fieldset className="grid grid-cols-1 gap-6 border-t border-[var(--mv-hairline)] pt-8 md:grid-cols-2">
                    <legend className="sr-only">Datos del espacio</legend>
                    <div>
                      <p className={fieldLabel}>Tipo de espacio</p>
                      <CustomSelect
                        value={formData.spaceType}
                        onChange={(val) => setFormData({...formData, spaceType: val})}
                        options={[
                          { value: "VALLA", label: "Valla Publicitaria" },
                          { value: "PANTALLA", label: "Pantalla LED" },
                          { value: "LETRERO", label: "Letrero Luminoso" },
                          { value: "MURO", label: "Muro Publicitario" },
                        ]}
                      />
                    </div>
                    <div>
                      <label htmlFor="crear-price-ads" className={fieldLabel}>Precio mensual (USD)</label>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" aria-hidden />
                        <input id="crear-price-ads" name="price" type="number" inputMode="decimal" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="mv-input mv-data pl-10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3">
                      <div>
                        <label htmlFor="crear-width" className={fieldLabel}>Ancho (m)</label>
                        <input id="crear-width" name="width" type="number" inputMode="decimal" required value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} className="mv-input mv-data" />
                      </div>
                      <div>
                        <label htmlFor="crear-height" className={fieldLabel}>Alto (m)</label>
                        <input id="crear-height" name="height" type="number" inputMode="decimal" required value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="mv-input mv-data" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label htmlFor="crear-city-ads" className={fieldLabel}>Ciudad</label>
                        <input id="crear-city-ads" name="city" type="text" autoComplete="address-level2" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Ej.: Santa Cruz" className="mv-input" />
                      </div>
                    </div>
                  </fieldset>
                )}

                {type === "service" && (
                  <fieldset className="grid grid-cols-1 gap-6 border-t border-[var(--mv-hairline)] pt-8 md:grid-cols-2">
                    <legend className="sr-only">Datos del servicio</legend>
                    <div>
                      <p className={fieldLabel}>Categoría</p>
                      <CustomSelect
                        value={formData.category}
                        onChange={(val) => setFormData({...formData, category: val})}
                        options={[
                          { value: "DESARROLLO_WEB", label: "Desarrollo Web" },
                          { value: "DISENO", label: "Diseño Gráfico" },
                          { value: "MARKETING", label: "Marketing Digital" },
                          { value: "VIDEO", label: "Edición de Video" },
                        ]}
                      />
                    </div>
                    <div>
                      <label htmlFor="crear-price-service" className={fieldLabel}>Precio base (USD)</label>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" aria-hidden />
                        <input id="crear-price-service" name="price" type="number" inputMode="decimal" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="mv-input mv-data pl-10" />
                      </div>
                    </div>
                  </fieldset>
                )}

                {type === "job" && (
                  <fieldset className="grid grid-cols-1 gap-6 border-t border-[var(--mv-hairline)] pt-8 md:grid-cols-2">
                    <legend className="sr-only">Datos de la vacante</legend>
                    <div>
                      <p className={fieldLabel}>Modalidad</p>
                      <CustomSelect
                        value={formData.employmentType}
                        onChange={(val) => setFormData({...formData, employmentType: val})}
                        options={[
                          { value: "TIEMPO_COMPLETO", label: "Tiempo Completo" },
                          { value: "PART_TIME", label: "Medio Tiempo" },
                          { value: "FREELANCE", label: "Freelance / Proyecto" },
                        ]}
                      />
                    </div>
                    <div>
                      <label htmlFor="crear-city-job" className={fieldLabel}>Ubicación</label>
                      <input id="crear-city-job" name="city" type="text" autoComplete="address-level2" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Ej.: Santa Cruz o Remoto" className="mv-input" />
                    </div>
                    <div>
                      <label htmlFor="crear-salary-min" className={fieldLabel}>Salario mínimo (USD)</label>
                      <input id="crear-salary-min" name="salaryMin" type="number" inputMode="numeric" value={formData.salaryMin} onChange={(e) => setFormData({...formData, salaryMin: e.target.value})} placeholder="0" className="mv-input mv-data" />
                    </div>
                    <div>
                      <label htmlFor="crear-salary-max" className={fieldLabel}>Salario máximo (USD)</label>
                      <input id="crear-salary-max" name="salaryMax" type="number" inputMode="numeric" value={formData.salaryMax} onChange={(e) => setFormData({...formData, salaryMax: e.target.value})} placeholder="0" className="mv-input mv-data" />
                    </div>
                  </fieldset>
                )}
              </div>

              {error && (
                <div
                  id="crear-error"
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-relaxed text-red-400"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--mv-hairline)] pt-6 sm:flex-row sm:justify-end">
                <button type="button" className={buttonClass("ghost", "lg", "w-full sm:w-auto")} onClick={() => setStep(1)}>
                  Atrás
                </button>
                <button type="submit" disabled={loading} aria-busy={loading} aria-describedby={error ? "crear-error" : undefined} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {loading ? "Publicando…" : "Publicar"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CrearPage() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-bg-primary pb-20 pt-28 md:pb-28 md:pt-36">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <Suspense fallback={
          <div className="flex min-h-[50vh] items-center justify-center" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
            <span className="sr-only">Cargando…</span>
          </div>
        }>
          <CrearPublicacionUnified />
        </Suspense>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
