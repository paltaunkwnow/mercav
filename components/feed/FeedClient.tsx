"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Zap,
  Megaphone,
  MonitorPlay,
  Wrench,
  MoreHorizontal,
  Trash2,
  Pencil,
  Crown,
  ShieldAlert,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Toast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { ReportModal } from "@/components/ui/ReportModal";
import { LiquidArrange } from "@/components/motion/LiquidArrange";

type ModuleFilter = "ALL" | "GENERAL" | "ADS" | "SERVICES" | "JOBS";

type FeedPost = any;

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function formatMoney(value: any, currency = "USD") {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return `${value}`;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(num);
}

function useDebouncedValue<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function BadgePill({ badge, size = "sm" }: { badge: any; size?: "sm" | "md" }) {
  return (
    <div className="group/badge relative flex items-center justify-center cursor-help transition-transform hover:scale-110">
      <div className={`${size === "md" ? "h-6 w-6" : "h-5 w-5"} flex items-center justify-center`}>
        <img src={badge.icon} alt="" className="w-full h-full object-contain" />
      </div>
      
      {/* Tooltip on Hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0a0a0a] border border-white/10 text-[9px] font-black text-white uppercase tracking-widest rounded-lg opacity-0 group-hover/badge:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[10003] scale-90 group-hover/badge:scale-100 shadow-2xl backdrop-blur-xl">
        {badge.name}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-white/10" />
      </div>
    </div>
  );
}



export function FeedClient({ currentUser }: { currentUser: any }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [featuredSpaces, setFeaturedSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [module, setModule] = useState<string>("GENERAL");
  const [jobId, setJobId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const debouncedLink = useDebouncedValue(linkUrl, 500);

  const loadFeed = async (cursor?: string | null, append = false) => {
    if (!append) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (moduleFilter !== "ALL") params.set("module", moduleFilter);
      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => (append ? [...prev, ...data.data.posts] : data.data.posts));
        setNextCursor(data.data.nextCursor);
        setSuggestedUsers(data.data.suggestedUsers || []);
        setRecommendedJobs(data.data.recommendedJobs || []);
        setFeaturedSpaces(data.data.featuredSpaces || []);
      }
    } finally {
      if (!append) setLoading(false);
      setLoadingMore(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({
    message: "",
    type: "info",
    visible: false
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, visible: true });
  };

  const deletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast("Publicación eliminada correctamente", "success");
      } else {
        showToast(data.error || "Error al eliminar", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión", "error");
    }
  };

  const confirmDelete = (id: string) => {
    setPostToDelete(id);
    setIsDeleteModalOpen(true);
  };

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter]);

  useEffect(() => {
    if (!debouncedLink) {
      setLinkPreview(null);
      return;
    }

    let cancelled = false;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(debouncedLink)}`);
        const data = await res.json();
        if (!cancelled && data.success) setLinkPreview(data.data);
      } catch {
        if (!cancelled) setLinkPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [debouncedLink]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && nextCursor && !loadingMore) {
        setLoadingMore(true);
        loadFeed(nextCursor, true);
      }
    });

    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore]);

  const publishPost = async () => {
    if (!content.trim() && !images.length && !videoUrl && !linkUrl) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          images,
          videoUrl,
          linkUrl,
          linkPreview,
          module,
          jobId: module === "JOBS" ? jobId || undefined : undefined,
          serviceId: module === "SERVICES" ? serviceId || undefined : undefined,
          spaceId: module === "ADS" ? spaceId || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [data.data, ...prev]);
        setContent("");
        setImages([]);
        setVideoUrl("");
        setLinkUrl("");
        setLinkPreview(null);
        setJobId("");
        setServiceId("");
        setSpaceId("");
        setComposerOpen(false);
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 4 - images.length);
    const encoded = await Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          })
      )
    );
    setImages((prev) => [...prev, ...encoded].slice(0, 4));
  };

  const handleVideoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const encoded = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    setVideoUrl(encoded);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <aside className="hidden xl:block xl:col-span-3 space-y-4 sticky top-24 self-start">
        <div className="rounded-3xl border border-white/5 bg-bg-secondary p-6 shadow-xl shadow-black/20">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-bg-tertiary border border-white/5">
              {currentUser.avatar ? <img src={currentUser.avatar} className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <div className="font-bold text-white text-lg flex items-center gap-2">
                {currentUser.name}
                {currentUser.isVerified && <ShieldCheck className="h-4 w-4 text-blue-400" />}
              </div>
              <div className="text-xs text-gold font-mono mb-2">@{currentUser.username}</div>
              {currentUser.badges && currentUser.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.badges.map((b: any) => <BadgePill key={b.id} badge={b} />)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 font-black mb-2">
              <span>Perfil</span>
              <span>{currentUser.profileCompleteness || 0}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentUser.profileCompleteness || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gold" 
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-bg-secondary p-4 shadow-xl shadow-black/20">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Comunidad</p>
          <CommunityShortcuts />
        </div>
      </aside>

      <main className="xl:col-span-6 space-y-6">
        <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-2xl bg-bg-secondary/50 border border-white/5 w-fit">
          {[
            ["ALL", "Todos"],
            ["JOBS", "Solo Empleos"],
            ["SERVICES", "Solo Servicios"],
            ["ADS", "Solo Publicidad"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setModuleFilter(value as ModuleFilter)}
              className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${moduleFilter === value ? "bg-gold text-black shadow-lg shadow-gold/20" : "text-gray-500 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="rounded-[2.5rem] border border-white/5 bg-bg-secondary p-6 shadow-2xl shadow-black/40">
          {!composerOpen ? (
            <button onClick={() => setComposerOpen(true)} className="flex w-full items-center gap-4 text-left group">
              <div className="h-12 w-12 overflow-hidden rounded-2xl bg-bg-tertiary border border-white/5 group-hover:scale-105 transition-transform">
                {currentUser.avatar ? <img src={currentUser.avatar} className="h-full w-full object-cover" /> : null}
              </div>
              <span className="flex-1 rounded-2xl border border-white/5 bg-bg-primary px-5 py-3.5 text-gray-500 text-sm group-hover:border-gold/30 transition-all">
                ¿Qué querés compartir hoy?
              </span>
              <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all">
                <Plus className="h-5 w-5" />
              </div>
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value.slice(0, 2000))} 
                placeholder="Escribí tu publicación..." 
                className="min-h-32 w-full rounded-2xl border border-white/5 bg-bg-primary p-5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gold/30 transition-all" 
                maxLength={2000} 
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <CustomSelect
                  label="Módulo"
                  value={module}
                  onChange={setModule}
                  options={[
                    { value: "GENERAL", label: "General" },
                    { value: "ADS", label: "Publicidad" },
                    { value: "SERVICES", label: "Servicios" },
                    { value: "JOBS", label: "Empleos" },
                  ]}
                />

                {module === "JOBS" && (
                  <CustomSelect
                    label="Vacante vinculada"
                    value={jobId}
                    onChange={setJobId}
                    placeholder="Seleccionar vacante"
                    options={[
                      { value: "", label: "Ninguna" },
                      ...(currentUser.jobPosts?.map((job: any) => ({ value: job.id, label: job.title })) || [])
                    ]}
                  />
                )}
                {module === "SERVICES" && (
                  <CustomSelect
                    label="Servicio vinculado"
                    value={serviceId}
                    onChange={setServiceId}
                    placeholder="Seleccionar servicio"
                    options={[
                      { value: "", label: "Ninguno" },
                      ...(currentUser.services?.map((service: any) => ({ value: service.id, label: service.title })) || [])
                    ]}
                  />
                )}
                {module === "ADS" && (
                  <CustomSelect
                    label="Espacio vinculado"
                    value={spaceId}
                    onChange={setSpaceId}
                    placeholder="Seleccionar espacio"
                    options={[
                      { value: "", label: "Ninguno" },
                      ...(currentUser.spaces?.map((space: any) => ({ value: space.id, label: space.title })) || [])
                    ]}
                  />
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-bg-primary py-4 text-xs font-bold uppercase tracking-widest text-gray-500 hover:border-gold/30 hover:text-white transition-all">
                  <ImageIcon className="h-4 w-4 text-gold" /> Fotos
                  <input hidden type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} />
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-bg-primary py-4 text-xs font-bold uppercase tracking-widest text-gray-500 hover:border-gold/30 hover:text-white transition-all">
                  <Clock3 className="h-4 w-4 text-gold" /> Video
                  <input hidden type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files)} />
                </label>
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-bg-primary py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                  <Link2 className="h-4 w-4 text-gold/30" /> Pegar link abajo
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {images.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                      <img src={src} className="h-full w-full object-cover" />
                      <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 rotate-45 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {videoUrl && <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-xs text-gold flex items-center gap-3">
                <div className="h-8 w-8 bg-gold/10 rounded-lg flex items-center justify-center"><Clock3 className="h-4 w-4" /></div>
                Video cargado y listo para publicar
              </div>}

              <div className="space-y-3">
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Pegá un enlace para generar preview" className="w-full rounded-2xl border border-white/5 bg-bg-primary px-5 py-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gold/30 transition-all" />
                {previewLoading && <div className="flex items-center gap-2 text-xs text-gold animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Generando preview...</div>}
                {linkPreview && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-[2rem] border border-white/5 bg-bg-primary shadow-2xl">
                    {linkPreview.image && <img src={linkPreview.image} className="h-48 w-full object-cover" />}
                    <div className="p-5">
                      <div className="font-bold text-white text-lg mb-1">{linkPreview.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{linkPreview.description}</div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <button onClick={() => setComposerOpen(false)} className="text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors">Cancelar</button>
                <Button onClick={publishPost} disabled={publishing || (!content.trim() && !images.length && !videoUrl && !linkUrl)} className="bg-gold text-black hover:bg-gold-light rounded-xl h-12 px-8 font-black uppercase tracking-widest shadow-lg shadow-gold/10">
                  {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publicar
                </Button>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <PostCard 
                  post={post} 
                  currentUser={currentUser} 
                  onDelete={() => confirmDelete(post.id)} 
                  showToast={showToast}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <ConfirmModal
            isOpen={isDeleteModalOpen}
            setIsOpen={setIsDeleteModalOpen}
            title="¿Eliminar publicación?"
            description="Esta acción no se puede deshacer. La publicación desaparecerá permanentemente de la comunidad Mercav."
            confirmText="Eliminar"
            cancelText="Mantener"
            variant="danger"
            onConfirm={() => postToDelete && deletePost(postToDelete)}
          />

          <Toast
            isVisible={toast.visible}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, visible: false }))}
          />

          {loading && (
            <div className="rounded-[2.5rem] border border-white/5 bg-bg-secondary p-16 text-center text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gold/30" />
              Cargando feed...
            </div>
          )}

          {posts.length === 0 && !loading && (
            <div className="rounded-[2.5rem] border border-white/5 bg-bg-secondary p-16 text-center">
              <div className="h-20 w-20 rounded-full bg-gold/5 flex items-center justify-center mx-auto mb-6">
                <Megaphone className="h-10 w-10 text-gold/30" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No hay publicaciones</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">Sé el primero en compartir algo con la comunidad Mercav.</p>

              <Button onClick={() => loadFeed(null, false)} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                <Loader2 className="h-4 w-4 mr-2" /> Actualizar feed
              </Button>
            </div>
          )}

          <div ref={sentinelRef} className="h-10" />
          {loadingMore && <div className="text-center p-4"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gold" /></div>}
        </div>
      </main>

      <aside className="hidden xl:block xl:col-span-3 space-y-6 sticky top-24 self-start">
        <SidebarCard title="Usuarios sugeridos">
          <SuggestionList kind="user" items={suggestedUsers} />
        </SidebarCard>
        <SidebarCard title="Vacantes recomendadas">
          <SuggestionList kind="job" items={recommendedJobs} />
        </SidebarCard>
        <SidebarCard title="Spaces destacados">
          <SuggestionList kind="space" items={featuredSpaces} />
        </SidebarCard>
      </aside>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-bg-secondary p-6 shadow-xl shadow-black/20">
      <div className="mb-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{title}</div>
      {children}
    </div>
  );
}

const COMMUNITY_LINKS = [
  { id: "perfil", href: "/perfil/editar", label: "Mi perfil", icon: Star },
  { id: "anuncios", href: "/anuncios", label: "Publicidad", icon: Megaphone },
  { id: "servicios", href: "/servicios", label: "Servicios", icon: MonitorPlay },
  { id: "empleos", href: "/empleos", label: "Empleos", icon: Briefcase },
  { id: "tools", href: "/herramientas", label: "Mercav Tools", icon: Wrench },
];

function CommunityShortcuts() {
  const [items, setItems] = useState(COMMUNITY_LINKS);

  useEffect(() => {
    const saved = localStorage.getItem("mercav-community-order");
    if (!saved) return;
    try {
      const ids = JSON.parse(saved) as string[];
      const rank = (id: string) => {
        const index = ids.indexOf(id);
        return index === -1 ? ids.length : index;
      };
      setItems([...COMMUNITY_LINKS].sort((a, b) => rank(a.id) - rank(b.id)));
    } catch {
      /* keep the default order */
    }
  }, []);

  return (
    <LiquidArrange
      items={items}
      onReorder={(next) => {
        setItems(next);
        localStorage.setItem("mercav-community-order", JSON.stringify(next.map((item) => item.id)));
      }}
      renderItem={(item) => (
        <Link href={item.href} className="group flex items-center justify-between rounded-2xl p-3 text-gray-400 transition-all hover:bg-white/5 hover:text-white">
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 text-gold/60 group-hover:text-gold" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        </Link>
      )}
    />
  );
}

function SuggestionList({ kind, items }: { kind: string; items: any[] }) {
  const [order, setOrder] = useState(items);
  const signature = items.map((item) => item.id).join("|");

  useEffect(() => {
    setOrder(items);
  }, [signature]);

  if (!items.length) return <div className="text-xs text-gray-600 italic">Sin sugerencias por ahora.</div>;
  return (
    <LiquidArrange
      items={order}
      onReorder={setOrder}
      renderItem={(item) => (
        <div className="group transition-all">
          {kind === "user" && (
            <Link href={`/perfil/${item.username}`} className="flex items-center gap-3">
              <div className="h-11 w-11 overflow-hidden rounded-xl bg-bg-tertiary border border-white/5 group-hover:border-gold/30 transition-all">{item.avatar ? <img src={item.avatar} className="h-full w-full object-cover" /> : null}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm group-hover:text-gold transition-colors truncate flex items-center gap-1.5">
                  {item.name}
                  {item.isVerified && <ShieldCheck className="h-3 w-3 text-blue-400" />}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.badges?.map((b: any) => (
                    <div key={b.id} className="h-3.5 w-3.5 bg-gold/5 rounded-md p-0.5 border border-gold/10">
                      <img src={b.icon} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500 truncate uppercase tracking-tighter mt-1">{item.profile?.headline || item.location || "Usuario Mercav"}</div>
              </div>
            </Link>
          )}
          {kind === "job" && (
            <Link href={`/empleos/${item.id}`} className="block group">
              <div className="font-bold text-white text-sm group-hover:text-gold transition-colors">{item.title}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-tight">{item.company?.name} · {item.city}</div>
            </Link>
          )}
          {kind === "space" && (
            <Link href={`/anuncios/${item.id}`} className="block group">
              <div className="font-bold text-white text-sm group-hover:text-gold transition-colors">{item.title}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-tight">{item.city} · <span className="text-gold">{item.currency} {item.pricePerDay || ""}</span></div>
            </Link>
          )}
        </div>
      )}
    />
  );
}

function PostCard({ post, currentUser, onDelete, showToast }: { post: FeedPost; currentUser: any; onDelete: () => void; showToast: (msg: string, type?: any) => void }) {
  const [expandedText, setExpandedText] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [liked, setLiked] = useState(post.myReactionType === "INTERESA");
  const [useful, setUseful] = useState(post.myReactionType === "UTIL");
  const [reactions, setReactions] = useState<Record<string, number>>(post.reactions || {});
  const [commentCount, setCommentCount] = useState(post._count?.comments || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  if (!post.author) return null;
  
  const saveEdit = async () => {
    if (!editText.trim() || editText === post.content) {
      setIsEditing(false);
      return;
    }
    
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      const data = await res.json();
      if (data.success) {
        post.content = editText; // Update locally
        setIsEditing(false);
        showToast("Publicación actualizada", "success");
      } else {
        showToast(data.error || "Error al actualizar", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const topReactions = useMemo(() => Object.entries(reactions).sort((a, b) => b[1] - a[1]).slice(0, 3), [reactions]);
  const totalReactions = useMemo(() => Object.values(reactions).reduce((sum, value) => sum + value, 0), [reactions]);

  const loadComments = async (take = 3) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?take=${take}`);
      const data = await res.json();
      if (data.success) setComments(data.data);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0) await loadComments();
  };

  const sendComment = async () => {
    if (!commentText.trim()) return;
    
    // Optimistic update
    const newComment = {
      id: "temp-" + Date.now(),
      content: commentText,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      replies: [],
    };
    
    setComments(prev => [newComment, ...prev]);
    setCommentCount((prev: number) => prev + 1);
    setCommentsOpen(true);
    const text = commentText;
    setCommentText("");
    setReplyTo(null);

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId: replyTo }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback on error
        setComments(prev => prev.filter(c => c.id !== newComment.id));
        setCommentCount((prev: number) => prev - 1);
      } else {
        // Replace temp with real one
        setComments(prev => prev.map(c => c.id === newComment.id ? data.data : c));
      }
    } catch {
      setComments(prev => prev.filter(c => c.id !== newComment.id));
      setCommentCount((prev: number) => prev - 1);
    }
  };

  const react = async (type: string) => {
    const isMe = type === "INTERESA";
    const isActive = isMe ? liked : useful;
    
    // Optimistic update
    const current = { ...(reactions || {}) };
    current[type] = (current[type] || 0) + (isActive ? -1 : 1);
    
    if (isMe) {
      setLiked(!liked);
      if (useful) {
        setUseful(false);
        current["UTIL"] = (current["UTIL"] || 1) - 1;
      }
    } else {
      setUseful(!useful);
      if (liked) {
        setLiked(false);
        current["INTERESA"] = (current["INTERESA"] || 1) - 1;
      }
    }
    setReactions(current);

    try {
      await fetch(`/api/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch {
      // Rollback would go here, but keep it simple
    }
  };

  const contentTooLong = post.content && post.content.length > 220;
  const visibleText = expandedText || !contentTooLong ? post.content : `${post.content.slice(0, 220)}...`;

  return (
    <article className="rounded-[2.5rem] border border-white/5 bg-bg-secondary p-6 shadow-2xl shadow-black/20 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/perfil/${post.author.username}`} className="h-14 w-14 overflow-hidden rounded-2xl bg-bg-tertiary border border-white/5">
            {post.author.avatar ? <img src={post.author.avatar} className="h-full w-full object-cover" /> : null}
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/perfil/${post.author.username}`} className="font-bold text-white hover:text-gold transition-colors">{post.author.name}</Link>
              {post.author.isVerified && (
                (post.author.roles?.some((r: any) => r.role === "ADMIN") || post.author.username === "ice") ? (
                  <div className="group/admin relative flex items-center justify-center">
                    <div className="h-4 w-4 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                      <ShieldCheck className="w-full h-full text-gold filter drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]" />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0a0a0a] border border-gold/30 text-gold text-[8px] font-black uppercase tracking-[0.2em] rounded-md opacity-0 group-hover/admin:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[10004] scale-90 group-hover/admin:scale-100 backdrop-blur-xl">
                      Administrador
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gold/30" />
                    </div>
                  </div>
                ) : (
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                )
              )}
              {(post.author.profile?.headline?.toUpperCase().includes("CEO") || post.author.username === "ice") && (
                <div className="group/ceo relative flex items-center justify-center">
                  <div className="h-4 w-4 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                    <Crown className="w-full h-full text-gold filter drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]" />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0a0a0a] border border-gold/30 text-gold text-[8px] font-black uppercase tracking-[0.2em] rounded-md opacity-0 group-hover/ceo:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[10004] scale-90 group-hover/ceo:scale-100 backdrop-blur-xl">
                    CEO
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gold/30" />
                  </div>
                </div>
              )}
              {post.author.badges?.map((badge: any) => (
                <BadgePill key={badge.id} badge={badge} />
              ))}
              {post.author.profile?.headline && <span className="hidden md:block text-[10px] text-gray-500 uppercase tracking-widest font-black">· {post.author.profile.headline}</span>}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.1em] font-mono">@{post.author.username} · {timeAgo(post.createdAt)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.module !== "GENERAL" && (
            <span className="rounded-xl bg-gold/5 border border-gold/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gold">
              {post.module === "ADS" ? "Publicidad" : post.module === "SERVICES" ? "Servicios" : "Empleos"}
            </span>
          )}

          {currentUser && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all outline-none">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="liquid-glass liquid-glass-lens z-[100] min-w-[160px] overflow-hidden rounded-2xl p-1.5 animate-in fade-in zoom-in duration-200">
                  {currentUser?.id === post.authorId && (
                    <DropdownMenu.Item 
                      onClick={() => setIsEditing(true)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 outline-none hover:bg-gold/10 hover:text-gold transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar publicación
                    </DropdownMenu.Item>
                  )}
                  {(currentUser?.id === post.authorId || currentUser?.roles?.some((r: any) => r.role === "ADMIN")) && (
                    <DropdownMenu.Item 
                      onClick={onDelete}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-red-400 outline-none hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar publicación
                    </DropdownMenu.Item>
                  )}
                  {currentUser?.id !== post.authorId && (
                    <DropdownMenu.Item 
                      onClick={() => setReportModalOpen(true)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-yellow-500 outline-none hover:bg-yellow-500/10 transition-colors"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Reportar publicación
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-bg-primary p-4 text-sm text-white outline-none focus:border-gold/30 resize-none min-h-[120px]"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancelar</button>
              <Button onClick={saveEdit} disabled={savingEdit} className="bg-gold text-black hover:bg-gold-light rounded-xl h-9 px-6 text-[10px] font-black uppercase tracking-widest">
                {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar cambios"}
              </Button>
            </div>
          </div>
        ) : (
          post.content && (
            <div className="text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap">
              {visibleText}
              {contentTooLong && (
                <button className="ml-2 text-gold font-bold hover:underline" onClick={() => setExpandedText((v) => !v)}>
                  {expandedText ? "Ver menos" : "Ver más"}
                </button>
              )}
            </div>
          )
        )}

        {post.images?.length > 0 && (
          <div className={`grid gap-3 rounded-[2rem] overflow-hidden ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : post.images.length === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
            {post.images.map((src: string) => <img key={src} src={src} className="h-64 w-full object-cover hover:scale-105 transition-transform duration-700" />)}
          </div>
        )}

        {post.videoUrl && <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-black"><video controls src={post.videoUrl} className="max-h-[480px] w-full" /></div>}

        {post.linkUrl && (
          <a href={post.linkUrl} target="_blank" rel="noreferrer" className="block group overflow-hidden rounded-[2rem] border border-white/5 bg-bg-primary hover:border-gold/30 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6">
              <div className="h-28 w-full md:w-44 overflow-hidden rounded-2xl bg-bg-tertiary">
                {post.linkImage ? <img src={post.linkImage} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="flex h-full w-full items-center justify-center text-gray-700"><Link2 className="h-8 w-8" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-lg line-clamp-1 mb-1">{post.linkTitle || post.linkUrl}</div>
                <div className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.linkDescription}</div>
              </div>
              <ExternalLink className="hidden md:block h-5 w-5 text-gold/30 group-hover:text-gold transition-colors" />
            </div>
          </a>
        )}

        {(post.job || post.space || post.service) && (
          <div className="rounded-[2rem] border border-gold/10 bg-gold/[0.02] p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="h-20 w-20 text-gold" />
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex gap-5 items-center">
                <div className="h-16 w-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                  {post.job && <Briefcase className="h-8 w-8" />}
                  {post.space && <MapPin className="h-8 w-8" />}
                  {post.service && <Zap className="h-8 w-8" />}
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">
                    {post.job?.title || post.space?.title || post.service?.title}
                  </h4>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-black">
                    {post.job ? `${post.job.company?.name} · ${post.job.city}` : 
                     post.space ? `${post.space.city}, ${post.space.country}` : 
                     post.service?.provider?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Precio / Salario</span>
                  <span className="text-gold font-mono font-bold">
                    {post.job ? (post.job.salaryMin ? formatMoney(post.job.salaryMin) : "Confidencial") : 
                     post.space ? formatMoney(post.space.pricePerDay) : 
                     (post.service?.packages?.[0]?.price ? formatMoney(post.service.packages[0].price) : "Consultar")}
                  </span>
                </div>
                <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-xl font-black uppercase text-[10px] tracking-widest px-6 h-11 flex-1 md:flex-none">
                  <Link href={post.job ? `/empleos/${post.job.id}` : post.space ? `/anuncios/${post.space.id}` : `/servicios/${post.service.id}`}>
                    {post.job ? "Postularme" : post.space ? "Ver espacio" : "Contratar"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-6">
          <div className="flex items-center gap-2">
            <button onClick={() => react("INTERESA")} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${liked ? "bg-gold text-black border-gold shadow-lg shadow-gold/20" : "border-white/5 bg-white/5 text-gray-500 hover:text-white"}`}>
              <Star className={`h-4 w-4 ${liked ? "fill-black" : ""}`} /> {(reactions["INTERESA"] || 0) > 0 ? reactions["INTERESA"] : "Me interesa"}
            </button>
            <button onClick={() => react("UTIL")} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${useful ? "bg-gold text-black border-gold shadow-lg shadow-gold/20" : "border-white/5 bg-white/5 text-gray-500 hover:text-white"}`}>
              <Check className={`h-4 w-4 ${useful ? "font-bold" : ""}`} /> {(reactions["UTIL"] || 0) > 0 ? reactions["UTIL"] : "Útil"}
            </button>
            {currentUser && currentUser.id !== post.authorId && (
              <button 
                onClick={() => setReportModalOpen(true)} 
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300"
              >
                <ShieldAlert className="h-4 w-4" /> Reportar
              </button>
            )}
          </div>

          <button onClick={toggleComments} className="ml-auto flex items-center gap-3 text-gray-500 hover:text-gold transition-colors">
            {commentCount >= 2 && (
              <div className="flex -space-x-2">
                 {comments.slice(0, 2).map((c, i) => (
                   <div key={c.id || i} className="h-6 w-6 rounded-full border-2 border-bg-secondary bg-bg-tertiary overflow-hidden flex items-center justify-center">
                     {c.author?.avatar ? (
                       <img src={c.author.avatar} className="h-full w-full object-cover" />
                     ) : (
                       <span className="text-[8px] font-black text-gold">{c.author?.name?.charAt(0) || "?"}</span>
                     )}
                   </div>
                 ))}
                 {commentCount > 2 && (
                   <div className="h-6 w-6 rounded-full border-2 border-bg-secondary bg-gold text-primary-foreground flex items-center justify-center text-[8px] font-black tracking-tighter shadow-sm">
                     +{commentCount - 2}
                   </div>
                 )}
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">{commentCount} comentarios</span>
            {commentsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <AnimatePresence>
          {commentsOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 pt-4 overflow-hidden">
              <div className="flex gap-3">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder="Escribí un comentario..." 
                  className="flex-1 rounded-xl border border-white/5 bg-bg-primary px-5 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-gold/30 transition-all" 
                />
                <Button onClick={sendComment} className="bg-gold text-black hover:bg-gold-light rounded-xl w-12"><Send className="h-4 w-4" /></Button>
              </div>

              {loadingComments ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gold/20" /></div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    if (!comment.author) return null;
                    return (
                      <div key={comment.id} className="group">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 overflow-hidden rounded-xl bg-bg-tertiary border border-white/5">{comment.author.avatar ? <img src={comment.author.avatar} className="h-full w-full object-cover" /> : null}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link href={`/perfil/${comment.author.username}`} className="font-bold text-white text-sm hover:text-gold transition-colors">{comment.author.name}</Link> 
                              <span className="text-[10px] text-gray-600 font-mono">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <div className="text-sm text-gray-400 leading-relaxed">{comment.content}</div>
                            <button onClick={() => setReplyTo(comment.id)} className="mt-2 text-[10px] font-black uppercase tracking-widest text-gold/60 hover:text-gold transition-colors">Responder</button>
                          </div>
                        </div>
                        {replyTo === comment.id && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mt-3 flex gap-2 pl-14">
                            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Responder..." className="flex-1 rounded-xl border border-white/5 bg-bg-primary px-4 py-2 text-sm text-white outline-none" />
                            <Button onClick={sendComment} size="sm" className="bg-gold text-black hover:bg-gold-light rounded-xl">Enviar</Button>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                  {comments.length > 3 && <button onClick={() => loadComments(50)} className="text-xs font-bold text-gold hover:underline w-full text-center py-2">Cargar todos los comentarios</button>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetId={post.id}
          targetType="POST"
        />
      </div>
    </article>
  );
}
// creado por Patodev y Invertilo
