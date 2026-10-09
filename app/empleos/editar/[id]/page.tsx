"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin, Lock } from "@/components/icons";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Container, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { BackLink, Field, FormSection, PageLoading, SavedOverlay, textareaClass } from "@/components/anuncios/market-ui";

export default function EditarEmpleoPage() {
  const { id } = (useParams() ?? {}) as { id?: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    city: "",
    employmentType: "TIEMPO_COMPLETO",
    salaryMin: "",
    salaryMax: "",
    workMode: "PRESENCIAL",
    experienceLevel: "MID",
    requirements: "",
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();
        if (data.success) {
          setFormData({
            title: data.data.title,
            description: data.data.description,
            city: data.data.city,
            employmentType: data.data.employmentType,
            salaryMin: data.data.salaryMin,
            salaryMax: data.data.salaryMax,
            workMode: data.data.workMode || "PRESENCIAL",
            experienceLevel: data.data.experienceLevel || "MID",
            requirements: data.data.requirements || "",
          });
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/empleos/mis-empleos"), 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Cargando tu vacante…" />;
  }

  const set = (patch: Record<string, unknown>) => setFormData({ ...formData, ...patch });
  const hasSalary = formData.salaryMin != null && formData.salaryMin !== "" || formData.salaryMax != null && formData.salaryMax !== "";

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <BackLink href="/empleos/mis-empleos">Volver a mis vacantes</BackLink>
        <header className="mt-6 flex max-w-3xl flex-col gap-4">
          <p className="mv-kicker">Mercav Empleos</p>
          <h1 className="mv-h2">Editar vacante</h1>
          <p className="mv-lead">Ajustá la descripción, los requisitos y las condiciones. El rango salarial queda como lo publicaste.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection id="jed-info" title="El puesto">
              <Field label="Título del puesto" htmlFor="jed-title" required>
                <input
                  id="jed-title"
                  required 
                  value={formData.title}
                  onChange={(e) => set({ title: e.target.value })}
                  className="mv-input"
                />
              </Field>
              <Field label="Descripción" htmlFor="jed-desc" required>
                <textarea 
                  id="jed-desc"
                  required 
                  rows={8}
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                  className={textareaClass}
                />
              </Field>
              <Field label="Requisitos" htmlFor="jed-req" required hint="Conocimientos técnicos, experiencia y habilidades.">
                <textarea 
                  id="jed-req"
                  required 
                  rows={6}
                  value={formData.requirements}
                  onChange={(e) => set({ requirements: e.target.value })}
                  placeholder="Enumerá conocimientos técnicos y habilidades…"
                  aria-describedby="jed-req-hint"
                  className={textareaClass}
                />
              </Field>
            </FormSection>
          </div>

          <aside aria-label="Condiciones y guardado" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <FormSection id="jed-terms" title="Condiciones">
              <ChoiceMenu
                label="Tipo de contrato"
                value={formData.employmentType}
                onChange={(val) => set({ employmentType: val })}
                options={[
                  { value: "TIEMPO_COMPLETO", label: "Tiempo completo" },
                  { value: "PART_TIME", label: "Medio tiempo" },
                  { value: "FREELANCE", label: "Freelance" },
                  { value: "PASANTIA", label: "Pasantía" },
                ]}
              />
              <ChoiceMenu
                label="Modalidad"
                value={formData.workMode}
                onChange={(val) => set({ workMode: val })}
                options={[
                  { value: "PRESENCIAL", label: "Presencial" },
                  { value: "REMOTO", label: "Remoto" },
                  { value: "HIBRIDO", label: "Híbrido" },
                ]}
              />
              <ChoiceMenu
                label="Experiencia"
                value={formData.experienceLevel}
                placeholder="Elegí un nivel"
                onChange={(val) => set({ experienceLevel: val })}
                options={[
                  { value: "SIN_EXPERIENCIA", label: "Sin experiencia" },
                  { value: "JUNIOR", label: "Junior" },
                  { value: "SEMI_SENIOR", label: "Semi senior" },
                  { value: "SENIOR", label: "Senior" },
                ]}
              />
              <Field label="Ciudad" htmlFor="jed-city" required>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" aria-hidden />
                  <input id="jed-city" type="text" required autoComplete="address-level2" value={formData.city} onChange={(e) => set({ city: e.target.value })} className="mv-input pl-11" />
                </div>
              </Field>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--text-secondary)]">Rango salarial</span>
                  <span className="mv-data font-semibold text-[var(--text-primary)]">
                    {hasSalary ? `US$ ${formData.salaryMin ?? "—"} – ${formData.salaryMax ?? "—"}` : "Sin rango cargado"}
                  </span>
                </div>
                <span className="mv-chip">
                  <Lock className="h-3 w-3" aria-hidden /> Fijo
                </span>
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                <button type="submit" disabled={saving} aria-busy={saving} className={buttonClass("primary", "lg", "w-full")}>
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
                <Link href="/empleos/mis-empleos" className={buttonClass("ghost", "md", "w-full")}>
                  Cancelar
                </Link>
              </div>
            </FormSection>
          </aside>
        </form>
      </Container>

      {success ? <SavedOverlay title="Cambios guardados" body="La vacante ya se ve actualizada en Mercav Empleos." /> : null}
    </div>
  );
}
// creado por pato dev y askforvini
