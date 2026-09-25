"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  UserCircle2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  BadgeCheck,
  FolderOpen,
  Settings2,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ExperienceForm, EducationForm, SkillsForm } from "@/components/profile/ProfileForms";
import { TwoFactorSetup } from "@/components/profile/TwoFactorSetup";

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
    return <div className="min-h-screen flex items-center justify-center bg-bg-primary pt-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link href="/perfil" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mi perfil
        </Link>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Editar Perfil</h1>
            <p className="mt-2 text-sm text-gray-400">Personaliza tu perfil profesional para destacar en el ecosistema Mercav.</p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-sm text-gray-300">
            Compleción: <span className="font-semibold text-white">{completeness}%</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_1fr_320px]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-3xl border border-border bg-bg-secondary p-4">
              <div className="mb-4 text-sm font-semibold text-white">Secciones</div>
              <nav className="space-y-2 text-sm">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a key={section.id} href={`#${section.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-primary px-4 py-3 text-gray-300 hover:text-white hover:border-gold/40 transition-colors">
                      <Icon className="h-4 w-4 text-gold" />
                      <span>{section.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); void saveProfile(false); }} className="space-y-6">
              {/* Básicos */}
              <section id="basic" className="scroll-mt-24 rounded-3xl border border-border bg-bg-secondary p-6">
                <h3 className="mb-5 text-xl font-bold text-white">Información básica</h3>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Imagen de portada (URL)</label>
                    <input value={formData.coverImage} onChange={(e) => updateField("coverImage", e.target.value)} placeholder="https://ejemplo.com/banner.jpg" className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-white outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Foto de perfil (URL)</label>
                    <input value={formData.avatar} onChange={(e) => updateField("avatar", e.target.value)} placeholder="https://ejemplo.com/foto.jpg" className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-white outline-none focus:border-gold" />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Tipo de perfil</label>
                      <Select value={formData.profileType} onValueChange={(v) => updateField("profileType", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERSONAL">Profesional Independiente</SelectItem>
                          <SelectItem value="EMPRESA">Empresa / Agencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Nombre / Razón social</label>
                      <input value={formData.name} onChange={(e) => updateField("name", e.target.value)} className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-white outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Titular / Cargo</label>
                      <input value={formData.headline} onChange={(e) => updateField("headline", e.target.value)} placeholder="Ej. Senior Frontend Developer" className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-white outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Ubicación</label>
                      <input value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Ej. La Paz, Bolivia" className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-white outline-none focus:border-gold" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Presentación */}
              <section id="presentation" className="scroll-mt-24 rounded-3xl border border-border bg-bg-secondary p-6">
                <h3 className="mb-5 text-xl font-bold text-white">Presentación</h3>
                <textarea value={formData.bio} onChange={(e) => updateField("bio", e.target.value.slice(0, 600))} rows={7} placeholder="Háblanos de ti..." className="w-full rounded-2xl border border-border bg-bg-primary p-4 text-white outline-none focus:border-gold resize-none" />
                <div className="mt-2 text-right text-xs text-gray-500">{formData.bio.length}/600</div>
              </section>

              {/* Seguridad */}
              <section id="security" className="scroll-mt-24">
                <TwoFactorSetup isEnabledInitial={formData.twoFactorEnabled} />
              </section>

              {/* Experiencia Real */}
              <section id="experience" className="scroll-mt-24 rounded-3xl border border-border bg-bg-secondary p-6">
                <h3 className="mb-5 text-xl font-bold text-white">Experiencia</h3>
                <ExperienceForm items={formData.experiences} onChange={(val) => updateField("experiences", val)} />
              </section>

              {/* Educación Real */}
              <section id="education" className="scroll-mt-24 rounded-3xl border border-border bg-bg-secondary p-6">
                <h3 className="mb-5 text-xl font-bold text-white">Educación</h3>
                <EducationForm items={formData.educations} onChange={(val) => updateField("educations", val)} />
              </section>

              {/* Habilidades Reales */}
              <section id="skills" className="scroll-mt-24 rounded-3xl border border-border bg-bg-secondary p-6">
                <h3 className="mb-5 text-xl font-bold text-white">Habilidades</h3>
                <SkillsForm items={formData.skills} onChange={(val) => updateField("skills", val)} />
              </section>

              {/* Preferencias Reales */}
              <section id="preferences" className="scroll-mt-24 rounded-3xl border border-border bg-bg-secondary p-6">
                <h3 className="mb-5 text-xl font-bold text-white">Preferencias laborales</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Modalidad preferida</label>
                    <Select value={formData.workMode} onValueChange={(v) => updateField("workMode", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REMOTO">Remoto</SelectItem>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Disponibilidad</label>
                    <Select value={formData.availabilityStatus} onValueChange={(v) => updateField("availabilityStatus", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INMEDIATA">Inmediata</SelectItem>
                        <SelectItem value="EN_SEMANAS">En unas semanas</SelectItem>
                        <SelectItem value="NO_DISPONIBLE">No disponible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {unsaved && (
                <section
                  className="sticky bottom-4 z-20 rounded-3xl border border-gold/30 bg-bg-secondary/95 p-4 backdrop-blur-xl shadow-2xl shadow-gold/5"
                  style={{ animation: 'slideUp 0.25s ease-out' }}
                >
                  <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      Tienes cambios sin guardar
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="border-border text-gray-300 hover:text-white" onClick={() => router.back()}>Descartar</Button>
                      <Button type="submit" disabled={saving} className="bg-gold text-black hover:bg-gold-light font-bold px-8">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Guardar Todo
                      </Button>
                    </div>
                  </div>
                </section>
              )}
            </form>
          </main>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              {/* Label */}
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-semibold px-1">
                <span className="w-2 h-2 rounded-full bg-gold inline-block"></span>
                Vista Previa Pública
              </div>

              {/* Profile Card */}
              <div className="rounded-3xl border border-border bg-bg-secondary overflow-hidden shadow-2xl shadow-black/40">
                {/* Cover + Avatar anchored to bottom */}
                <div className="h-32 relative bg-gradient-to-br from-gold/10 via-bg-tertiary to-bg-primary">
                  {formData.coverImage && (
                    <img src={formData.coverImage} className="h-full w-full object-cover" alt="Cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent" />
                  {/* Avatar pinned to bottom-center of the cover */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                    <div className="h-16 w-16 rounded-2xl border-4 border-bg-secondary bg-bg-tertiary overflow-hidden shadow-xl ring-2 ring-gold/20">
                      {formData.avatar ? (
                        <img src={formData.avatar} className="h-full w-full object-cover" alt="Avatar" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl font-bold text-gray-500">
                          {formData.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content below cover — pt accounts for the avatar overflow */}
                <div className="flex flex-col items-center pt-12 pb-5 px-5">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-white font-bold text-base">{formData.name || "Tu nombre"}</div>
                      {/* Special Badges in Preview */}
                      {formData.name?.toLowerCase().includes("admin") && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    {formData.headline && (
                      <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">{formData.headline}</div>
                    )}
                    {formData.location && (
                      <div className="text-gray-500 text-xs mt-1">📍 {formData.location}</div>
                    )}
                  </div>

                  {formData.bio && (
                    <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed line-clamp-3 border-t border-border pt-4 w-full">
                      {formData.bio}
                    </p>
                  )}

                  {formData.skills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border w-full">
                      <div className="text-xs text-gray-500 mb-2">Habilidades</div>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.skills.slice(0, 5).map((skill: any) => (
                          <span key={skill.id} className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full">
                            {skill.name}
                          </span>
                        ))}
                        {formData.skills.length > 5 && (
                          <span className="text-[10px] text-gray-500">+{formData.skills.length - 5} más</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Completeness indicator */}
              <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Compleción del perfil</span>
                  <span className="text-white font-semibold">{completeness}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
