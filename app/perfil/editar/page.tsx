"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  AlertCircle,
  UserCircle2,
  Briefcase,
  GraduationCap,
  Sparkles,
  BadgeCheck,
  Settings2,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Image as ImageIcon,
} from "@/components/icons";
import { Container } from "@/components/site/primitives";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ExperienceForm, EducationForm, SkillsForm } from "@/components/profile/ProfileForms";
import { TwoFactorSetup } from "@/components/profile/TwoFactorSetup";
import { AppHeading } from "@/components/app-shell/AppPage";

type FormState = {
  name: string;
  bio: string;
  location: string;
  avatar: string;
  coverImage: string;
  headline: string;
  publicEmail: string;
  website: string;
  profileType: string;
  experiences: any[];
  educations: any[];
  skills: any[];
  workMode: string;
  availabilityStatus: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryVisible: boolean;
  twoFactorEnabled: boolean;
};

const SECTIONS = [
  { id: "basic", label: "Información básica", icon: UserCircle2 },
  { id: "images", label: "Imágenes", icon: ImageIcon },
  { id: "presentation", label: "Presentación", icon: Sparkles },
  { id: "security", label: "Seguridad y 2FA", icon: ShieldCheck },
  { id: "experience", label: "Experiencia", icon: Briefcase },
  { id: "education", label: "Educación", icon: GraduationCap },
  { id: "skills", label: "Habilidades", icon: BadgeCheck },
  { id: "preferences", label: "Preferencias", icon: Settings2 },
];

export default function EditarPerfilPage() {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [imageErrors, setImageErrors] = useState({ avatar: false, coverImage: false });
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormState>({
    name: "",
    bio: "",
    location: "",
    avatar: "",
    coverImage: "",
    headline: "",
    publicEmail: "",
    website: "",
    profileType: "PERSONAL",
    experiences: [],
    educations: [],
    skills: [],
    workMode: "PRESENCIAL",
    availabilityStatus: "INMEDIATA",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    salaryVisible: false,
    twoFactorEnabled: false,
  });

  const completeness = useMemo(() => {
    const fields = [
      formData.name, 
      formData.bio, 
      formData.location, 
      formData.avatar, 
      formData.headline,
      formData.experiences.length > 0,
      formData.skills.length > 0
    ].filter(Boolean);
    return Math.min(100, Math.round((fields.length / 7) * 100));
  }, [formData]);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const user = data.data;
          const profile = user.profile || {};
          setFormData({
            name: user.name || "",
            bio: user.bio || "",
            location: user.location || "",
            avatar: user.avatar || "",
            coverImage: user.coverImage || "",
            headline: profile.headline || "",
            publicEmail: profile.publicEmail || "",
            website: profile.website || "",
            profileType: profile.profileType || "PERSONAL",
            experiences: profile.experiences || [],
            educations: profile.educations || [],
            skills: profile.skills || [],
            workMode: profile.workMode || "PRESENCIAL",
            availabilityStatus: profile.availabilityStatus || "INMEDIATA",
            salaryMin: profile.salaryMin?.toString() || "",
            salaryMax: profile.salaryMax?.toString() || "",
            salaryCurrency: profile.salaryCurrency || "USD",
            salaryVisible: profile.salaryVisible || false,
            twoFactorEnabled: user.twoFactorEnabled || false,
          });
        }
      })
      .catch((err) => console.error("Error cargando el perfil:", err))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (name: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setUnsaved(true);
    if (name === "avatar" || name === "coverImage") {
      setImageErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const saveProfile = async (auto = false) => {
    if (!auto) setSaving(true);
    else setAutoSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setUnsaved(false);
        setPreviewToast(auto ? "Guardado automáticamente" : "Cambios guardados");
        setTimeout(() => setPreviewToast(null), 2000);
        if (!auto) {
          router.refresh();
        }
      }
    } finally {
      if (!auto) setSaving(false);
      else setAutoSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-bg-primary pt-20" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
        <span className="sr-only">Cargando tu perfil</span>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container width="wide">
        <div className="mb-8">
          <AppHeading
            back={{ href: "/perfil", label: "Volver a mi perfil" }}
            title="Editar perfil"
            lead="Lo que completes acá es lo que ven clientes, empresas y postulantes en todos los módulos."
            actions={
          <div className="mv-panel flex min-w-[15rem] flex-col gap-2 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Perfil completo</span>
              <span className="mv-data font-medium text-[var(--text-primary)]">{completeness}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--mv-panel-hover)]" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="Perfil completo">
              <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${completeness}%` }} />
            </div>
          </div>
            }
          />
        </div>

        {/* Section nav — chips on mobile, sticky list on desktop */}
        <nav aria-label="Secciones del formulario" className="scrollbar-hide -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 xl:hidden">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="mv-chip mv-focus h-9 shrink-0 px-3.5 text-[13px]">
              <section.icon className="h-3.5 w-3.5 text-gold" aria-hidden />
              {section.label}
            </a>
          ))}
        </nav>

        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px] xl:gap-8">
          <aside className="hidden xl:block">
            <nav aria-label="Secciones del formulario" className="sticky top-28">
              <ul className="space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="mv-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
                        <Icon className="h-4 w-4 text-gold" aria-hidden />
                        <span>{section.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            <form onSubmit={(e) => { e.preventDefault(); void saveProfile(false); }} className="space-y-6">
              {/* Básicos */}
              <FormSection id="basic" title="Información básica" description="Tu nombre, tu titular y dónde estás.">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id="pf-name" label="Nombre o razón social">
                    <input id="pf-name" autoComplete="name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} className="mv-input" />
                  </Field>
                  <Field id="pf-type" label="Tipo de perfil">
                    <Select value={formData.profileType} onValueChange={(v) => updateField("profileType", v)}>
                      <SelectTrigger id="pf-type" className="h-12 rounded-[0.875rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">Profesional independiente</SelectItem>
                        <SelectItem value="EMPRESA">Empresa o agencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="pf-headline" label="Titular o cargo">
                    <input id="pf-headline" autoComplete="organization-title" value={formData.headline} onChange={(e) => updateField("headline", e.target.value)} placeholder="Ej. Diseñadora de marca" className="mv-input" />
                  </Field>
                  <Field id="pf-location" label="Ubicación">
                    <input id="pf-location" autoComplete="address-level2" value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Ej. La Paz, Bolivia" className="mv-input" />
                  </Field>
                </div>
              </FormSection>

              {/* Imágenes */}
              <FormSection id="images" title="Imágenes" description="Pegá la URL pública de tu foto y de la portada.">
                <div className="grid gap-5">
                  <Field id="pf-avatar" label="Foto de perfil (URL)">
                    <input id="pf-avatar" type="url" inputMode="url" value={formData.avatar} onChange={(e) => updateField("avatar", e.target.value)} placeholder="https://ejemplo.com/foto.jpg" className="mv-input" />
                  </Field>
                  <Field id="pf-cover" label="Imagen de portada (URL)">
                    <input id="pf-cover" type="url" inputMode="url" value={formData.coverImage} onChange={(e) => updateField("coverImage", e.target.value)} placeholder="https://ejemplo.com/portada.jpg" className="mv-input" />
                  </Field>
                </div>
              </FormSection>

              {/* Presentación */}
              <FormSection id="presentation" title="Presentación" description="Contá en pocas líneas qué hacés y para quién.">
                <Field id="pf-bio" label="Biografía" hint={<span className="mv-data">{formData.bio.length}/600</span>}>
                  <textarea id="pf-bio" value={formData.bio} onChange={(e) => updateField("bio", e.target.value.slice(0, 600))} rows={6} placeholder="Ej. Ayudo a marcas locales a vender online…" className="mv-input h-auto resize-y py-3 leading-relaxed" />
                </Field>
              </FormSection>

              {/* Seguridad */}
              <section id="security" className="scroll-mt-28">
                <TwoFactorSetup isEnabledInitial={formData.twoFactorEnabled} />
              </section>

              {/* Experiencia */}
              <FormSection id="experience" title="Experiencia" description="Tus trabajos, del más reciente al más antiguo.">
                <ExperienceForm items={formData.experiences} onChange={(val) => updateField("experiences", val)} />
              </FormSection>

              {/* Educación */}
              <FormSection id="education" title="Educación">
                <EducationForm items={formData.educations} onChange={(val) => updateField("educations", val)} />
              </FormSection>

              {/* Habilidades */}
              <FormSection id="skills" title="Habilidades" description="Escribí una habilidad, elegí el nivel y presioná Enter.">
                <SkillsForm items={formData.skills} onChange={(val) => updateField("skills", val)} />
              </FormSection>

              {/* Preferencias */}
              <FormSection id="preferences" title="Preferencias laborales">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id="pf-workmode" label="Modalidad preferida">
                    <Select value={formData.workMode} onValueChange={(v) => updateField("workMode", v)}>
                      <SelectTrigger id="pf-workmode" className="h-12 rounded-[0.875rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REMOTO">Remoto</SelectItem>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="pf-availability" label="Disponibilidad">
                    <Select value={formData.availabilityStatus} onValueChange={(v) => updateField("availabilityStatus", v)}>
                      <SelectTrigger id="pf-availability" className="h-12 rounded-[0.875rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INMEDIATA">Inmediata</SelectItem>
                        <SelectItem value="EN_SEMANAS">En unas semanas</SelectItem>
                        <SelectItem value="NO_DISPONIBLE">No disponible</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FormSection>

              {unsaved && (
                <div className="mv-sheet mv-menu sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-20 rounded-[1.5rem] p-3 pl-5 md:bottom-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]" role="status">
                      <AlertCircle className="h-4 w-4 text-gold" aria-hidden />
                      Tenés cambios sin guardar
                    </p>
                    <div className="flex gap-2">
                      <button type="button" className="mv-btn mv-btn-ghost mv-btn-sm flex-1 sm:flex-none" onClick={() => router.back()}>Descartar</button>
                      <button type="submit" disabled={saving} aria-busy={saving} className="mv-btn mv-btn-primary mv-btn-sm flex-1 sm:flex-none">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                        {saving ? "Guardando…" : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <aside className="hidden xl:block" aria-label="Vista previa pública">
            <div className="sticky top-28 space-y-3">
              <p className="mv-kicker">Vista previa pública</p>

              <div className="mv-panel overflow-hidden">
                <div className="relative h-28 bg-bg-tertiary">
                  {formData.coverImage ? (
                    <img src={formData.coverImage} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,175,55,0.22),transparent_60%),linear-gradient(135deg,var(--color-bg-tertiary),var(--color-bg-primary))]" />
                  )}
                </div>
                <div className="px-5 pb-5">
                  <div className="relative -mt-8 h-16 w-16 overflow-hidden rounded-2xl border-4 border-bg-secondary bg-bg-tertiary shadow-lg">
                    {formData.avatar ? (
                      <img src={formData.avatar} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <span className="grid h-full w-full place-items-center font-display text-xl font-semibold text-gold/50" aria-hidden>
                        {formData.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">{formData.name || "Tu nombre"}</p>
                  {formData.headline && <p className="mt-0.5 line-clamp-1 text-sm text-[var(--text-secondary)]">{formData.headline}</p>}
                  {formData.location && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {formData.location}
                    </p>
                  )}
                  {formData.bio && (
                    <p className="mt-4 line-clamp-4 border-t border-[var(--mv-hairline)] pt-4 text-sm leading-relaxed text-[var(--text-secondary)]">{formData.bio}</p>
                  )}
                  {formData.skills.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--mv-hairline)] pt-4">
                      {formData.skills.slice(0, 5).map((skill: any) => (
                        <li key={skill.id} className="mv-chip mv-chip-gold">{skill.name}</li>
                      ))}
                      {formData.skills.length > 5 && <li className="mv-chip">+{formData.skills.length - 5}</li>}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {previewToast && (
        <div role="status" className="mv-pop mv-menu fixed left-1/2 top-[calc(5.5rem+env(safe-area-inset-top,0px))] z-[90] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold" aria-hidden /> {previewToast}</span>
        </div>
      )}
    </div>
  );
}

function FormSection({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mv-panel scroll-mt-28 p-5 sm:p-7">
      <h2 id={`${id}-title`} className="mv-h3">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
        {hint ? <span className="text-xs text-[var(--text-tertiary)]">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
// creado por pato dev y askforvini
