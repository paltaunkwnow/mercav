"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
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
  Video,
  X,
  RefreshCw,
} from "@/components/icons";
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
    <span className="group/badge relative inline-flex items-center justify-center" tabIndex={0} aria-label={badge.name}>
      <span className={`${size === "md" ? "h-6 w-6" : "h-5 w-5"} flex items-center justify-center`}>
        <img src={badge.icon} alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" />
      </span>
      <span role="tooltip" className="mv-menu pointer-events-none absolute bottom-full left-1/2 z-[60] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)] opacity-0 transition-opacity duration-150 group-focus-within/badge:opacity-100 group-hover/badge:opacity-100">
        {badge.name}
      </span>
    </span>
  );
}

function Avatar({ src, name, className }: { src?: string | null; name?: string; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden border border-[var(--mv-hairline)] bg-bg-tertiary ${className}`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span className="font-display text-sm font-semibold text-gold/60" aria-hidden>{(name || "?").charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

const FILTERS: [ModuleFilter, string][] = [
  ["ALL", "Todo"],
  ["JOBS", "Empleos"],
  ["SERVICES", "Servicios"],
  ["ADS", "Publicidad"],
];

const MODULE_LABEL: Record<string, string> = { ADS: "Publicidad", SERVICES: "Servicios", JOBS: "Empleos" };

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

  // Cada carga nueva (cambio de filtro o recarga) invalida las respuestas en vuelo,
  // así un pedido viejo no pisa ni agrega posts del filtro anterior.
  const feedRequestRef = useRef(0);
  const loadFeed = async (cursor?: string | null, append = false) => {
    const requestId = append ? feedRequestRef.current : ++feedRequestRef.current;
    if (!append) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (moduleFilter !== "ALL") params.set("module", moduleFilter);
      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();
      if (requestId !== feedRequestRef.current) return;
      if (data.success) {
        setPosts((prev) => (append ? [...prev, ...data.data.posts] : data.data.posts));
        setNextCursor(data.data.nextCursor);
        setSuggestedUsers(data.data.suggestedUsers || []);
        setRecommendedJobs(data.data.recommendedJobs || []);
        setFeaturedSpaces(data.data.featuredSpaces || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === feedRequestRef.current) {
        if (!append) setLoading(false);
        setLoadingMore(false);
      }
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

  const canPublish = !!(content.trim() || images.length || videoUrl || linkUrl);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[16rem_minmax(0,1fr)_18rem] xl:gap-8">
      <aside className="hidden space-y-4 self-start xl:sticky xl:top-28 xl:block" aria-label="Tu perfil">
        <div className="mv-panel p-5">
          <div className="flex items-center gap-3">
            <Avatar src={currentUser.avatar} name={currentUser.name} className="h-12 w-12 rounded-2xl" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-semibold text-[var(--text-primary)]">
                <span className="truncate">{currentUser.name}</span>
                {currentUser.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-blue-400" aria-label="Verificado" />}
              </p>
              <p className="mv-data truncate text-xs text-[var(--text-secondary)]">@{currentUser.username}</p>
            </div>
          </div>
          {currentUser.badges && currentUser.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentUser.badges.map((b: any) => <BadgePill key={b.id} badge={b} />)}
            </div>
          )}
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Perfil completo</span>
              <span className="mv-data">{currentUser.profileCompleteness || 0}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--mv-panel-hover)]" role="progressbar" aria-valuenow={currentUser.profileCompleteness || 0} aria-valuemin={0} aria-valuemax={100} aria-label="Perfil completo">
              <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${currentUser.profileCompleteness || 0}%` }} />
            </div>
          </div>
        </div>

        <nav className="mv-panel p-2" aria-label="Accesos de la comunidad">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[var(--text-secondary)]">Accesos</p>
          <CommunityShortcuts />
        </nav>
      </aside>

      <div className="min-w-0 space-y-5">
        <div role="group" aria-label="Filtrar publicaciones" className="scrollbar-hide -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map(([value, label]) => {
            const active = moduleFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setModuleFilter(value)}
                className={`mv-focus h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors duration-200 active:scale-[0.97] ${
                  active
                    ? "border-transparent bg-gold text-[var(--mv-on-gold)]"
                    : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <section aria-label="Crear publicación" className="mv-panel p-4 sm:p-5">
          {!composerOpen ? (
            <button type="button" onClick={() => setComposerOpen(true)} className="mv-focus group flex w-full items-center gap-3 rounded-2xl text-left">
              <Avatar src={currentUser.avatar} name={currentUser.name} className="h-11 w-11 rounded-2xl" />
              <span className="flex h-11 flex-1 items-center rounded-full border border-[var(--mv-hairline-strong)] px-4 text-[15px] text-[var(--text-tertiary)] transition-colors duration-200 group-hover:border-[var(--color-border-gold)]">
                ¿Qué querés compartir hoy?
              </span>
              <span className="mv-btn mv-btn-primary h-11 w-11 shrink-0 px-0" aria-hidden>
                <Plus className="h-5 w-5" />
              </span>
            </button>
          ) : (
            <div className="mv-fade space-y-5">
              <div>
                <label htmlFor="composer-content" className="sr-only">Contenido de la publicación</label>
                <textarea
                  id="composer-content"
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                  placeholder="Escribí tu publicación…"
                  className="mv-input h-auto min-h-[8rem] resize-y py-3 text-[15px] leading-relaxed"
                  maxLength={2000}
                />
                <p className="mv-data mt-1.5 text-right text-xs text-[var(--text-tertiary)]">{content.length}/2000</p>
              </div>

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

              <div className="flex flex-wrap gap-2">
                <label className="mv-btn mv-btn-secondary mv-btn-sm cursor-pointer focus-within:shadow-[0_0_0_2px_var(--color-bg-primary),0_0_0_4px_var(--color-gold)]">
                  <ImageIcon className="h-4 w-4 text-gold" aria-hidden /> Fotos
                  <input className="sr-only" type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} />
                </label>
                <label className="mv-btn mv-btn-secondary mv-btn-sm cursor-pointer focus-within:shadow-[0_0_0_2px_var(--color-bg-primary),0_0_0_4px_var(--color-gold)]">
                  <Video className="h-4 w-4 text-gold" aria-hidden /> Video
                  <input className="sr-only" type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files)} />
                </label>
              </div>

              {images.length > 0 && (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {images.map((src, i) => (
                    <li key={i} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--mv-hairline)]">
                      <img src={src} alt={`Imagen ${i + 1} adjunta`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Quitar imagen ${i + 1}`}
                        className="mv-focus absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-[#fff] transition-transform active:scale-95"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {videoUrl && (
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-3 text-sm text-[var(--text-primary)]" role="status">
                  <Video className="h-4 w-4 text-gold" aria-hidden />
                  Video listo para publicar
                </div>
              )}

              <div className="space-y-3">
                <label htmlFor="composer-link" className="block text-sm font-medium text-[var(--text-primary)]">Enlace <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span></label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                  <input id="composer-link" type="url" inputMode="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" className="mv-input pl-10" />
                </div>
                {previewLoading && <p className="flex items-center gap-2 text-xs text-[var(--text-secondary)]" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin text-gold" aria-hidden /> Generando vista previa…</p>}
                {linkPreview && (
                  <div className="mv-fade overflow-hidden rounded-[1.25rem] border border-[var(--mv-hairline)]">
                    {linkPreview.image && <img src={linkPreview.image} alt="" className="aspect-[1.91/1] w-full object-cover" />}
                    <div className="p-4">
                      <p className="line-clamp-1 font-semibold text-[var(--text-primary)]">{linkPreview.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-secondary)]">{linkPreview.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--mv-hairline)] pt-4">
                <button type="button" onClick={() => setComposerOpen(false)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
                <button type="button" onClick={publishPost} disabled={publishing || !canPublish} aria-busy={publishing} className="mv-btn mv-btn-primary mv-btn-sm">
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                  {publishing ? "Publicando…" : "Publicar"}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout="position"
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
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
            <ul className="space-y-4" aria-label="Cargando publicaciones" role="status">
              {[0, 1].map((i) => (
                <li key={i} className="mv-panel animate-pulse p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 rounded-2xl bg-[var(--mv-panel-hover)]" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-1/3 rounded-full bg-[var(--mv-panel-hover)]" />
                      <span className="block h-3 w-1/5 rounded-full bg-[var(--mv-panel-hover)]" />
                    </span>
                  </div>
                  <span className="mt-5 block h-3 w-full rounded-full bg-[var(--mv-panel-hover)]" />
                  <span className="mt-2 block h-3 w-4/5 rounded-full bg-[var(--mv-panel-hover)]" />
                </li>
              ))}
            </ul>
          )}

          {posts.length === 0 && !loading && (
            <div className="mv-panel flex flex-col items-center px-6 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                <Megaphone className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mv-h3 mt-5">Todavía no hay publicaciones</h2>
              <p className="mv-body mt-2 max-w-xs">Compartí algo con la comunidad o probá con otro filtro.</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => setComposerOpen(true)} className="mv-btn mv-btn-primary mv-btn-sm">
                  <Plus className="h-4 w-4" aria-hidden /> Crear publicación
                </button>
                <button type="button" onClick={() => loadFeed(null, false)} className="mv-btn mv-btn-secondary mv-btn-sm">
                  <RefreshCw className="h-4 w-4" aria-hidden /> Actualizar
                </button>
              </div>
            </div>
          )}

          <div ref={sentinelRef} className="h-10" />
          {loadingMore && <div className="flex justify-center p-4" role="status"><Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden /><span className="sr-only">Cargando más</span></div>}
        </div>
      </div>

      <aside className="hidden space-y-4 self-start lg:sticky lg:top-28 lg:block" aria-label="Sugerencias">
        <SidebarCard title="Personas para seguir">
          <SuggestionList kind="user" items={suggestedUsers} />
        </SidebarCard>
        <SidebarCard title="Vacantes recomendadas">
          <SuggestionList kind="job" items={recommendedJobs} />
        </SidebarCard>
        <SidebarCard title="Espacios destacados">
          <SuggestionList kind="space" items={featuredSpaces} />
        </SidebarCard>
      </aside>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mv-panel p-5">
      <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

const COMMUNITY_LINKS = [
  { id: "perfil", href: "/perfil/editar", label: "Mi perfil", icon: Star },
  { id: "anuncios", href: "/anuncios", label: "Publicidad", icon: Megaphone },
  { id: "servicios", href: "/servicios", label: "Servicios", icon: MonitorPlay },
  { id: "empleos", href: "/empleos", label: "Empleos", icon: Briefcase },
  { id: "tools", href: "/herramientas", label: "Mercav Herramientas", icon: Wrench },
];

function CommunityShortcuts() {
  const [items, setItems] = useState(COMMUNITY_LINKS);

  useEffect(() => {
    try {
      // getItem puede tirar con el almacenamiento bloqueado (Safari privado, iframes).
      const saved = localStorage.getItem("mercav-community-order");
      if (!saved) return;
      const ids = JSON.parse(saved);
      if (!Array.isArray(ids)) return;
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
        try {
          localStorage.setItem("mercav-community-order", JSON.stringify(next.map((item) => item.id)));
        } catch {
          /* sin almacenamiento el orden vale solo para esta visita */
        }
      }}
      renderItem={(item) => (
        <Link href={item.href} className="mv-focus group flex items-center justify-between rounded-xl px-3 py-2.5 text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
          <span className="flex items-center gap-3">
            <item.icon className="h-4 w-4 text-gold" aria-hidden />
            <span className="text-sm font-medium">{item.label}</span>
          </span>
          <ArrowRight className="h-4 w-4 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
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

  if (!items.length) return <p className="text-sm text-[var(--text-tertiary)]">Sin sugerencias por ahora.</p>;
  return (
    <LiquidArrange
      items={order}
      onReorder={setOrder}
      renderItem={(item) => (
        <div>
          {kind === "user" && (
            <Link href={`/perfil/${item.username}`} className="mv-focus group flex items-center gap-3 rounded-xl">
              <Avatar src={item.avatar} name={item.name} className="h-10 w-10 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-gold">
                  <span className="truncate">{item.name}</span>
                  {item.isVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" aria-label="Verificado" />}
                </span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{item.profile?.headline || item.location || "Usuario de Mercav"}</span>
              </span>
            </Link>
          )}
          {kind === "job" && (
            <Link href={`/empleos/${item.id}`} className="mv-focus group block rounded-lg">
              <span className="block text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-gold">{item.title}</span>
              <span className="block truncate text-xs text-[var(--text-secondary)]">{[item.company?.name, item.city].filter(Boolean).join(" · ")}</span>
            </Link>
          )}
          {kind === "space" && (
            <Link href={`/anuncios/${item.id}`} className="mv-focus group block rounded-lg">
              <span className="block text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-gold">{item.title}</span>
              <span className="block truncate text-xs text-[var(--text-secondary)]">
                {item.city}
                {item.pricePerDay ? <> · <span className="mv-data text-gold">{item.currency} {item.pricePerDay}</span></> : null}
              </span>
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

  if (!post.author) return null;

  const contentTooLong = post.content && post.content.length > 220;
  const visibleText = expandedText || !contentTooLong ? post.content : `${post.content.slice(0, 220)}...`;

  const isAdminAuthor = post.author.roles?.some((r: any) => r.role === "ADMIN") || post.author.username === "ice";
  const isCeoAuthor = post.author.profile?.headline?.toUpperCase().includes("CEO") || post.author.username === "ice";
  const listing = post.job || post.space || post.service;
  const listingHref = post.job ? `/empleos/${post.job.id}` : post.space ? `/anuncios/${post.space.id}` : post.service ? `/servicios/${post.service.id}` : "#";
  const actionClass = (active: boolean) =>
    `mv-focus inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.96] ${
      active
        ? "border-transparent bg-gold text-[var(--mv-on-gold)]"
        : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <article className="mv-panel p-4 sm:p-6" aria-labelledby={`post-${post.id}-author`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/perfil/${post.author.username}`} className="mv-focus shrink-0 rounded-2xl" tabIndex={-1} aria-hidden>
            <Avatar src={post.author.avatar} name={post.author.name} className="h-11 w-11 rounded-2xl" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link id={`post-${post.id}-author`} href={`/perfil/${post.author.username}`} className="mv-focus truncate rounded font-semibold text-[var(--text-primary)] transition-colors hover:text-gold">{post.author.name}</Link>
              {post.author.isVerified && (
                <span title={isAdminAuthor ? "Administrador" : "Verificado"} className="inline-flex">
                  <ShieldCheck className={`h-4 w-4 ${isAdminAuthor ? "text-gold" : "text-blue-400"}`} aria-label={isAdminAuthor ? "Administrador" : "Verificado"} />
                </span>
              )}
              {isCeoAuthor && (
                <span title="CEO" className="inline-flex">
                  <Crown className="h-4 w-4 text-gold" aria-label="CEO" />
                </span>
              )}
              {post.author.badges?.map((badge: any) => (
                <BadgePill key={badge.id} badge={badge} />
              ))}
            </div>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span className="mv-data truncate">@{post.author.username}</span>
              <span aria-hidden>·</span>
              <time dateTime={new Date(post.createdAt).toISOString()} className="mv-data shrink-0">{timeAgo(post.createdAt)}</time>
              {post.author.profile?.headline && <span className="hidden truncate md:inline">· {post.author.profile.headline}</span>}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {post.module !== "GENERAL" && MODULE_LABEL[post.module] && (
            <span className="mv-chip mv-chip-gold hidden sm:inline-flex">{MODULE_LABEL[post.module]}</span>
          )}

          {currentUser && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" aria-label="Opciones de la publicación" className="mv-focus grid h-10 w-10 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]">
                  <MoreHorizontal className="h-5 w-5" aria-hidden />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={6} className="mv-pop mv-menu z-[100] min-w-[12rem] overflow-hidden rounded-2xl p-1.5">
                  {currentUser?.id === post.authorId && (
                    <DropdownMenu.Item 
                      onClick={() => setIsEditing(true)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors data-[highlighted]:bg-[var(--mv-panel-hover)]"
                    >
                      <Pencil className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden />
                      Editar
                    </DropdownMenu.Item>
                  )}
                  {(currentUser?.id === post.authorId || currentUser?.roles?.some((r: any) => r.role === "ADMIN")) && (
                    <DropdownMenu.Item 
                      onClick={onDelete}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 outline-none transition-colors data-[highlighted]:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Eliminar
                    </DropdownMenu.Item>
                  )}
                  {currentUser?.id !== post.authorId && (
                    <DropdownMenu.Item 
                      onClick={() => setReportModalOpen(true)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors data-[highlighted]:bg-[var(--mv-panel-hover)]"
                    >
                      <ShieldAlert className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden />
                      Reportar
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </header>

      <div className="mt-4 space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <label htmlFor={`edit-${post.id}`} className="sr-only">Editar publicación</label>
            <textarea
              id={`edit-${post.id}`}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="mv-input h-auto min-h-[7.5rem] resize-y py-3 text-[15px] leading-relaxed"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditing(false)} className="mv-btn mv-btn-ghost mv-btn-sm">Cancelar</button>
              <button type="button" onClick={saveEdit} disabled={savingEdit} aria-busy={savingEdit} className="mv-btn mv-btn-primary mv-btn-sm">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {savingEdit ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[var(--text-primary)]">
              {visibleText}
              {contentTooLong && (
                <button type="button" className="mv-link ml-1.5 text-sm" aria-expanded={expandedText} onClick={() => setExpandedText((v) => !v)}>
                  {expandedText ? "Ver menos" : "Ver más"}
                </button>
              )}
            </div>
          )
        )}

        {post.images?.length > 0 && (
          <div className={`grid gap-1.5 overflow-hidden rounded-[1.25rem] ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.map((src: string, idx: number) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className={`w-full bg-bg-tertiary object-cover ${post.images.length === 1 ? "aspect-[16/10] max-h-[32rem]" : post.images.length === 3 && idx === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}
              />
            ))}
          </div>
        )}

        {post.videoUrl && (
          <div className="overflow-hidden rounded-[1.25rem] border border-[var(--mv-hairline)] bg-black">
            <video controls preload="metadata" src={post.videoUrl} className="aspect-video max-h-[30rem] w-full" />
          </div>
        )}

        {post.linkUrl && (
          <a href={post.linkUrl} target="_blank" rel="noreferrer" className="mv-focus group flex overflow-hidden rounded-[1.25rem] border border-[var(--mv-hairline)] transition-colors duration-200 hover:border-[var(--color-border-gold)]">
            <span className="hidden w-36 shrink-0 bg-bg-tertiary sm:block">
              {post.linkImage ? (
                <img src={post.linkImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[var(--text-tertiary)]"><Link2 className="h-6 w-6" aria-hidden /></span>
              )}
            </span>
            <span className="min-w-0 flex-1 p-4">
              <span className="line-clamp-1 font-semibold text-[var(--text-primary)]">{post.linkTitle || post.linkUrl}</span>
              {post.linkDescription && <span className="mt-0.5 line-clamp-2 text-sm text-[var(--text-secondary)]">{post.linkDescription}</span>}
              <span className="mv-data mt-2 flex items-center gap-1.5 truncate text-xs text-[var(--text-tertiary)]">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{post.linkUrl.replace(/^https?:\/\//, "")}</span>
              </span>
            </span>
          </a>
        )}

        {listing && (
          <div className="flex flex-col gap-4 rounded-[1.25rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mv-panel)] text-gold">
                {post.job && <Briefcase className="h-5 w-5" aria-hidden />}
                {post.space && <MapPin className="h-5 w-5" aria-hidden />}
                {post.service && <Zap className="h-5 w-5" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--text-primary)]">{post.job?.title || post.space?.title || post.service?.title}</p>
                <p className="truncate text-sm text-[var(--text-secondary)]">
                  {post.job ? [post.job.company?.name, post.job.city].filter(Boolean).join(" · ") : 
                   post.space ? [post.space.city, post.space.country].filter(Boolean).join(", ") : 
                   post.service?.provider?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-xs text-[var(--text-secondary)]">{post.job ? "Salario" : post.space ? "Por día" : "Desde"}</p>
                <p className="mv-data font-medium text-gold">
                  {post.job ? (post.job.salaryMin ? formatMoney(post.job.salaryMin) : "Confidencial") : 
                   post.space ? formatMoney(post.space.pricePerDay) : 
                   (post.service?.packages?.[0]?.price ? formatMoney(post.service.packages[0].price) : "Consultar")}
                </p>
              </div>
              <Link href={listingHref} className="mv-btn mv-btn-primary mv-btn-sm shrink-0">
                {post.job ? "Postularme" : post.space ? "Ver espacio" : "Contratar"}
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--mv-hairline)] pt-4">
          <button type="button" onClick={() => react("INTERESA")} aria-pressed={liked} className={actionClass(liked)}>
            <Star className={`h-4 w-4 ${liked ? "fill-current" : ""}`} aria-hidden />
            <span>Me interesa</span>
            {(reactions["INTERESA"] || 0) > 0 && <span className="mv-data">{reactions["INTERESA"]}</span>}
          </button>
          <button type="button" onClick={() => react("UTIL")} aria-pressed={useful} className={actionClass(useful)}>
            <Check className="h-4 w-4" aria-hidden />
            <span>Útil</span>
            {(reactions["UTIL"] || 0) > 0 && <span className="mv-data">{reactions["UTIL"]}</span>}
          </button>

          <button type="button" onClick={toggleComments} aria-expanded={commentsOpen} className={`${actionClass(false)} ml-auto`}>
            {commentCount >= 2 && (
              <span className="flex -space-x-2" aria-hidden>
                {comments.slice(0, 2).map((c, i) => (
                  <Avatar key={c.id || i} src={c.author?.avatar} name={c.author?.name} className="h-6 w-6 rounded-full border-2 border-bg-secondary" />
                ))}
              </span>
            )}
            <MessageSquare className="h-4 w-4" aria-hidden />
            <span className="mv-data">{commentCount}</span>
            <span className="hidden sm:inline">{commentCount === 1 ? "comentario" : "comentarios"}</span>
            <span className="sr-only sm:hidden">comentarios</span>
            {commentsOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {commentsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-5 pt-1">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendComment(); }}
                  className="flex items-center gap-2"
                >
                  <Avatar src={currentUser?.avatar} name={currentUser?.name} className="hidden h-10 w-10 rounded-xl sm:grid" />
                  <label htmlFor={`comment-${post.id}`} className="sr-only">Escribí un comentario</label>
                  <input 
                    id={`comment-${post.id}`}
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="Escribí un comentario…" 
                    className="mv-input h-11 flex-1 rounded-full text-[15px]"
                  />
                  <button type="submit" aria-label="Enviar comentario" disabled={!commentText.trim()} className="mv-btn mv-btn-primary h-11 w-11 shrink-0 px-0">
                    <Send className="h-4 w-4" aria-hidden />
                  </button>
                </form>

                {loadingComments ? (
                  <div className="flex justify-center p-6" role="status"><Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden /><span className="sr-only">Cargando comentarios</span></div>
                ) : (
                  <ul className="space-y-4">
                    {comments.map((comment) => {
                      if (!comment.author) return null;
                      return (
                        <li key={comment.id}>
                          <div className="flex items-start gap-3">
                            <Avatar src={comment.author.avatar} name={comment.author.name} className="h-9 w-9 rounded-xl" />
                            <div className="min-w-0 flex-1">
                              <div className="rounded-2xl rounded-tl-md bg-[var(--mv-panel-hover)] px-3.5 py-2.5">
                                <div className="flex items-baseline gap-2">
                                  <Link href={`/perfil/${comment.author.username}`} className="mv-focus rounded text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-gold">{comment.author.name}</Link>
                                  <span className="mv-data text-[11px] text-[var(--text-tertiary)]">{timeAgo(comment.createdAt)}</span>
                                </div>
                                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-secondary)]">{comment.content}</p>
                              </div>
                              <button type="button" onClick={() => setReplyTo(comment.id)} className="mv-focus ml-2 mt-1 rounded text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-gold">Responder</button>
                            </div>
                          </div>
                          {replyTo === comment.id && (
                            <form onSubmit={(e) => { e.preventDefault(); sendComment(); }} className="mv-fade mt-2 flex gap-2 pl-12">
                              <label htmlFor={`reply-${comment.id}`} className="sr-only">Responder a {comment.author.name}</label>
                              <input id={`reply-${comment.id}`} autoFocus value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Responder…" className="mv-input h-10 flex-1 rounded-full text-sm" />
                              <button type="submit" className="mv-btn mv-btn-primary mv-btn-sm">Enviar</button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {comments.length > 3 && <button type="button" onClick={() => loadComments(50)} className="mv-link w-full py-1 text-center text-sm">Ver todos los comentarios</button>}
              </div>
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
// creado por pato dev y askforvini
