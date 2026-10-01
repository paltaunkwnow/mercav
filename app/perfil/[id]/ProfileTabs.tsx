"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Briefcase,
  MonitorPlay,
  Megaphone,
  LayoutGrid,
  GraduationCap,
  MessageSquare,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Clock,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString("es-ES", opts);
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--mv-hairline-strong)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
      {children}
    </div>
  );
}

function SubHeading({ icon: Icon, children }: { icon: typeof Briefcase; children: ReactNode }) {
  return (
    <h3 className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold text-[var(--text-primary)]">
      <Icon className="h-[18px] w-[18px] text-gold" aria-hidden />
      {children}
    </h3>
  );
}

export default function ProfileTabs({ user, posts }: { user: any, posts: any[] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const reduce = useReducedMotion();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = [
    { id: "overview", label: "Resumen", icon: LayoutGrid },
    { id: "services", label: "Servicios", icon: MonitorPlay, count: user.services?.length || 0 },
    { id: "spaces", label: "Espacios", icon: Megaphone, count: user.spaces?.length || 0 },
    { id: "jobs", label: "Vacantes", icon: Briefcase, count: user.jobPosts?.length || 0 },
    { id: "experience", label: "Trayectoria", icon: GraduationCap },
    { id: "posts", label: "Publicaciones", icon: MessageSquare, count: posts.length },
  ].filter(tab => tab.id === "overview" || tab.id === "experience" || (tab.count !== undefined && tab.count > 0) || tab.id === "posts");

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === activeTab);
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const panel = (key: string, className: string, children: ReactNode) => (
    <motion.div
      key={key}
      role="tabpanel"
      id={`${baseId}-panel-${key}`}
      aria-labelledby={`${baseId}-tab-${key}`}
      tabIndex={0}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={`outline-none ${className}`}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="w-full">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Secciones del perfil"
        onKeyDown={onKeyDown}
        className="scrollbar-hide mb-8 flex gap-1 overflow-x-auto rounded-full border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-1.5 md:mb-10"
      >
        {tabs.map((tab, i) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`mv-focus flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 ${
                selected
                  ? "bg-gold text-[var(--mv-on-gold)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <tab.icon className="h-4 w-4" aria-hidden />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`mv-data rounded-full px-1.5 text-xs ${selected ? "bg-black/15" : "bg-[var(--mv-panel-hover)]"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[320px]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "overview" && panel("overview", "space-y-10", (
            <>
              {(user.services?.length > 0 || user.spaces?.length > 0 || user.jobPosts?.length > 0) ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(user.services?.length > 0 || user.spaces?.length > 0) && (
                    <div className="mv-panel flex flex-col p-6 md:p-7">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                        <MonitorPlay className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="mv-h3 mt-5">Portafolio</h3>
                      <p className="mv-body mt-2 flex-1">Servicios y espacios publicitarios que {user.name} tiene disponibles.</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {user.services?.length > 0 && (
                          <button type="button" onClick={() => setActiveTab("services")} className="mv-btn mv-btn-secondary mv-btn-sm">
                            Servicios <ArrowRight className="h-4 w-4" aria-hidden />
                          </button>
                        )}
                        {user.spaces?.length > 0 && (
                          <button type="button" onClick={() => setActiveTab("spaces")} className="mv-btn mv-btn-secondary mv-btn-sm">
                            Espacios <ArrowRight className="h-4 w-4" aria-hidden />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {user.jobPosts?.length > 0 && (
                    <div className="mv-panel flex flex-col p-6 md:p-7">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                        <Briefcase className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="mv-h3 mt-5">Vacantes abiertas</h3>
                      <p className="mv-body mt-2 flex-1">Puestos vigentes para sumarte al equipo de {user.name}.</p>
                      <div className="mt-5">
                        <button type="button" onClick={() => setActiveTab("jobs")} className="mv-btn mv-btn-secondary mv-btn-sm">
                          Ver vacantes <ArrowRight className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState>{user.name} todavía no publicó servicios, espacios ni vacantes.</EmptyState>
              )}

              {user.profile?.skills?.length > 0 && (
                <section>
                  <SubHeading icon={GraduationCap}>Habilidades</SubHeading>
                  <ul className="flex flex-wrap gap-2">
                    {user.profile.skills.slice(0, 12).map((skill: any) => (
                      <li key={skill.id} className="mv-chip h-8 px-3 text-[13px]">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ))}

          {activeTab === "services" && panel("services", "grid grid-cols-1 gap-4 md:grid-cols-2", (
            user.services.map((service: any) => {
              const pkg = service.packages?.[0];
              return (
                <Link href={`/servicios/${service.id}`} key={service.id} className="mv-panel mv-panel-interactive mv-focus group flex flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-display text-lg font-semibold leading-snug text-[var(--text-primary)]">{service.title}</h4>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-gold" aria-hidden />
                  </div>
                  {service.description && <p className="mv-body mt-2 line-clamp-3 flex-1">{service.description}</p>}
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--mv-hairline)] pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                      <Clock className="h-4 w-4" aria-hidden />
                      {(pkg?.deliveryDays ?? service.deliveryDays) ? `${pkg?.deliveryDays ?? service.deliveryDays} días` : "Plazo a convenir"}
                    </span>
                    {pkg?.price != null && (
                      <span className="text-right">
                        <span className="block text-xs text-[var(--text-tertiary)]">Desde</span>
                        <span className="mv-data text-lg font-medium text-gold">${pkg.price}</span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          ))}

          {activeTab === "spaces" && panel("spaces", "grid grid-cols-1 gap-4 md:grid-cols-2", (
            user.spaces.map((space: any) => (
              <Link href={`/anuncios/${space.id}`} key={space.id} className="mv-panel mv-panel-interactive mv-focus group flex gap-4 p-4 sm:gap-5 sm:p-5">
                <div className="aspect-square w-24 shrink-0 overflow-hidden rounded-2xl border border-[var(--mv-hairline)] bg-bg-tertiary sm:w-28">
                  {space.images?.[0]?.url ? (
                    <img src={space.images[0].url} className="h-full w-full object-cover" alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[var(--text-tertiary)]"><Megaphone className="h-6 w-6" aria-hidden /></span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  {space.type && <span className="text-xs font-medium text-[var(--text-secondary)]">{space.type}</span>}
                  <h4 className="mt-0.5 line-clamp-2 font-display text-base font-semibold leading-snug text-[var(--text-primary)] sm:text-lg">{space.title}</h4>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                    {space.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden /> {space.city}</span>}
                    {space.pricePerMonth != null && <span className="mv-data text-gold">${space.pricePerMonth}/mes</span>}
                  </div>
                </div>
              </Link>
            ))
          ))}

          {activeTab === "jobs" && panel("jobs", "grid grid-cols-1 gap-3", (
            user.jobPosts.map((job: any) => (
              <Link href={`/empleos/${job.id}`} key={job.id} className="mv-panel mv-panel-interactive mv-focus group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <h4 className="font-display text-lg font-semibold text-[var(--text-primary)]">{job.title}</h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                    {job.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden /> {job.city}</span>}
                    {job.employmentType && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" aria-hidden /> {job.employmentType.replace('_', ' ')}</span>}
                    {job.salaryVisible && <span className="mv-data text-gold">${job.salaryMin} – ${job.salaryMax}</span>}
                  </div>
                </div>
                <span className="mv-btn mv-btn-secondary mv-btn-sm pointer-events-none w-full sm:w-auto">
                  Ver vacante <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            ))
          ))}

          {activeTab === "experience" && panel("experience", "space-y-12", (
            <>
              <section>
                <SubHeading icon={Briefcase}>Experiencia profesional</SubHeading>
                {user.profile?.experiences?.length > 0 ? (
                  <ol className="relative space-y-4 border-l border-[var(--mv-hairline-strong)] pl-6 md:pl-8">
                    {user.profile.experiences.map((exp: any) => (
                      <li key={exp.id} className="relative">
                        <span aria-hidden className="absolute -left-[31px] top-6 h-3 w-3 rounded-full border-2 border-gold bg-bg-primary md:-left-[39px]" />
                        <div className="mv-panel p-5 md:p-6">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
                            <div>
                              <h4 className="font-display text-lg font-semibold text-[var(--text-primary)]">{exp.position}</h4>
                              <p className="text-sm font-medium text-gold">{exp.company}</p>
                            </div>
                            <p className="mv-data shrink-0 text-xs text-[var(--text-secondary)]">
                              {formatDate(exp.startDate, { month: 'short', year: 'numeric' })} –{' '}
                              {exp.currentJob ? "Actualidad" : formatDate(exp.endDate, { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {exp.description && <p className="mv-body mt-3 whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState>Todavía no cargó experiencia profesional.</EmptyState>
                )}
              </section>

              <section>
                <SubHeading icon={GraduationCap}>Formación</SubHeading>
                {user.profile?.educations?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {user.profile.educations.map((edu: any) => (
                      <div key={edu.id} className="mv-panel p-5 md:p-6">
                        <h4 className="font-display text-lg font-semibold text-[var(--text-primary)]">{edu.degree}</h4>
                        <p className="mt-0.5 text-sm font-medium text-[var(--text-secondary)]">{edu.institution}</p>
                        <p className="mv-data mt-3 text-xs text-[var(--text-tertiary)]">
                          {edu.startYear} – {edu.currentlyStudying ? "Presente" : edu.endYear}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>Todavía no cargó formación académica.</EmptyState>
                )}
              </section>
            </>
          ))}

          {activeTab === "posts" && panel("posts", "space-y-4", (
            posts.length > 0 ? posts.map((post) => (
              <article key={post.id} className="mv-panel p-5 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <time dateTime={new Date(post.createdAt).toISOString()} className="mv-data text-xs text-[var(--text-secondary)]">
                    {formatDate(post.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" aria-hidden /> <span className="mv-data">{post._count.likes}</span><span className="sr-only">reacciones</span></span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" aria-hidden /> <span className="mv-data">{post._count.comments}</span><span className="sr-only">comentarios</span></span>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-primary)]">{post.content}</p>
                {post.linkUrl && (
                  <a href={post.linkUrl} target="_blank" rel="noreferrer" className="mv-link mt-4 inline-flex items-center gap-1.5 text-sm">
                    Abrir enlace <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </article>
            )) : (
              <EmptyState>{user.name} todavía no publicó en el feed.</EmptyState>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
