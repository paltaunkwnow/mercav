import { Bug, Rocket, Wrench } from "@/components/icons";
import { ButtonLink, CTABand, Container, PageHero, Section } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

const UPDATES = [
  {
    version: "v1.4.0",
    date: "8 de Octubre, 2026",
    title: "App Mercav, Business y Calendario",
    description: "El producto se muda a app.mercav.lat, llega Mercav Business y se suma el Calendario.",
    type: "MAJOR",
    tags: ["App", "Business", "Calendario", "Sitio público"],
    changes: [
      { type: "feature", text: "Nueva app en app.mercav.lat: todo lo que usás con tu cuenta vive ahí, con un inicio al estilo de una app móvil." },
      { type: "feature", text: "Mercav Business toma el lugar del punto de venta: empresas, legajos y planilla mensual para Bolivia." },
      { type: "feature", text: "Planillas exportables a Excel, boletas en PDF, roles e invitaciones para tu equipo." },
      { type: "feature", text: "Calendario con feriados de 20 países y el calendario hebreo: elegí qué ver, ocultá fechas y exportalo en .ics." },
      { type: "improvement", text: "Sitio público más simple en mercav.lat, con la presentación de Mercav y los textos legales." }
    ]
  },
  {
    version: "v1.3.0",
    date: "1 de Octubre, 2026",
    title: "Ecosistema Unificado: POS, Kosher, Pwn y Seguridad reCAPTCHA",
    description: "Sincronización integral de sistemas, optimizaciones de despliegue en Vercel y protección de acceso.",
    type: "MAJOR",
    tags: ["POS", "Kosher", "Pwn", "Seguridad", "Vercel"],
    changes: [
      { type: "feature", text: "Integración de Punto de Venta (POS) multi-rubro y control de inventario." },
      { type: "feature", text: "Módulo Mercav Kosher con directorio comunitario y geolocalización." },
      { type: "improvement", text: "Plataforma Mercav Pwn con monitoreo defensivo y señales de filtraciones." },
      { type: "fix", text: "Actualización de verificación de seguridad con Google reCAPTCHA v3/Enterprise." },
      { type: "improvement", text: "Compatibilidad optimizada de compilación y postinstall para Vercel." }
    ]
  },
  {
    version: "v1.2.0",
    date: "7 de Mayo, 2026",
    title: "Ecosistema de Moderación y Feed Inteligente",
    description: "Una actualización centrada en el control del contenido y en la experiencia de uso.",
    type: "MAJOR",
    tags: ["Moderación", "Feed", "UI/UX"],
    changes: [
      { type: "feature", text: "Sistema de edición y eliminación de publicaciones para autores." },
      { type: "feature", text: "Panel de moderación avanzado para administradores." },
      { type: "improvement", text: "Nuevas notificaciones Toast personalizadas con animaciones físicas." },
      { type: "fix", text: "Corrección de persistencia en la compleción del perfil (F5 bug)." },
      { type: "improvement", text: "Filtros inteligentes por ubicación y tipo de módulo en el feed." }
    ]
  },
  {
    version: "v1.1.5",
    date: "5 de Mayo, 2026",
    title: "Arquitectura de Perfil Profesional",
    description: "Transformamos los perfiles para que actúen como tu carta de presentación ante el mundo.",
    type: "FEATURE",
    tags: ["Perfiles", "LinkedIn-Style"],
    changes: [
      { type: "feature", text: "Sección de experiencia laboral con validación de fechas." },
      { type: "feature", text: "Sistema de habilidades con niveles de maestría." },
      { type: "improvement", text: "Optimización de carga para imágenes de alta resolución." }
    ]
  },
  {
    version: "v1.1.0",
    date: "1 de Mayo, 2026",
    title: "Lanzamiento Oficial de Mercav",
    description: "La primera versión pública de Mercav para profesionales y empresas en Latinoamérica.",
    type: "RELEASE",
    tags: ["Lanzamiento", "Seguridad"],
    changes: [
      { type: "feature", text: "Lanzamiento del Feed General Multimodal." },
      { type: "feature", text: "Autenticación de dos factores (2FA) via App." },
      { type: "feature", text: "Módulos base de Empleos y Servicios activos." }
    ]
  }
];

const TYPE_LABEL: Record<string, string> = { MAJOR: "Versión mayor", FEATURE: "Funciones", RELEASE: "Lanzamiento" };
const CHANGE_META = {
  feature: { label: "Nuevo", icon: Rocket, cls: "text-gold" },
  improvement: { label: "Mejora", icon: Wrench, cls: "text-[var(--text-secondary)]" },
  fix: { label: "Corrección", icon: Bug, cls: "text-[var(--text-secondary)]" },
} as const;

export default function ChangelogPage() {
  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Novedades"
        title="Cómo evoluciona Mercav."
        lead="Cada versión publicada, con lo que agregamos, lo que mejoramos y lo que corregimos."
      />

      <Section tight className="!pt-4 md:!pt-6" labelledBy="versiones">
        <Container>
          <h2 id="versiones" className="sr-only">
            Historial de versiones
          </h2>
          <ol className="relative">
            {UPDATES.map((update, i) => {
              const latest = i === 0;
              return (
                <li key={update.version} className="relative grid gap-4 pb-12 pl-8 last:pb-0 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-12 md:pb-16 md:pl-0">
                  {i < UPDATES.length - 1 ? (
                    <div aria-hidden className="absolute bottom-0 left-[5px] top-4 w-px bg-[var(--mv-hairline-strong)] md:left-[calc(13.5rem-0.5px)]" />
                  ) : null}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1.5 z-[1] block h-[11px] w-[11px] rounded-full border-2 md:left-[calc(13.5rem-5.5px)]",
                      latest ? "border-gold bg-gold" : "border-[var(--mv-hairline-strong)] bg-bg-primary",
                    )}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:flex-col md:gap-1.5 md:text-right">
                    <span className="mv-data text-sm text-[var(--text-primary)] md:w-full">{update.version}</span>
                    <time className="text-sm text-[var(--text-tertiary)] md:w-full">{update.date}</time>
                  </div>

                  <article className={cn("min-w-0 p-6 md:p-8", latest ? "liquid-glass rounded-[1.75rem]" : "mv-panel")} aria-labelledby={`v-${i}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("mv-chip", latest && "mv-chip-gold")}>{TYPE_LABEL[update.type] ?? update.type}</span>
                      {latest ? <span className="mv-chip">Última versión</span> : null}
                    </div>
                    <h3 id={`v-${i}`} className="mv-h3 mt-4">
                      {update.title}
                    </h3>
                    <p className="mv-body mt-2 max-w-2xl">{update.description}</p>
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
                      {update.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <ul className="mt-6 space-y-3 border-t border-[var(--mv-hairline)] pt-6">
                      {update.changes.map((change, idx) => {
                        const meta = CHANGE_META[change.type as keyof typeof CHANGE_META] ?? CHANGE_META.improvement;
                        const Icon = meta.icon;
                        return (
                          <li key={idx} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                            <span className={cn("inline-flex items-center gap-1.5 pt-0.5 text-xs font-semibold", meta.cls)}>
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                              {meta.label}
                            </span>
                            <span className="text-[0.9375rem] leading-relaxed text-[var(--text-primary)]">{change.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ol>
        </Container>
      </Section>

      <CTABand
        title="¿Qué te gustaría ver en la próxima versión?"
        lead="Las ideas de quienes usan Mercav ordenan lo que construimos después."
        action={<ButtonLink href="/contacto" size="lg" className="w-full sm:w-auto">Enviar una sugerencia</ButtonLink>}
      />
    </div>
  );
}
// creado por pato dev y askforvini
