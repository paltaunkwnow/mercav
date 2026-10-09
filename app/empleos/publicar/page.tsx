"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Building2, UserRound } from "@/components/icons";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { Container, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { BackLink, Field, FormSection, SwitchRow, textareaClass } from "@/components/anuncios/market-ui";
import { cn } from "@/lib/utils";

export default function PublicarEmpleoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });
  const [createPost, setCreatePost] = useState(true);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    employmentType: "TIEMPO_COMPLETO",
    workMode: "PRESENCIAL",
    city: "",
    country: "Bolivia",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    salaryVisible: true,
    experienceLevel: "JUNIOR",
    officialCompanyId: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/companies/user-approved")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data?.success) setUserCompanies(data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (createPost) {
          await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `¡Nueva vacante disponible! 🚀\n\nEstamos buscando un ${formData.title}. Si cumples con los requisitos, ¡postúlate ahora!\n\n📍 ${formData.city}, ${formData.country}`,
              module: "JOBS",
              jobId: data.data.id
            }),
          });
        }
        showToast("Empleo publicado con éxito", "success");
        setTimeout(() => router.push("/empleos"), 1500);
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
  const identities = [{ id: "", name: "Mi cuenta personal", personal: true }, ...userCompanies.map((c: any) => ({ id: c.id, name: c.name, personal: false }))];

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container className="relative">
        <BackLink href="/empleos">Volver a Mercav Jobs</BackLink>
        <header className="mt-6 flex max-w-3xl flex-col gap-4">
          <p className="mv-kicker">Mercav Jobs</p>
          <h1 className="mv-h2">Publicar una vacante</h1>
          <p className="mv-lead">Describí el puesto, las condiciones y si mostrás el salario. Las postulaciones te llegan a tu cuenta.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            {userCompanies.length > 0 && (
              <FormSection id="job-identity" title="Publicar como" description="Elegí si la vacante sale con tu nombre o con el de una empresa que administrás.">
                <div role="radiogroup" aria-labelledby="job-identity" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {identities.map((it) => {
                    const on = formData.officialCompanyId === it.id;
                    const Icon = it.personal ? UserRound : Building2;
                    return (
                      <button
                        key={it.id || "personal"}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => set({ officialCompanyId: it.id })}
                        className={cn(
                          "mv-focus flex min-h-[3.5rem] items-center gap-3 rounded-2xl border px-4 text-left text-sm font-medium transition-colors duration-200",
                          on
                            ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                            : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                        <span className="truncate">{it.name}</span>
                      </button>
                    );
                  })}
                </div>
              </FormSection>
            )}

            <FormSection id="job-basics" step={1} title="El puesto">
              <Field label="Título del puesto" htmlFor="job-title" required hint="Usá el nombre que buscaría un candidato. Ej.: Desarrollador full stack semi senior.">
                <input
                  id="job-title"
                  required 
                  value={formData.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="Ej. Desarrollador full stack"
                  aria-describedby="job-title-hint"
                  className="mv-input"
                />
              </Field>
              <Field label="Descripción" htmlFor="job-desc" required hint="Tareas, equipo, objetivos del rol.">
                <textarea 
                  id="job-desc"
                  required 
                  rows={6}
                  value={formData.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Describí las tareas, la cultura del equipo y los objetivos…"
                  aria-describedby="job-desc-hint"
                  className={textareaClass}
                />
              </Field>
              <Field label="Requisitos" htmlFor="job-req" required hint="Conocimientos técnicos, experiencia y habilidades.">
                <textarea 
                  id="job-req"
                  required 
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => set({ requirements: e.target.value })}
                  placeholder="Enumerá conocimientos técnicos y habilidades…"
                  aria-describedby="job-req-hint"
                  className={textareaClass}
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Responsabilidades" htmlFor="job-resp" optional>
                  <textarea id="job-resp" rows={4} value={formData.responsibilities} onChange={(e) => set({ responsibilities: e.target.value })} className={textareaClass} />
                </Field>
                <Field label="Beneficios" htmlFor="job-benefits" optional>
                  <textarea id="job-benefits" rows={4} value={formData.benefits} onChange={(e) => set({ benefits: e.target.value })} className={textareaClass} />
                </Field>
              </div>
            </FormSection>

            <FormSection id="job-terms" step={2} title="Condiciones">
              <div className="grid gap-5 md:grid-cols-3">
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
                  onChange={(val) => set({ experienceLevel: val })}
                  options={[
                    { value: "SIN_EXPERIENCIA", label: "Sin experiencia" },
                    { value: "JUNIOR", label: "Junior" },
                    { value: "SEMI_SENIOR", label: "Semi senior" },
                    { value: "SENIOR", label: "Senior" },
                  ]}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Ciudad" htmlFor="job-city" required>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" aria-hidden />
                    <input
                      id="job-city"
                      required 
                      value={formData.city}
                      onChange={(e) => set({ city: e.target.value })}
                      placeholder="Ej. Santa Cruz"
                      autoComplete="address-level2"
                      className="mv-input pl-11"
                    />
                  </div>
                </Field>
                <Field label="País" htmlFor="job-country">
                  <input id="job-country" value={formData.country} onChange={(e) => set({ country: e.target.value })} autoComplete="country-name" className="mv-input" />
                </Field>
              </div>
            </FormSection>
          </div>

          <aside aria-label="Salario y publicación" className="flex flex-col gap-4 lg:sticky lg:top-28">
            <FormSection id="job-salary" step={3} title="Salario mensual" description="En USD. Podés cargarlo y no mostrarlo.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Mínimo" htmlFor="job-min">
                  <input id="job-min" type="number" inputMode="numeric" min={0} value={formData.salaryMin} onChange={(e) => set({ salaryMin: e.target.value })} placeholder="0" className="mv-input mv-data" />
                </Field>
                <Field label="Máximo" htmlFor="job-max">
                  <input id="job-max" type="number" inputMode="numeric" min={0} value={formData.salaryMax} onChange={(e) => set({ salaryMax: e.target.value })} placeholder="0" className="mv-input mv-data" />
                </Field>
              </div>
              <SwitchRow
                id="job-salary-visible"
                checked={formData.salaryVisible}
                onChange={() => set({ salaryVisible: !formData.salaryVisible })}
                title="Mostrar el salario"
                description={formData.salaryVisible ? "Los candidatos ven el rango en la vacante." : "La vacante dirá «A convenir»."}
              />
              <SwitchRow
                id="job-post"
                checked={createPost}
                onChange={() => setCreatePost(!createPost)}
                title="Anunciarla en el feed"
                description="Crea una publicación automática en tu perfil."
              />
              <div className="flex flex-col gap-3 border-t border-[var(--mv-hairline)] pt-5">
                <button type="submit" disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {loading ? "Publicando…" : "Publicar vacante"}
                </button>
                <Link href="/empleos" className={buttonClass("ghost", "md", "w-full")}>
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
