"use client";

import { useState } from "react";
import { 
  Briefcase, 
  MonitorPlay, 
  Megaphone, 
  LayoutGrid, 
  GraduationCap, 
  Star,
  MessageSquare,
  ArrowRight,
  MapPin,
  Clock
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileTabs({ user, posts }: { user: any, posts: any[] }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Resumen", icon: LayoutGrid },
    { id: "services", label: "Servicios", icon: MonitorPlay, count: user.services?.length || 0 },
    { id: "spaces", label: "Espacios", icon: Megaphone, count: user.spaces?.length || 0 },
    { id: "jobs", label: "Vacantes", icon: Briefcase, count: user.jobPosts?.length || 0 },
    { id: "experience", label: "Trayectoria", icon: GraduationCap },
    { id: "posts", label: "Posts", icon: MessageSquare, count: posts.length },
  ].filter(tab => tab.id === "overview" || tab.id === "experience" || (tab.count !== undefined && tab.count > 0) || tab.id === "posts");

  return (
    <div className="w-full">
      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl mb-12 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-gold text-black shadow-lg shadow-gold/20" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-black/20" : "bg-white/10"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Featured Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(user.services?.length > 0 || user.spaces?.length > 0) && (
                  <div className="bg-bg-secondary border border-border p-8 rounded-[2.5rem] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <MonitorPlay size={100} className="text-gold" />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-4">Portafolio Profesional</h3>
                     <p className="text-gray-500 text-sm mb-8 leading-relaxed">Explora los servicios y espacios publicitarios que {user.name} tiene disponibles.</p>
                     <div className="flex gap-4">
                       {user.services?.length > 0 && (
                        <button onClick={() => setActiveTab("services")} className="flex items-center text-xs font-black uppercase tracking-widest text-gold hover:opacity-70 transition-opacity">
                            Servicios <ArrowRight size={14} className="ml-2" />
                        </button>
                       )}
                       {user.spaces?.length > 0 && (
                        <button onClick={() => setActiveTab("spaces")} className="flex items-center text-xs font-black uppercase tracking-widest text-emerald-400 hover:opacity-70 transition-opacity">
                            Espacios <ArrowRight size={14} className="ml-2" />
                        </button>
                       )}
                     </div>
                  </div>
                )}
                
                {user.jobPosts?.length > 0 && (
                  <div className="bg-bg-secondary border border-border p-8 rounded-[2.5rem] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Briefcase size={100} className="text-blue-400" />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-4">Oportunidades Laborales</h3>
                     <p className="text-gray-500 text-sm mb-8 leading-relaxed">Descubre las vacantes vigentes y únete al equipo de {user.name}.</p>
                     <button onClick={() => setActiveTab("jobs")} className="flex items-center text-xs font-black uppercase tracking-widest text-blue-400 hover:translate-x-2 transition-transform">
                        Ver Vacantes <ArrowRight size={14} className="ml-2" />
                     </button>
                  </div>
                )}
              </div>

              {/* Skills Quick View */}
              {user.profile?.skills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6">Habilidades Especializadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.profile.skills.slice(0, 8).map((skill: any) => (
                      <span key={skill.id} className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold text-gray-400">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {user.services.map((service: any) => (
                <Link href={`/servicios/${service.id}`} key={service.id} className="bg-bg-secondary border border-border rounded-[2.5rem] overflow-hidden hover:border-gold/30 transition-all group">
                  <div className="h-48 bg-bg-tertiary relative overflow-hidden">
                    <img src={`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={service.title} />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl text-gold font-mono font-black shadow-2xl">
                      ${service.packages?.[0]?.price || 0}
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors">{service.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">{service.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                      <span className="flex items-center gap-1"><Clock size={12} /> {service.deliveryDays || 7} días</span>
                      <span className="flex items-center gap-1"><Star size={12} className="text-gold fill-gold" /> 5.0</span>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {activeTab === "spaces" && (
            <motion.div
              key="spaces"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {user.spaces.map((space: any) => (
                <Link href={`/anuncios/${space.id}`} key={space.id} className="bg-bg-secondary border border-border p-6 rounded-[2.5rem] hover:border-emerald-400/30 transition-all group flex gap-6">
                  <div className="w-32 h-32 bg-bg-tertiary rounded-3xl overflow-hidden flex-shrink-0 border border-white/5">
                    <img src={space.images?.[0]?.url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={space.title} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{space.type}</span>
                    <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 leading-tight">{space.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-400" /> {space.city}</span>
                      <span className="text-white font-mono">${space.pricePerMonth}/mes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {activeTab === "jobs" && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 gap-6"
            >
              {user.jobPosts.map((job: any) => (
                <Link href={`/empleos/${job.id}`} key={job.id} className="bg-bg-secondary border border-border p-8 rounded-[2.5rem] hover:border-blue-400/30 transition-all group">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                           <span className="flex items-center gap-1"><MapPin size={12} /> {job.city}</span>
                           <span className="flex items-center gap-1"><Briefcase size={12} /> {job.employmentType.replace('_', ' ')}</span>
                           {job.salaryVisible && <span className="text-blue-400">${job.salaryMin} — ${job.salaryMax}</span>}
                        </div>
                     </div>
                     <button className="bg-blue-400/10 text-blue-400 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-400/20 group-hover:bg-blue-400 group-hover:text-black transition-all">
                        Postularse
                     </button>
                   </div>
                </Link>
              ))}
            </motion.div>
          )}

          {activeTab === "experience" && (
            <motion.div
              key="experience"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Experience Timeline */}
              <section>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                  <Briefcase size={18} className="text-gold" /> Experiencia Profesional
                </h3>
                <div className="space-y-12">
                  {user.profile?.experiences?.map((exp: any) => (
                    <div key={exp.id} className="relative pl-12 border-l border-white/5 group">
                      <div className="absolute w-4 h-4 bg-bg-primary border-2 border-gold rounded-full -left-[8.5px] top-0 shadow-[0_0_15px_rgba(255,215,0,0.3)] group-hover:scale-125 transition-transform" />
                      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-white">{exp.position}</h4>
                            <p className="text-gold font-medium">{exp.company}</p>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            {new Date(exp.startDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} — 
                            {exp.currentJob ? " Actualidad" : ` ${new Date(exp.endDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`}
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education */}
              <section>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                  <GraduationCap size={18} className="text-blue-400" /> Formación Académica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.profile?.educations?.map((edu: any) => (
                    <div key={edu.id} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.04] transition-all">
                       <h4 className="text-lg font-bold text-white mb-1">{edu.degree}</h4>
                       <p className="text-blue-400 text-sm mb-4 font-medium">{edu.institution}</p>
                       <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          {edu.startYear} — {edu.currentlyStudying ? "Presente" : edu.endYear}
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "posts" && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {posts.map((post) => (
                <article key={post.id} className="bg-bg-secondary border border-border p-8 rounded-[2.5rem] hover:border-white/10 transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-xl bg-gold/10 text-gold">
                          <Clock size={14} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                      <span>{post._count.likes} Likes</span>
                      <span>{post._count.comments} Comentarios</span>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-base mb-6 whitespace-pre-wrap">{post.content}</p>
                  {post.linkUrl && (
                    <a href={post.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gold hover:opacity-70 transition-opacity">
                      Ver recurso vinculado <ArrowRight size={14} className="ml-2" />
                    </a>
                  )}
                </article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
