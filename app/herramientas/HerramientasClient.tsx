"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calculator,
  BarChart3,
  FileText,
  Globe,
  Layers,
  Lock,
  Palette,
  Sparkles,
  Zap,
  Copy,
  Download,
  Search,
  Loader2,
  Shield,
  ArrowRight,
  Unlock,
  RefreshCw,
  Eye,
  Droplets,
  Sun,
  Moon,
  Type,
  Check,
  Contrast,
  FileDown,
  X,
  Megaphone,
  Info,
  Image as ImageIcon,
  CalendarDays,
} from "@/components/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CATALOG_PATH, documentTitleFor, routeByToolId, toolIdFromPathname, toolPath } from "./toolRoutes";
import { ToolHistory, type SavedRun } from "./ToolHistory";
import { downloadBrandedPdf, safeFileName, type PdfBlock } from "./pdf";
import { PROMPT_LOCALES, PROMPT_TEMPLATES, PROMPT_TONES, templateById, type PromptVariant } from "./promptTemplates";
import { TOOL_REQUIREMENTS, toolPlanLabel } from "@/lib/toolPlanCatalog";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Toast } from "@/components/ui/toast";
import { ButtonLink, Container, PageHero, Section, SectionHeading, buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    id: "roi-calculator",
    title: "Calculadora de ROI",
    area: "Marketing",
    desc: "Proyectá cuánto puede devolverte una campaña antes de invertir en ella.",
    benefit: "Ves ingresos, ganancia neta y punto de equilibrio, y lo bajás en PDF.",
    icon: Calculator,
    plan: toolPlanLabel("roi-calculator"),
  },
  {
    id: "contract-generator",
    title: "Generador de contratos",
    area: "Legal",
    desc: "Armá un contrato de servicios entre freelancer y cliente con tus datos y tu país.",
    benefit: "Lo copiás o lo descargás en PDF, listo para revisar y firmar.",
    icon: FileText,
    plan: toolPlanLabel("contract-generator"),
  },
  {
    id: "seo-analyzer",
    title: "Analizador SEO",
    area: "Sitio web",
    desc: "Revisá título, descripción, contenido, imágenes y enlaces de cualquier página.",
    benefit: "Recibís una lista de mejoras marcadas por gravedad y un reporte PDF.",
    icon: Globe,
    plan: toolPlanLabel("seo-analyzer"),
  },
  {
    id: "price-simulator",
    title: "Simulador de precios",
    area: "Precios",
    desc: "Calculá cuánto cobrar por hora y por proyecto según rubro, región y experiencia.",
    benefit: "Obtenés un rango mínimo, promedio y premium para negociar con criterio.",
    icon: BarChart3,
    plan: toolPlanLabel("price-simulator"),
  },
  {
    id: "palette-generator",
    title: "Generador de paletas",
    area: "Marca",
    desc: "Creá una paleta de cinco colores desde un color base o desde una imagen.",
    benefit: "Revisás el contraste y la exportás a CSS, Tailwind, SCSS, JSON o PDF.",
    icon: Palette,
    plan: toolPlanLabel("palette-generator"),
  },
  {
    id: "prompt-generator",
    title: "Generador de prompts",
    area: "IA",
    desc: "Instrucciones listas para cualquier asistente de IA: descripciones de producto, anuncios, respuestas a clientes y más.",
    benefit: "Recibís tres variantes para copiar y pegar en el asistente que uses.",
    icon: Sparkles,
    plan: toolPlanLabel("prompt-generator"),
  },
  {
    id: "holiday-calendar",
    title: "Calendario de feriados",
    area: "Calendario",
    desc: "Feriados nacionales de toda Latinoamérica, los de tu región donde hay datos (como en Bolivia o Brasil) y fechas del calendario hebreo. Elegís qué ver y ocultás lo que no te sirve.",
    benefit: "Descargalo en .ics y sumalo a tu calendario de siempre.",
    icon: CalendarDays,
    plan: toolPlanLabel("holiday-calendar"),
  },
];

type ToolId = typeof TOOLS[number]["id"];

const PLAN_NAMES: Record<string, string> = { FREE: "Free", PROFESSIONAL: "Professional", EMPRESA: "Empresa", ELITE: "Elite" };

/** Short, human label for the cheapest plan that unlocks a tool. Derived from TOOL_REQUIREMENTS. */
function planChipLabel(toolId: string) {
  const plans = TOOL_REQUIREMENTS[toolId] || [];
  if (plans.includes("FREE")) return "Incluida en Free";
  if (plans.length === 1) return `Solo ${PLAN_NAMES[plans[0]] ?? plans[0]}`;
  return `Desde ${PLAN_NAMES[plans[0]] ?? plans[0]}`;
}

/* Shared form styling for every tool (presentation only) */
const FIELD_LABEL = "mb-1.5 block text-sm font-semibold text-[var(--text-primary)]";
const FIELD_HINT = "-mt-0.5 mb-2 block text-xs leading-snug text-[var(--text-secondary)]";
const SUBHEAD = "flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]";
const TILE = "rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)]";
const TILE_LABEL = "text-xs font-medium text-[var(--text-secondary)]";

export default function HerramientasClient() {
  const router = useRouter();
  const pathname = usePathname();
  // The open panel lives in the URL (/herramientas/<slug>), so links can be shared and Back closes it.
  const activeTool = toolIdFromPathname(pathname) as ToolId | null;
  const [userPlan, setUserPlan] = useState<string | null>(null);
  // The dialog portals to document.body: render it only after hydration.
  const [mounted, setMounted] = useState(false);
  // True when the panel was opened from this catalog, so closing can simply step back in history.
  const openedHere = useRef(false);

  useEffect(() => setMounted(true), []);

  // Shallow URL changes do not re-run generateMetadata; keep the tab title in sync by hand.
  useEffect(() => {
    document.title = documentTitleFor(routeByToolId(activeTool));
    if (!activeTool) openedHere.current = false;
  }, [activeTool]);

  // El plan solo existe con sesión: sin ella, /api/profile responde 401 y ensucia la consola.
  const { status: sessionStatus } = useSession();
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) setUserPlan(json.data?.plan || null);
      })
      .catch(() => {});
  }, [sessionStatus]);

  const selectedTool = useMemo(() => TOOLS.find((tool) => tool.id === activeTool) || null, [activeTool]);
  const workTools = TOOLS.filter((tool) => tool.id !== "holiday-calendar");
  const calendar = TOOLS.find((tool) => tool.id === "holiday-calendar")!;
  const availableCount = userPlan ? TOOLS.filter((tool) => matchesPlan(tool.id as ToolId, userPlan)).length : null;

  const open = (id: ToolId) => {
    if (id === "holiday-calendar") {
      router.push("/calendario");
      return;
    }
    // history.pushState is synced with the App Router (usePathname updates) without remounting the
    // catalog, so the exit animation and the focus return to the card keep working.
    openedHere.current = true;
    window.history.pushState(null, "", toolPath(id));
  };

  const close = useCallback(() => {
    if (openedHere.current) {
      openedHere.current = false;
      window.history.back();
    } else {
      window.history.pushState(null, "", CATALOG_PATH);
    }
  }, []);

  return (
    <div className="relative w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Tools"
        title={
          <>
            Herramientas para el trabajo <span className="mv-gold-text">de todos los días.</span>
          </>
        }
        lead="Proyectá una campaña, armá un contrato, revisá tu sitio, poné precio a tu trabajo y cobrá en tu local. Todo se abre acá mismo, sin instalar nada."
        actions={
          <>
            <a href="#catalogo" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
              Elegir una herramienta
            </a>
            <ButtonLink href="/calendario" tone="secondary" size="lg" className="w-full sm:w-auto">
              Abrir el calendario
            </ButtonLink>
          </>
        }
        aside={
          <div className="liquid-glass rounded-[1.75rem] p-6 md:p-7">
            {userPlan ? (
              <>
                <p className="text-sm text-[var(--text-secondary)]">Tu plan</p>
                <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{PLAN_NAMES[userPlan] ?? userPlan}</p>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  <span className="mv-data font-semibold text-[var(--text-primary)]">
                    {availableCount} de {TOOLS.length}
                  </span>{" "}
                  herramientas disponibles con tu cuenta.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Qué incluye cada plan</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  La calculadora de ROI, las paletas y el calendario de feriados están en el plan Free. Cada tarjeta indica qué plan necesitás.
                </p>
              </>
            )}
            <Link href="/precios" className="mv-link mt-5 inline-flex items-center gap-1.5 text-sm">
              Comparar planes <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        }
      />

      <Section tight labelledBy="tools-catalog" className="!pt-6 md:!pt-10">
        <Container>
          <div id="catalogo" className="scroll-mt-28">
            <SectionHeading
              id="tools-catalog"
              kicker="Catálogo"
              title="Elegí qué querés resolver."
              lead="Cada herramienta se abre en un panel con su propio enlace: completás los datos, ves el resultado, lo guardás en tu historial o lo descargás en PDF."
            />
          </div>

          <ul className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
            {workTools.map((tool) => (
              <li key={tool.id} className="flex">
                <ToolCard tool={tool} userPlan={userPlan} onOpen={() => open(tool.id as ToolId)} />
              </li>
            ))}
          </ul>

          <div className="liquid-glass mt-4 rounded-[1.25rem] p-6 md:mt-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex items-start gap-4 md:gap-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="mv-h3">{calendar.title}</h3>
                    <span className="mv-chip mv-chip-gold">{planChipLabel(calendar.id)}</span>
                  </div>
                  <p className="mv-body mt-2 max-w-2xl">{calendar.desc}</p>
                  <p className="mt-3 flex items-start gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    {calendar.benefit}
                  </p>
                </div>
              </div>
              <ButtonLink href="/calendario" tone="primary" className="w-full md:w-auto">
                Abrir el calendario <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <AnimatePresence>
        {mounted && selectedTool && <ToolModal key={selectedTool.id} tool={selectedTool} onClose={close} userPlan={userPlan} />}
      </AnimatePresence>
    </div>
  );
}

function ToolCard({ tool, userPlan, onOpen }: { tool: (typeof TOOLS)[number]; userPlan: string | null; onOpen: () => void }) {
  const Icon = tool.icon;
  const known = Boolean(userPlan);
  const allowed = !userPlan || matchesPlan(tool.id as ToolId, userPlan);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="mv-panel mv-panel-interactive mv-focus group flex w-full flex-col p-6 text-left md:p-7"
    >
      <span className="flex w-full items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold transition-colors duration-200 group-hover:border-[var(--color-border-gold)] group-hover:bg-[var(--mv-gold-wash)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-xs font-medium text-[var(--text-tertiary)]">{tool.area}</span>
      </span>
      <span className="mt-5 block font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">{tool.title}</span>
      <span className="mv-body mt-2 block">{tool.desc}</span>
      <span className="mt-4 flex items-start gap-2 text-sm font-medium text-[var(--text-primary)]">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        {tool.benefit}
      </span>
      <span className="block min-h-6 flex-1" aria-hidden />
      <span className="flex w-full items-center justify-between gap-3 border-t border-[var(--mv-hairline)] pt-5">
        <span className={cn("mv-chip", (known ? allowed : (TOOL_REQUIREMENTS[tool.id] || []).includes("FREE")) && "mv-chip-gold")}>
          {!allowed ? <Lock className="h-3 w-3" aria-hidden /> : null}
          {known && !allowed ? `Requiere ${planChipLabel(tool.id).replace(/^(Desde|Solo) /, "")}` : planChipLabel(tool.id)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-[var(--text-primary)]">
          Abrir
          <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}

function matchesPlan(toolId: ToolId, plan: string) {
  const access: Record<ToolId, string[]> = {
    "roi-calculator": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
    "contract-generator": ["EMPRESA", "ELITE"],
    "seo-analyzer": ["PROFESSIONAL", "EMPRESA", "ELITE"],
    "price-simulator": ["PROFESSIONAL", "EMPRESA", "ELITE"],
    "palette-generator": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
    "prompt-generator": ["ELITE"],
    "holiday-calendar": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
  };
  return access[toolId]?.includes(plan);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ToolModal({ tool, onClose, userPlan }: { tool: (typeof TOOLS)[number]; onClose: () => void; userPlan: string | null }) {
  const allowed = !userPlan || matchesPlan(tool.id as ToolId, userPlan);
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const Icon = tool.icon;

  useEffect(() => {
    // Lock background scroll when tool is active
    const originalHtmlStyle = document.documentElement.style.overflow;
    const originalBodyStyle = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = originalHtmlStyle;
      document.body.style.overflow = originalBodyStyle;
    };
  }, []);

  // Move focus into the dialog and give it back to the card that opened it.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  // Portal to <body>: the dialog carries its own material and must never sit inside another glass surface.
  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-end justify-center md:items-center md:p-6 lg:p-10" onKeyDown={onKeyDown}>
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/50"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.18 } }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className="mv-menu relative flex h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top,0px)))] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.75rem] outline-none md:h-auto md:max-h-[min(92dvh,64rem)] md:rounded-[2rem]"
      >
        {/* Chrome stays put; only the body scrolls */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--mv-hairline)] px-4 py-3 md:gap-4 md:px-8 md:py-4">
          <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-[var(--mv-hairline-strong)] md:hidden" />
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold sm:grid">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Herramienta Mercav · {tool.area}</p>
              <h2 id={titleId} className="truncate font-display text-lg font-semibold tracking-tight text-[var(--text-primary)] md:text-xl">
                {tool.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Cerrar ${tool.title}`}
              className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] transition-[color,background-color,transform] duration-200 hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)] active:scale-[0.97]"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-5 md:px-8 md:pb-8 md:pt-6">
            <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between">
              <p id={descId} className="mv-body max-w-3xl">
                {tool.desc}
              </p>
              <span className={cn("mv-chip shrink-0 self-start", allowed && "mv-chip-gold")}>{planChipLabel(tool.id)}</span>
            </div>
            {allowed ? <ToolBody toolId={tool.id as ToolId} /> : <LockedTool tool={tool} />}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function LockedTool({ tool }: { tool: (typeof TOOLS)[number] }) {
  return (
    <div className="mv-panel flex flex-col items-center px-6 py-12 text-center md:py-16">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-gold">
        <Lock className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mv-h3 mt-5">Tu plan todavía no incluye esta herramienta</h3>
      <p className="mv-body mx-auto mt-2 max-w-md">
        Para usar <span className="font-semibold text-[var(--text-primary)]">{tool.title}</span> necesitás uno de estos planes:
      </p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {tool.plan.split("/").map((p) => (
          <li key={p} className="mv-chip">
            {PLAN_NAMES[p.trim()] ?? p.trim()}
          </li>
        ))}
      </ul>
      <ButtonLink href="/precios" tone="primary" className="mt-8 w-full sm:w-auto">
        Ver planes
      </ButtonLink>
    </div>
  );
}

function ToolBody({ toolId }: { toolId: ToolId }) {
  if (toolId === "roi-calculator") return <ROIForm />;
  if (toolId === "contract-generator") return <ContractGenerator />;
  if (toolId === "seo-analyzer") return <SEOAnalyzer />;
  if (toolId === "price-simulator") return <PriceSimulator />;
  if (toolId === "palette-generator") return <PaletteGenerator />;
  return <PromptGenerator />;
}

/** Date + tool label used in history titles, e.g. "ROI · 1 oct 2026". */
function shortDate() {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
}

type AdSpace = { id: string; title: string; city?: string | null; pricePerMonth: number; currency: string };

function formatMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
  } catch {
    return `${Math.round(value || 0)} ${currency}`;
  }
}

function ROIForm() {
  const [form, setForm] = useState({ price: 0, audience: 0, conversion: 0, ticket: 0, days: 1 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  // Real Ads spaces (GET /api/spaces) to prefill the cost; "" = manual entry.
  const [spaces, setSpaces] = useState<AdSpace[] | null>(null);
  const [spaceId, setSpaceId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const selectedSpace = spaces?.find((space) => space.id === spaceId) ?? null;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spaces")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const list: AdSpace[] = (json?.success && Array.isArray(json.data) ? json.data : [])
          .map((space: any) => ({ id: space.id, title: space.title, city: space.city, pricePerMonth: Number(space.pricePerMonth), currency: space.currency || "USD" }))
          .filter((space: AdSpace) => Number.isFinite(space.pricePerMonth) && space.pricePerMonth > 0);
        setSpaces(list);
      })
      .catch(() => !cancelled && setSpaces([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const pickSpace = (id: string) => {
    setSpaceId(id);
    const space = spaces?.find((item) => item.id === id);
    if (!space) {
      setCurrency("USD");
      return;
    }
    // A month of the space, expressed as the daily budget the calculator expects.
    setCurrency(space.currency);
    setForm((prev) => ({ ...prev, days: 30, price: Math.round((space.pricePerMonth / 30) * 100) / 100 }));
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/roi-calculator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error || "No pudimos calcular el retorno.");
    } catch {
      setError("No pudimos calcular el retorno. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRoiPDF = async () => {
    if (!result) return;
    setToast({ visible: true, message: "Generando el PDF…", type: "info" });
    const money = (value: number) => formatMoney(value, currency);
    const blocks: PdfBlock[] = [
      {
        type: "highlight",
        label: "Retorno sobre la inversión (ROI)",
        value: result.roi === null || result.roi === undefined ? "Sin inversión" : `${result.roi >= 0 ? "+" : ""}${Number(result.roi).toFixed(2)}%`,
        note: result.roi >= 0 ? "Con estos supuestos, la campaña recupera lo invertido." : "Con estos supuestos, la campaña no llega a cubrir lo invertido.",
      },
      { type: "heading", text: "Resultado" },
      {
        type: "rows",
        rows: [
          ["Inversión total", money(result.investment)],
          ["Ingresos estimados", money(result.revenue)],
          ["Ganancia neta", money(result.revenue - result.investment)],
          ["Ventas estimadas", `${result.potentialClients} clientes`],
          ["Punto de equilibrio", result.breakEvenClients === null ? "-" : `${result.breakEvenClients} ventas`],
        ],
      },
      { type: "heading", text: "Datos que ingresaste" },
      {
        type: "rows",
        rows: [
          ...(selectedSpace ? ([["Espacio publicitario", `${selectedSpace.title}${selectedSpace.city ? ` · ${selectedSpace.city}` : ""} (${money(selectedSpace.pricePerMonth)} por mes)`]] as Array<[string, string]>) : []),
          ["Presupuesto diario", money(form.price)],
          ["Duración", `${form.days} días`],
          ["Alcance diario", `${form.audience} personas`],
          ["Tasa de conversión", `${form.conversion}%`],
          ["Ticket promedio", money(form.ticket)],
        ],
      },
      { type: "notice", text: "Es una proyección matemática con los supuestos que ingresaste, no una garantía de resultados." },
    ];
    try {
      await downloadBrandedPdf({
        toolName: "Calculadora de ROI",
        title: "Proyección de retorno de una campaña",
        subtitle: selectedSpace ? `Espacio: ${selectedSpace.title}` : undefined,
        blocks,
        fileName: `mercav-roi-${new Date().toISOString().slice(0, 10)}`,
      });
      setToast({ visible: true, message: "PDF descargado.", type: "success" });
    } catch {
      setToast({ visible: true, message: "No pudimos generar el PDF.", type: "error" });
    }
  };

  const spaceOptions = [
    { value: "", label: "Ingresar el costo a mano" },
    ...(spaces ?? []).map((space) => ({
      value: space.id,
      label: `${space.title}${space.city ? ` · ${space.city}` : ""} — ${formatMoney(space.pricePerMonth, space.currency)}/mes`,
    })),
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <ToolPanel title="Datos de la campaña">
        <div className="space-y-5">
          <div>
            <span className={FIELD_LABEL}>Espacio de Mercav Ads</span>
            <span className={FIELD_HINT}>Elegí un espacio publicado para usar su costo mensual, o cargá el tuyo.</span>
            {spaces === null ? (
              <p className="flex min-h-12 items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Buscando espacios…
              </p>
            ) : spaces.length === 0 ? (
              <p className="rounded-[0.875rem] border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                No encontramos espacios con precio mensual. Ingresá el costo a mano.{" "}
                <Link href="/anuncios" className="mv-link">Ver espacios</Link>
              </p>
            ) : (
              <CustomSelect value={spaceId} onChange={pickSpace} options={spaceOptions} />
            )}
            {selectedSpace ? (
              <p className="mt-2 text-xs leading-snug text-[var(--text-secondary)]">
                Usamos <span className="mv-data text-[var(--text-primary)]">{formatMoney(selectedSpace.pricePerMonth, selectedSpace.currency)}</span> por mes: 30 días a{" "}
                <span className="mv-data text-[var(--text-primary)]">{formatMoney(form.price, selectedSpace.currency)}</span> por día. Podés ajustarlo abajo.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={FIELD_LABEL}>Presupuesto diario ({currency})</span>
              <span className={FIELD_HINT}>Lo que invertís por día en publicidad.</span>
              <input 
                type="number" inputMode="decimal" 
                min="0"
                value={form.price} 
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} 
                className="mv-input mv-data" 
              />
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>Duración (días)</span>
              <span className={FIELD_HINT}>Cuántos días va a estar activa la campaña.</span>
              <input 
                type="number" inputMode="decimal" 
                min="1"
                value={form.days} 
                onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} 
                className="mv-input mv-data" 
              />
            </label>
          </div>

          <label className="block">
            <span className={FIELD_LABEL}>Alcance diario</span>
            <span className={FIELD_HINT}>Personas que ven el anuncio por día, aproximadamente.</span>
            <input 
              type="number" inputMode="decimal" 
              min="0"
              value={form.audience} 
              onChange={(e) => setForm({ ...form, audience: Number(e.target.value) })} 
              className="mv-input mv-data" 
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={FIELD_LABEL}>Tasa de conversión (%)</span>
              <span className={FIELD_HINT}>Qué porcentaje de esas personas termina comprando.</span>
              <input 
                type="number" inputMode="decimal" 
                min="0"
                max="100"
                step="0.01"
                value={form.conversion} 
                onChange={(e) => setForm({ ...form, conversion: Number(e.target.value) })} 
                className="mv-input mv-data" 
              />
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>Ticket promedio ({currency})</span>
              <span className={FIELD_HINT}>Lo que gasta en promedio cada cliente.</span>
              <input 
                type="number" inputMode="decimal" 
                min="0"
                value={form.ticket} 
                onChange={(e) => setForm({ ...form, ticket: Number(e.target.value) })} 
                className="mv-input mv-data" 
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button type="button" onClick={calculate} disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Calculator className="h-4 w-4" aria-hidden />}
              {loading ? "Calculando…" : "Calcular retorno"}
            </button>
            {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}

            {result && (
              <button type="button" onClick={handleDownloadRoiPDF} className={buttonClass("secondary", "md", "w-full")}>
                <Download className="h-4 w-4" aria-hidden /> Descargar proyección en PDF
              </button>
            )}
          </div>
        </div>
      </ToolPanel>

      <ToolPanel title="Resultado" live>
        {result ? renderROI(result, currency) : <EmptyState text="Completá los datos de la campaña y tocá «Calcular retorno». Acá vas a ver la inversión, los ingresos estimados y el punto de equilibrio." />}
      </ToolPanel>

      <ToolHistory
        toolId="roi-calculator"
        current={result ? { title: `${selectedSpace ? selectedSpace.title : "Campaña"} · ${form.days} días · ${shortDate()}`, input: { ...form, spaceId: spaceId || null, spaceTitle: selectedSpace?.title ?? null, currency }, output: result } : null}
        onRestore={(run: SavedRun) => {
          const { spaceId: savedSpace, spaceTitle: _title, currency: savedCurrency, ...savedForm } = run.input || {};
          setForm({ ...form, ...savedForm });
          setSpaceId(spaces?.some((space) => space.id === savedSpace) ? savedSpace : "");
          setCurrency(savedCurrency || "USD");
          setResult(run.output);
        }}
      />

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

const CONTRACT_COUNTRIES = ["Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "México", "Paraguay", "Perú", "Uruguay", "Otro"] as const;
const LEGAL_NOTICE = "Es un modelo de partida, no asesoramiento legal; revisalo con un profesional antes de firmarlo.";

/** Splits a plain-text contract into PDF blocks: short all-caps lines and "PRIMERA:"-style lines become headings. */
function contractToPdfBlocks(text: string): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const isHeading = (line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line) && line.length < 70) || /^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULA|DECLARACIONES)\b/.test(line);
    blocks.push(isHeading ? { type: "paragraph", text: line, serif: true, bold: true } : { type: "paragraph", text: line, serif: true });
  }
  return blocks;
}

function ContractGenerator() {
  const [form, setForm] = useState({ freelancerName: "", clientName: "", serviceDescription: "", startDate: "", deliveryDate: "", price: "", currency: "USD", revisions: 2, paymentMethod: "50-50", confidentiality: true, ip: true, country: "Bolivia" });
  const [contractText, setContractText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const noticeId = useId();

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/contract-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) setContractText(json.data.contractText);
      else setError(json.error || "No pudimos generar el contrato.");
    } catch {
      setError("No pudimos generar el contrato. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!contractText) return;
    navigator.clipboard.writeText(contractText);
    setToast({ visible: true, message: "Contrato copiado al portapapeles", type: "success" });
  };

  const handleDownloadPDF = async () => {
    if (!contractText) return;
    setToast({ visible: true, message: "Generando el PDF…", type: "info" });
    try {
      await downloadBrandedPdf({
        toolName: "Generador de contratos",
        title: "Contrato de prestación de servicios",
        subtitle: [form.freelancerName, form.clientName].filter(Boolean).join(" y ") || undefined,
        blocks: [{ type: "notice", text: LEGAL_NOTICE }, ...contractToPdfBlocks(contractText)],
        fileName: `mercav-contrato-${safeFileName(form.clientName || form.freelancerName, "servicios")}`,
      });
      setToast({ visible: true, message: "PDF descargado.", type: "success" });
    } catch {
      setToast({ visible: true, message: "No pudimos generar el PDF.", type: "error" });
    }
  };

  const serviceTitle = form.serviceDescription.trim().slice(0, 90);
  // Stable object so the history knows when a new contract is on screen.
  const contractOutput = useMemo(() => (contractText ? { contractText } : null), [contractText]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div
        id={noticeId}
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4 text-sm leading-relaxed text-[var(--text-primary)] lg:col-span-2"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        <p>
          <span className="font-semibold">{LEGAL_NOTICE.split(";")[0]};</span>
          {LEGAL_NOTICE.slice(LEGAL_NOTICE.indexOf(";") + 1)}
        </p>
      </div>

      <ToolPanel title="Datos del acuerdo">
        <div className="space-y-4">
          {([
            ["freelancerName", "Nombre completo del freelancer", { autoComplete: "name" }],
            ["clientName", "Nombre completo del cliente", { autoComplete: "off" }],
            ["serviceDescription", "Qué servicio se presta", { placeholder: "Ej.: diseño y desarrollo de un sitio web de cinco páginas" }],
            ["startDate", "Fecha de inicio", { placeholder: "Ej.: 1 de noviembre de 2026" }],
            ["deliveryDate", "Fecha de entrega", { placeholder: "Ej.: 15 de diciembre de 2026" }],
            ["price", "Precio total", { inputMode: "decimal", className: "mv-input mv-data" }],
            ["currency", "Moneda", { placeholder: "USD", className: "mv-input mv-data", autoComplete: "off" }],
          ] as const).map(([key, label, extra]) => (
            <label key={key} className="block">
              <span className={FIELD_LABEL}>{label}</span>
              <input className="mv-input" {...extra} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}

          <div>
            <span className={FIELD_LABEL}>País cuya ley aplica</span>
            <span className={FIELD_HINT}>Adapta la cláusula de ley aplicable y jurisdicción.</span>
            <CustomSelect
              value={form.country}
              onChange={(val) => setForm({ ...form, country: val })}
              options={CONTRACT_COUNTRIES.map((country) => ({ value: country, label: country === "Otro" ? "Otro país" : country }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={FIELD_LABEL}>Rondas de revisión</span>
              <input type="number" inputMode="numeric" min="0" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: Number(e.target.value) })} className="mv-input mv-data" />
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>Forma de pago</span>
              <input value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} placeholder="Ej.: 50-50" className="mv-input" />
            </label>
          </div>

          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className={FIELD_LABEL}>Cláusulas opcionales</legend>
            {([
              ["confidentiality", "Confidencialidad"],
              ["ip", "Propiedad intelectual"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[0.875rem] border border-[var(--mv-hairline-strong)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors duration-200 has-[:checked]:border-[var(--color-border-gold)] has-[:checked]:bg-[var(--mv-gold-wash)]">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4 accent-gold" />
                {label}
              </label>
            ))}
          </fieldset>

          <button type="button" onClick={generate} disabled={loading} aria-busy={loading} aria-describedby={noticeId} className={buttonClass("primary", "lg", "w-full")}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
            {loading ? "Redactando…" : "Generar contrato"}
          </button>
          {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
        </div>
      </ToolPanel>
      <ToolPanel title="Contrato" live>
        <div className="flex h-full flex-col">
          <div className="flex-1">
            {contractText ? (
              <div
                tabIndex={0}
                aria-label="Texto del contrato"
                className="mv-focus max-h-[60vh] min-h-[320px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[var(--mv-hairline)] bg-[var(--color-bg-secondary)] p-5 font-serif text-[0.9375rem] leading-relaxed text-[var(--text-primary)] md:max-h-[600px] md:p-6"
              >
                {contractText}
              </div>
            ) : (
              <EmptyState text="Completá los datos y tocá «Generar contrato». El texto aparece acá para que lo revises antes de copiarlo o descargarlo." />
            )}
          </div>
          {contractText ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={handleCopy} className={buttonClass("secondary", "md", "w-full")}>
                  <Copy className="h-4 w-4" aria-hidden /> Copiar texto
                </button>
                <button type="button" onClick={handleDownloadPDF} className={buttonClass("secondary", "md", "w-full")}>
                  <Download className="h-4 w-4" aria-hidden /> Descargar PDF
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--text-secondary)]">¿Lo vas a ofrecer en Mercav? Publicalo como servicio y dividí el pago en hitos.</p>
                <ButtonLink
                  href={`/servicios/publicar${serviceTitle ? `?titulo=${encodeURIComponent(serviceTitle)}` : ""}`}
                  tone="primary"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Megaphone className="h-4 w-4" aria-hidden /> Publicar como servicio con hitos
                </ButtonLink>
              </div>
            </>
          ) : null}
        </div>
      </ToolPanel>

      <ToolHistory
        toolId="contract-generator"
        current={contractText ? { title: `${form.clientName || "Contrato"}${serviceTitle ? ` · ${serviceTitle}` : ""}`.slice(0, 120), input: form, output: contractOutput } : null}
        onRestore={(run: SavedRun) => {
          setForm({ ...form, ...(run.input || {}) });
          setContractText(String(run.output?.contractText || ""));
        }}
      />

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

const SEO_TAGS: Record<string, string> = { error: "Corregir", warning: "Mejorar", success: "Bien" };

function SEOAnalyzer() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/seo-analyzer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setAnalyzedUrl(url);
      } else setError(json.error || "No pudimos analizar esa página.");
    } catch {
      setError("No pudimos analizar esa página. Revisá la dirección y tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setToast({ visible: true, message: "Generando el PDF…", type: "info" });
    const { scores, overallScore, scoreText, scoreDesc, recommendations } = seoAnalysis(result);
    const order: Record<string, number> = { error: 0, warning: 1, success: 2 };
    const blocks: PdfBlock[] = [
      { type: "highlight", label: "Puntaje general", value: `${overallScore}/100 · ${scoreText}`, note: scoreDesc },
      { type: "heading", text: "Puntajes por área" },
      {
        type: "rows",
        rows: [
          ["Velocidad", result.loadTimeScore === null || result.loadTimeScore === undefined ? `${scores.speed}/100 (estimado, sin medición de PageSpeed)` : `${scores.speed}/100`],
          ["Contenido", `${scores.content}/100`],
          ["Enlaces", `${scores.links}/100`],
          ["Técnico", `${scores.technical}/100`],
        ],
      },
      { type: "heading", text: "Qué conviene hacer" },
      ...[...recommendations]
        .sort((x, y) => (order[x.type] ?? 3) - (order[y.type] ?? 3))
        .map((rec): PdfBlock => ({ type: "item", title: rec.title, tag: SEO_TAGS[rec.type], text: `${rec.desc} ${rec.solution}` })),
      { type: "heading", text: "Datos de la página" },
      {
        type: "rows",
        rows: [
          ["Título", result.title || "-"],
          ["Meta descripción", result.metaDescription || "No tiene"],
          ["Palabras", String(result.words ?? 0)],
          ["Imágenes", `${result.images?.total ?? 0} (${result.images?.withoutAlt ?? 0} sin texto alternativo)`],
          ["Enlaces", `${result.links?.internal ?? 0} internos · ${result.links?.external ?? 0} externos`],
          ["sitemap.xml", result.technical?.hasSitemap ? "Responde" : "No encontrado"],
          ["robots.txt", result.technical?.hasRobots ? "Responde" : "No encontrado"],
        ],
      },
      ...(Array.isArray(result.topWords) && result.topWords.length
        ? ([
            { type: "heading", text: "Palabras más frecuentes" },
            { type: "paragraph", text: result.topWords.map((w: any) => `${w.word} (${w.count})`).join(", "), muted: true },
          ] as PdfBlock[])
        : []),
    ];
    try {
      await downloadBrandedPdf({
        toolName: "Analizador SEO",
        title: "Reporte SEO",
        subtitle: analyzedUrl || url,
        blocks,
        fileName: `mercav-seo-${safeFileName((analyzedUrl || url).replace(/^https?:\/\//i, ""), "sitio")}`,
      });
      setToast({ visible: true, message: "PDF descargado.", type: "success" });
    } catch {
      setToast({ visible: true, message: "No pudimos generar el PDF.", type: "error" });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <ToolPanel title="Página a revisar">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) analyze();
          }}
        >
          <label className="block">
            <span className={FIELD_LABEL}>Dirección del sitio</span>
            <span className={FIELD_HINT}>Pegá la URL completa de la página que querés revisar.</span>
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tusitio.com"
              className="mv-input mv-data"
            />
          </label>
          <button type="submit" disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            {loading ? "Analizando…" : "Analizar página"}
          </button>
          {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
          {result && (
            <button type="button" onClick={handleDownloadPDF} className={buttonClass("secondary", "md", "w-full")}>
              <Download className="h-4 w-4" aria-hidden /> Descargar reporte en PDF
            </button>
          )}
        </form>
      </ToolPanel>
      <ToolPanel title="Reporte" live>
        {result ? <div className="space-y-4">{renderSEO(result, analyzedUrl || url)}</div> : <EmptyState text="Ingresá una URL y tocá «Analizar página». Vas a ver un puntaje, cómo se ve en Google y qué conviene corregir primero." />}
      </ToolPanel>

      <ToolHistory
        toolId="seo-analyzer"
        current={result ? { title: `${(analyzedUrl || url).replace(/^https?:\/\//i, "").replace(/\/$/, "")} · ${shortDate()}`.slice(0, 120), input: { url: analyzedUrl || url }, output: result } : null}
        onRestore={(run: SavedRun) => {
          const savedUrl = String(run.input?.url || "");
          setUrl(savedUrl);
          setAnalyzedUrl(savedUrl);
          setResult(run.output);
        }}
      />

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function PriceSimulator() {
  const [form, setForm] = useState({ category: "desarrollo web", region: "global", experienceYears: 2, deliveryType: "estándar", hours: 10 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const simulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/price-simulator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error || "No pudimos calcular la tarifa.");
    } catch {
      setError("No pudimos calcular la tarifa. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPricePDF = async () => {
    if (!result) return;
    setToast({ visible: true, message: "Generando el PDF…", type: "info" });
    const labels = priceLabels(result);
    const usd = (value: number) => formatMoney(value, "USD");
    try {
      await downloadBrandedPdf({
        toolName: "Simulador de precios",
        title: "Tarifa sugerida",
        subtitle: `${labels.category} · ${labels.region}`,
        blocks: [
          { type: "highlight", label: "Tarifa por hora sugerida", value: `${usd(result.hourly)} por hora`, note: "Según tu experiencia, el mercado de referencia y la complejidad de la entrega." },
          { type: "heading", text: `Precio del proyecto completo (${result.hours} h)` },
          {
            type: "rows",
            rows: [
              ["Mínimo", `${usd(result.min)} · para proyectos simples o clientes que recién empiezan`],
              ["Promedio (recomendado)", `${usd(result.avg)} · tarifa de mercado para un servicio profesional`],
              ["Premium", `${usd(result.premium)} · para trabajos complejos, urgentes o de agencia`],
            ],
          },
          { type: "heading", text: "Cómo repartir el precio promedio" },
          {
            type: "rows",
            rows: [
              ["Planificación y concepto (20%)", usd(Math.round(result.avg * 0.2))],
              ["Desarrollo y ejecución (60%)", usd(Math.round(result.avg * 0.6))],
              ["Pruebas, ajustes y entrega (20%)", usd(Math.round(result.avg * 0.2))],
            ],
          },
          { type: "heading", text: "Con qué datos se calculó" },
          {
            type: "rows",
            rows: [
              ["Rubro", labels.category],
              ["Mercado", labels.region],
              ["Entrega", labels.delivery],
              ["Horas", `${result.hours} horas`],
              ["Ajuste por experiencia", labels.experienceAdjustment],
              ["Ajuste por complejidad", labels.deliveryAdjustment],
            ],
          },
          { type: "notice", text: "Es una referencia para negociar, calculada con valores de mercado de Mercav; ajustala a tu caso." },
        ],
        fileName: `mercav-precios-${safeFileName(result.category, "servicio")}`,
      });
      setToast({ visible: true, message: "PDF descargado.", type: "success" });
    } catch {
      setToast({ visible: true, message: "No pudimos generar el PDF.", type: "error" });
    }
  };

  const publishHref = result
    ? `/servicios/publicar?${new URLSearchParams({ precio: String(result.avg), titulo: `${priceLabels(result).category} · ${result.hours} horas` }).toString()}`
    : "/servicios/publicar";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <ToolPanel title="Tu servicio">
        <div className="space-y-5">
          <div>
            <span className={FIELD_LABEL}>Rubro</span>
            <CustomSelect
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
            options={Object.entries(PRICE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

          <div>
            <span className={FIELD_LABEL}>Mercado de referencia</span>
            <CustomSelect
            value={form.region}
            onChange={(val) => setForm({ ...form, region: val })}
            options={Object.entries(PRICE_REGION_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>

          <div>
            <span className={FIELD_LABEL}>Complejidad de la entrega</span>
            <CustomSelect
            value={form.deliveryType}
            onChange={(val) => setForm({ ...form, deliveryType: val })}
            options={[
              { value: "básico", label: "Básico (Tarifa Ajustada)" },
              { value: "estándar", label: "Estándar (Recomendado)" },
              { value: "premium", label: "Premium (Complejo / Urgente)" },
            ]}
          />
        </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <label className="block">
              <span className={FIELD_LABEL}>Años de experiencia</span>
              <input
                type="number" inputMode="decimal"
                min="0"
                max="30"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                className="mv-input mv-data"
              />
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>Horas estimadas</span>
              <input
                type="number" inputMode="decimal"
                min="1"
                max="2000"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                className="mv-input mv-data"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button type="button" onClick={simulate} disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <BarChart3 className="h-4 w-4" aria-hidden />}
              {loading ? "Calculando…" : "Calcular tarifa"}
            </button>
            {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}

            {result && (
              <button type="button" onClick={handleDownloadPricePDF} className={buttonClass("secondary", "md", "w-full")}>
                <Download className="h-4 w-4" aria-hidden /> Descargar tarifario en PDF
              </button>
            )}
          </div>
        </div>
      </ToolPanel>

      <ToolPanel title="Tarifa sugerida" live>
        {result ? (
          <div className="space-y-4">
            {renderPrice(result)}
            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-gold)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--text-secondary)]">
                Ofrecelo en Mercav con el precio promedio, <span className="mv-data font-semibold text-[var(--text-primary)]">{formatMoney(result.avg, "USD")}</span>. Lo podés cambiar antes de publicar.
              </p>
              <ButtonLink href={publishHref} tone="primary" size="sm" className="w-full shrink-0 sm:w-auto">
                <Megaphone className="h-4 w-4" aria-hidden /> Publicar un servicio con este precio
              </ButtonLink>
            </div>
          </div>
        ) : (
          <EmptyState text="Elegí rubro, mercado y complejidad, y tocá «Calcular tarifa». Vas a ver cuánto cobrar por hora y un rango para el proyecto completo." />
        )}
      </ToolPanel>

      <ToolHistory
        toolId="price-simulator"
        current={result ? { title: `${priceLabels(result).category} · ${priceLabels(result).region} · ${result.hours} h`, input: form, output: result } : null}
        onRestore={(run: SavedRun) => {
          setForm({ ...form, ...(run.input || {}) });
          setResult(run.output);
        }}
      />

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function PaletteGenerator() {
  const [base, setBase] = useState("#d4af37");
  const [mode, setMode] = useState("complementaria");
  const [colors, setColors] = useState<{ hex: string; locked: boolean }[]>([
    { hex: "#d4af37", locked: false },
    { hex: "#f1e0a4", locked: false },
    { hex: "#8c6f10", locked: false },
    { hex: "#1a1a1a", locked: false },
    { hex: "#ffffff", locked: false },
  ]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [analysisTab, setAnalysisTab] = useState<'info' | 'contrast' | 'harmony'>('info');

  const colorNames = ['Primario', 'Secundario', 'Acento', 'Oscuro', 'Claro'];

  const hexToRgb = (hex: string) => {
    const match = hex.replace('#', '').match(/.{1,2}/g);
    if (!match) return { r: 0, g: 0, b: 0 };
    const [r, g, b] = match.map(x => parseInt(x, 16));
    return { r, g, b };
  };

  const hexToRgbString = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToHsl = (hex: string) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hexToHslString = (hex: string) => {
    const { h, s, l } = hexToHsl(hex);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const getLuminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (hex1: string, hex2: string) => {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return ((lighter + 0.05) / (darker + 0.05));
  };

  const getWCAGRating = (ratio: number) => {
    if (ratio >= 7) return { label: 'AAA', color: '#22c55e', bg: '#22c55e15' };
    if (ratio >= 4.5) return { label: 'AA', color: '#eab308', bg: '#eab30815' };
    if (ratio >= 3) return { label: 'AA Large', color: '#f97316', bg: '#f9731615' };
    return { label: 'Fail', color: '#ef4444', bg: '#ef444415' };
  };

  const regenerate = () => {
    const newHexs = generatePalette(base, mode);
    setColors(colors.map((c, index) => {
      if (c.locked) return c;
      return { hex: newHexs[index] || c.hex, locked: false };
    }));
  };

  const handleColorChange = (index: number, newHex: string) => {
    const updated = [...colors];
    updated[index] = { ...updated[index], hex: newHex };
    setColors(updated);
    if (index === 0) setBase(newHex);
  };

  const toggleLock = (index: number) => {
    const updated = [...colors];
    updated[index] = { ...updated[index], locked: !updated[index].locked };
    setColors(updated);
  };

  const handleCopySingle = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
    setToast({ visible: true, message: `${hex.toUpperCase()} copiado`, type: "success" });
  };

  const handleCopyCSS = () => {
    const cssText = `:root {\n` + colors.map((c, i) => `  --color-${colorNames[i].toLowerCase()}: ${c.hex};`).join('\n') + `\n}`;
    navigator.clipboard.writeText(cssText);
    setToast({ visible: true, message: "Variables CSS copiadas", type: "success" });
  };

  const handleCopyTailwind = () => {
    const tailwindText = `colors: {\n  brand: {\n` + colors.map((c, i) => `    ${(i + 1) * 100}: "${c.hex}",`).join('\n') + `\n  }\n}`;
    navigator.clipboard.writeText(tailwindText);
    setToast({ visible: true, message: "Configuración de Tailwind copiada", type: "success" });
  };

  const handleCopySCSS = () => {
    const scssText = colors.map((c, i) => `$color-${colorNames[i].toLowerCase()}: ${c.hex};`).join('\n');
    navigator.clipboard.writeText(scssText);
    setToast({ visible: true, message: "Variables SCSS copiadas", type: "success" });
  };

  const handleCopyJSON = () => {
    const jsonObj = Object.fromEntries(colors.map((c, i) => [colorNames[i].toLowerCase(), { hex: c.hex, rgb: hexToRgbString(c.hex), hsl: hexToHslString(c.hex) }]));
    navigator.clipboard.writeText(JSON.stringify(jsonObj, null, 2));
    setToast({ visible: true, message: "Análisis JSON copiado", type: "success" });
  };

  const handleDownloadAnalysisPDF = async () => {
    setToast({ visible: true, message: "Generando análisis de colores...", type: "info" });
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 18;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);
    const bottomLimit = pageHeight - 25; // leave 25mm for footer
    let currentPage = 1;

    const addFooter = () => {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text("Análisis generado por MERCAV.LAT  •  Ecosistema de Herramientas Profesionales", margin, pageHeight - 10);
      doc.text(`Pág. ${currentPage}`, pageWidth - margin - 10, pageHeight - 10);
    };

    const checkPageBreak = (neededSpace: number, y: number): number => {
      if (y + neededSpace > bottomLimit) {
        addFooter();
        doc.addPage();
        currentPage++;
        // Mini header on continuation pages
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("ANÁLISIS DE PALETA DE COLORES — MERCAV.LAT (continuación)", margin, 12);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(margin, 14, pageWidth - margin, 14);
        return 22;
      }
      return y;
    };

    // ---- Page 1: Header ----
    doc.setFillColor(12, 12, 12);
    doc.rect(0, 0, pageWidth, 48, "F");
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 48, pageWidth, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55);
    doc.text("ANÁLISIS DE PALETA DE COLORES", margin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text("Reporte técnico generado por MERCAV.LAT", margin, 28);
    doc.text(`Modo de armonía: ${mode.charAt(0).toUpperCase() + mode.slice(1)}  |  Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 35);
    doc.text(`Color base: ${base.toUpperCase()}`, margin, 42);

    let y = 60;

    // Section: Color Swatches
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("MUESTRAS DE IDENTIDAD", margin, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;

    colors.forEach((c, idx) => {
      y = checkPageBreak(28, y);

      const rgb = hexToRgb(c.hex);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.roundedRect(margin, y, 35, 20, 2, 2, "F");
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.roundedRect(margin, y, 35, 20, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`${colorNames[idx]}`, margin + 42, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`HEX: ${c.hex.toUpperCase()}`, margin + 42, y + 10);
      doc.text(`RGB: ${hexToRgbString(c.hex)}`, margin + 42, y + 14.5);
      doc.text(`HSL: ${hexToHslString(c.hex)}`, margin + 42, y + 19);

      const lum = getLuminance(c.hex);
      doc.text(`Luminancia: ${(lum * 100).toFixed(1)}%`, margin + 110, y + 10);
      doc.text(`Tipo: ${lum > 0.5 ? 'Claro' : lum > 0.2 ? 'Medio' : 'Oscuro'}`, margin + 110, y + 14.5);

      y += 26;
    });

    y += 5;

    // Section: Contrast Matrix — check if we need a new page (matrix needs ~60mm)
    y = checkPageBreak(65, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("MATRIZ DE CONTRASTE (WCAG 2.1)", margin, y);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 10;

    const colW = contentWidth / 6;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("vs.", margin + 2, y + 5);
    colors.forEach((c, i) => {
      doc.text(colorNames[i], margin + colW * (i + 1) + 2, y + 5);
    });
    y += 9;

    colors.forEach((c1, i) => {
      y = checkPageBreak(10, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(colorNames[i], margin + 2, y + 4);

      colors.forEach((c2, j) => {
        if (i === j) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(180, 180, 180);
          doc.text("—", margin + colW * (j + 1) + 8, y + 4);
        } else {
          const ratio = getContrastRatio(c1.hex, c2.hex);
          const rating = getWCAGRating(ratio);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(60, 60, 60);
          doc.text(`${ratio.toFixed(1)}:1`, margin + colW * (j + 1) + 2, y + 4);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(5.5);
          doc.text(rating.label, margin + colW * (j + 1) + 16, y + 4);
        }
      });

      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.05);
      doc.line(margin, y + 6, pageWidth - margin, y + 6);
      y += 8;
    });

    y += 8;

    // Accessibility tips box — check for page break (box is ~35mm)
    y = checkPageBreak(38, y);

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, contentWidth, 32, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(212, 175, 55);
    doc.text("RECOMENDACIONES DE ACCESIBILIDAD", margin + 5, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const tips = [
      "• Ratio mínimo WCAG AA para texto normal: 4.5:1",
      "  Para texto grande (≥18px bold): 3:1",
      "• Ratio mínimo WCAG AAA para texto normal: 7:1",
      "  Para texto grande: 4.5:1",
      "• Evite combinar colores con luminancia similar como fondo y texto",
      "• Use el color Primario para CTAs y el Oscuro/Claro como fondos de alto contraste"
    ];
    tips.forEach((tip, i) => {
      doc.text(tip, margin + 5, y + 13 + (i * 3.5));
    });

    // Footer on final page
    addFooter();

    doc.save(`analisis_paleta_${new Date().toISOString().slice(0, 10)}.pdf`);
    setToast({ visible: true, message: "PDF de análisis descargado correctamente", type: "success" });
  };

  const handleDownloadStyleGuidePDF = async () => {
    setToast({ visible: true, message: "Generando Guía de Estilo de Marca...", type: "info" });
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);

    // Header Banner
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 40, pageWidth, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text("GUÍA DE ESTILO DE MARCA Y PALETA DE COLORES", margin, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generado para el Ecosistema MERCAV.LAT`, margin, 28);
    doc.text(`Fecha del Reporte: ${new Date().toLocaleString()}`, margin, 34);

    let y2 = 55;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("MUESTRAS DE IDENTIDAD Y CÓDIGOS DE COLOR", margin, y2);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y2 + 2, pageWidth - margin, y2 + 2);
    y2 += 10;

    colors.forEach((c, idx) => {
      const rgb = hexToRgb(c.hex);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.roundedRect(margin, y2, 40, 24, 3, 3, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`COLOR DE IDENTIDAD 0${idx + 1}`, margin + 50, y2 + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`HEX: ${c.hex.toUpperCase()}`, margin + 50, y2 + 10);
      doc.text(`RGB: ${hexToRgbString(c.hex)}`, margin + 50, y2 + 15);
      doc.text(`HSL: ${hexToHslString(c.hex)}`, margin + 50, y2 + 20);
      y2 += 30;
    });

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y2, contentWidth, 30, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text("RECOMENDACIÓN DE ACCESIBILIDAD Y CONTRASTE (WCAG):", margin + 5, y2 + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const advice = "Asegúrese de mantener un contraste mínimo de 4.5:1 entre los textos y fondos. Use el Color 01 para llamados a la acción principales y colores neutros (como el Color 04 o 05) para establecer fondos legibles.";
    const splitAdvice = doc.splitTextToSize(advice, contentWidth - 10);
    doc.text(splitAdvice, margin + 5, y2 + 14);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(margin, 270, pageWidth - margin, 270);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Guía generada de forma privada en alta resolución a través de MERCAV.LAT.", margin, 275);
    doc.text("Pág. 1 de 1", pageWidth - margin - 15, 275);

    doc.save(`guia_estilo_color.pdf`);
    setToast({ visible: true, message: "Guía de estilo descargada", type: "success" });
  };

  const extractFromImage = async (file: File) => {
    const url = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });

    setImagePreview(url);
    const img = new Image();
    img.src = url;
    await new Promise((resolve) => { img.onload = resolve; });
    const canvas = document.createElement("canvas");
    const maxSize = 120;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const map = new Map<string, number>();
    for (let i = 0; i < pixels.length; i += 4) {
      const r = Math.round(pixels[i] / 16) * 16;
      const g = Math.round(pixels[i + 1] / 16) * 16;
      const b = Math.round(pixels[i + 2] / 16) * 16;
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      map.set(hex, (map.get(hex) || 0) + 1);
    }
    const dominant = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([hex]) => hex);
    const finalHexs = dominant.length === 5 ? dominant : generatePalette(base, mode);
    setColors(colors.map((c, index) => {
      if (c.locked) return c;
      return { hex: finalHexs[index] || c.hex, locked: false };
    }));
  };

  const activeColor = colors[activeColorIndex];
  const activeHsl = hexToHsl(activeColor.hex);
  const activeLum = getLuminance(activeColor.hex);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Controls + swatches */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-6">
        <section aria-labelledby="palette-controls" className="mv-panel space-y-5 p-5 md:p-6">
          <h3 id="palette-controls" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Punto de partida
          </h3>

          <div>
            <span className={FIELD_LABEL} id="palette-base-label">Color base</span>
            <div className="flex gap-2">
              <label className="relative block h-12 w-14 shrink-0 cursor-pointer overflow-hidden rounded-[0.875rem] border border-[var(--mv-hairline-strong)] transition-colors duration-200 focus-within:border-[var(--color-border-gold)] focus-within:ring-[3px] focus-within:ring-[var(--mv-gold-wash)] hover:border-[var(--color-border-gold)]" style={{ backgroundColor: base }}>
                <span className="sr-only">Elegir color base con el selector</span>
                <input type="color" value={base} onChange={(e) => { setBase(e.target.value); handleColorChange(0, e.target.value); }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <input
                type="text"
                aria-labelledby="palette-base-label"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={base.toUpperCase()}
                onChange={(e) => { const val = e.target.value; if (/^#?[0-9a-fA-F]{0,6}$/.test(val)) { const hex = val.startsWith('#') ? val : `#${val}`; setBase(hex); if (hex.length === 7) handleColorChange(0, hex); }}}
                className="mv-input mv-data flex-1 uppercase"
              />
            </div>
          </div>

          <div>
            <span className={FIELD_LABEL}>Armonía</span>
            <CustomSelect
              value={mode}
              onChange={(val) => { setMode(val); setTimeout(() => regenerate(), 50); }}
              options={[
                { value: "monocromática", label: "Monocromática" },
                { value: "complementaria", label: "Complementaria" },
                { value: "análoga", label: "Análoga" },
                { value: "triádica", label: "Triádica" },
              ]}
            />
          </div>

          <div>
            <span className={FIELD_LABEL}>O sacala de una imagen</span>
            <label className="group flex h-12 cursor-pointer items-center gap-3 rounded-[0.875rem] border border-dashed border-[var(--mv-hairline-strong)] px-4 text-sm text-[var(--text-secondary)] transition-colors duration-200 focus-within:border-[var(--color-border-gold)] focus-within:ring-[3px] focus-within:ring-[var(--mv-gold-wash)] hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)]">
              {imagePreview ? <Check className="h-4 w-4 text-gold" aria-hidden /> : <ImageIcon className="h-4 w-4" aria-hidden />}
              <span className="truncate">{imagePreview ? "Imagen cargada. Elegir otra" : "Subir una imagen"}</span>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && extractFromImage(e.target.files[0])} className="sr-only" />
            </label>
          </div>

          <button type="button" onClick={regenerate} className={buttonClass("primary", "md", "w-full")}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Generar otra combinación
          </button>
          <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">Los colores con candado se mantienen cuando generás una nueva combinación.</p>
        </section>

        <section aria-label="Paleta" className="mv-panel flex min-w-0 flex-col overflow-hidden">
          {imagePreview && (
            <div className="relative h-20 overflow-hidden">
              <img src={imagePreview} className="h-full w-full object-cover" alt="" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                <span className="text-xs font-semibold" style={{ color: "#fff" }}>Colores tomados de tu imagen</span>
              </div>
            </div>
          )}

          <ul className="flex min-h-56 flex-1 md:min-h-60">
            {colors.map((c, index) => {
              const selected = activeColorIndex === index;
              return (
                <li
                  key={index}
                  className={cn("group relative min-w-0 transition-[flex-grow] duration-300 ease-[var(--ease-out)]", selected ? "flex-[1.6]" : "flex-1")}
                  style={{ backgroundColor: c.hex }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveColorIndex(index)}
                    aria-pressed={selected}
                    aria-label={`Ver detalles de ${colorNames[index]} ${c.hex.toUpperCase()}`}
                    className="absolute inset-0 z-0 outline-none focus-visible:shadow-[inset_0_0_0_3px_#fff]"
                  />
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
                  {selected && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: "#fff" }} />}

                  <div className="absolute inset-x-0 top-2.5 z-10 flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between sm:px-2.5">
                    <label
                      className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-white/20 bg-black/45 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0"
                      style={{ color: "#fff" }}
                    >
                      <Droplets className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Cambiar {colorNames[index]}</span>
                      <input type="color" value={c.hex} onChange={(e) => handleColorChange(index, e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                    </label>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleLock(index); }}
                      aria-pressed={c.locked}
                      aria-label={c.locked ? `Liberar ${colorNames[index]}` : `Fijar ${colorNames[index]}`}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl border outline-none transition-opacity duration-200 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white",
                        c.locked ? "border-gold/60 bg-black/55" : "border-white/20 bg-black/45 group-hover:opacity-100 [@media(hover:hover)]:opacity-0",
                      )}
                      style={{ color: c.locked ? "#D4AF37" : "#fff" }}
                    >
                      {c.locked ? <Lock className="h-4 w-4" aria-hidden /> : <Unlock className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-1 pb-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopySingle(c.hex, index); }}
                      aria-label={`Copiar ${c.hex.toUpperCase()}`}
                      className="mv-data flex h-9 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold outline-none hover:bg-black/30 focus-visible:ring-2 focus-visible:ring-white sm:text-xs"
                      style={{ color: "#fff" }}
                    >
                      {copiedIndex === index ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="hidden h-3.5 w-3.5 opacity-70 sm:block" aria-hidden />}
                      {c.hex.toUpperCase()}
                    </button>
                    <span className="hidden truncate text-[11px] font-medium sm:block" style={{ color: "rgba(255,255,255,0.75)" }}>{colorNames[index]}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div aria-hidden className="flex h-2 shrink-0">
            {colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: `linear-gradient(to right, ${c.hex}, ${colors[(i + 1) % colors.length].hex})` }} />
            ))}
          </div>
        </section>
      </div>

      {/* Analysis + preview */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section aria-label="Análisis del color" className="mv-panel min-w-0 overflow-hidden">
          <div role="tablist" aria-label="Análisis" className="flex border-b border-[var(--mv-hairline)] px-2">
            {[
              { key: 'info' as const, label: 'Detalles', icon: Eye },
              { key: 'contrast' as const, label: 'Contraste', icon: Contrast },
              { key: 'harmony' as const, label: 'Armonía', icon: Sun },
            ].map(tab => {
              const Icon = tab.icon;
              const selected = analysisTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`palette-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls="palette-tabpanel"
                  onClick={() => setAnalysisTab(tab.key)}
                  className={cn(
                    "mv-focus relative flex h-12 flex-1 items-center justify-center gap-2 rounded-t-xl text-sm font-semibold transition-colors duration-200",
                    selected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", selected && "text-gold")} aria-hidden />
                  {tab.label}
                  {selected && <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gold" />}
                </button>
              );
            })}
          </div>

          <div id="palette-tabpanel" role="tabpanel" aria-labelledby={`palette-tab-${analysisTab}`} className="p-5 md:p-6">
            {analysisTab === 'info' && (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 rounded-2xl border border-[var(--mv-hairline-strong)]" style={{ backgroundColor: activeColor.hex }} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h4 className="font-display text-lg font-semibold text-[var(--text-primary)]">{colorNames[activeColorIndex]}</h4>
                    <dl className="grid gap-1">
                      {[
                        { label: 'HEX', value: activeColor.hex.toUpperCase() },
                        { label: 'RGB', value: hexToRgbString(activeColor.hex) },
                        { label: 'HSL', value: hexToHslString(activeColor.hex) },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-2">
                          <dt className="w-9 text-xs font-medium text-[var(--text-tertiary)]">{row.label}</dt>
                          <dd className="mv-data truncate text-sm text-[var(--text-primary)]">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Tono', value: activeHsl.h, max: 360, unit: '°', gradient: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' },
                    { label: 'Saturación', value: activeHsl.s, max: 100, unit: '%', gradient: `linear-gradient(to right, hsl(${activeHsl.h}, 0%, ${activeHsl.l}%), hsl(${activeHsl.h}, 100%, ${activeHsl.l}%))` },
                    { label: 'Luminosidad', value: activeHsl.l, max: 100, unit: '%', gradient: `linear-gradient(to right, #000, hsl(${activeHsl.h}, ${activeHsl.s}%, 50%), #fff)` },
                  ].map(bar => (
                    <div key={bar.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[var(--text-secondary)]">{bar.label}</span>
                        <span className="mv-data font-semibold text-[var(--text-primary)]">{bar.value}{bar.unit}</span>
                      </div>
                      <div className="relative h-2.5 rounded-full" style={{ background: bar.gradient }}>
                        <div className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-black/30 bg-white shadow" style={{ left: `${(bar.value / bar.max) * 100}%`, transform: 'translate(-50%, -50%)' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={cn(TILE, "flex items-center gap-3 p-3")}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--mv-hairline)]">
                    {activeLum > 0.5 ? <Sun className="h-4 w-4 text-gold" aria-hidden /> : <Moon className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden />}
                  </span>
                  <div>
                    <p className={TILE_LABEL}>Luminancia relativa</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      <span className="mv-data">{(activeLum * 100).toFixed(1)}%</span> · {activeLum > 0.5 ? 'Color claro' : activeLum > 0.2 ? 'Color medio' : 'Color oscuro'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analysisTab === 'contrast' && (
              <div className="space-y-3">
                <p className="mv-body text-sm">
                  Contraste de <span className="font-semibold text-[var(--text-primary)]">{colorNames[activeColorIndex]}</span> como texto sobre cada uno de los otros colores. AA es el mínimo recomendado para texto normal.
                </p>
                <ul className="space-y-2">
                  {colors.map((c, i) => {
                    if (i === activeColorIndex) return null;
                    const ratio = getContrastRatio(activeColor.hex, c.hex);
                    const rating = getWCAGRating(ratio);
                    const ratingLabel = rating.label === 'Fail' ? 'No pasa' : rating.label === 'AA Large' ? 'AA grande' : rating.label;
                    return (
                      <li key={i} className={cn(TILE, "flex items-center gap-3 p-3")}>
                        <div className="h-9 w-9 shrink-0 rounded-lg border border-[var(--mv-hairline-strong)]" style={{ backgroundColor: c.hex }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{colorNames[i]}</span>
                            <span className="mv-data text-sm font-semibold text-[var(--text-primary)]">{ratio.toFixed(2)}:1</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--mv-hairline)]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (ratio / 21) * 100)}%`, backgroundColor: rating.color }} />
                            </div>
                            <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: rating.bg, color: rating.color }}>
                              {ratingLabel}
                            </span>
                          </div>
                        </div>
                        <div aria-hidden className="hidden h-9 w-16 shrink-0 place-items-center rounded-lg text-xs font-semibold sm:grid" style={{ backgroundColor: c.hex, color: activeColor.hex }}>
                          Texto
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {analysisTab === 'harmony' && (
              <div className="space-y-5">
                <div className="flex justify-center py-2">
                  <div className="relative h-48 w-48">
                    <div aria-hidden className="h-full w-full rounded-full" style={{
                      background: 'conic-gradient(from 0deg, hsl(0, 80%, 50%), hsl(30, 80%, 50%), hsl(60, 80%, 50%), hsl(90, 80%, 50%), hsl(120, 80%, 50%), hsl(150, 80%, 50%), hsl(180, 80%, 50%), hsl(210, 80%, 50%), hsl(240, 80%, 50%), hsl(270, 80%, 50%), hsl(300, 80%, 50%), hsl(330, 80%, 50%), hsl(0, 80%, 50%))',
                      opacity: 0.3,
                    }} />
                    <div aria-hidden className="absolute inset-4 rounded-full border border-[var(--mv-hairline)] bg-bg-primary" />

                    {colors.map((c, i) => {
                      const hsl = hexToHsl(c.hex);
                      const angle = (hsl.h - 90) * (Math.PI / 180);
                      const radius = 80;
                      const x = 96 + Math.cos(angle) * radius;
                      const y = 96 + Math.sin(angle) * radius;
                      return (
                        <button
                          key={i}
                          type="button"
                          aria-label={`${colorNames[i]}, tono ${hsl.h}°`}
                          aria-pressed={i === activeColorIndex}
                          className={cn(
                            "absolute z-10 h-6 w-6 rounded-full border-2 shadow-lg outline-none transition-transform duration-200 ease-[var(--ease-out)] hover:scale-110 focus-visible:ring-2 focus-visible:ring-gold",
                            i === activeColorIndex ? "scale-125 border-white" : "border-white/40",
                          )}
                          style={{ backgroundColor: c.hex, left: x - 12, top: y - 12 }}
                          onClick={() => setActiveColorIndex(i)}
                        />
                      );
                    })}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs font-medium capitalize text-[var(--text-secondary)]">{mode}</p>
                        <p className="mv-data mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{activeHsl.h}°</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {colors.map((c, i) => {
                    const hsl = hexToHsl(c.hex);
                    const selected = i === activeColorIndex;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setActiveColorIndex(i)}
                        className={cn(
                          "mv-focus flex min-h-12 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors duration-200",
                          selected ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]" : "border-[var(--mv-hairline)] hover:bg-[var(--mv-panel-hover)]",
                        )}
                      >
                        <span className="h-6 w-6 shrink-0 rounded-md" style={{ backgroundColor: c.hex }} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{colorNames[i]}</span>
                          <span className="mv-data block truncate text-[11px] text-[var(--text-secondary)]">{hsl.h}° · {hsl.s}% · {hsl.l}%</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="palette-preview" className="mv-panel min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--mv-hairline)] px-5 py-4 md:px-6">
            <h3 id="palette-preview" className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Eye className="h-4 w-4 text-gold" aria-hidden /> Así se vería en una interfaz
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">Ejemplo ilustrativo</span>
          </div>

          <div aria-hidden className="space-y-4 p-5 md:p-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--mv-hairline)]" style={{ backgroundColor: `${colors[3].hex}` }}>
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: `${colors[0].hex}15` }}>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md" style={{ backgroundColor: colors[0].hex }} />
                  <span className="text-xs font-semibold" style={{ color: colors[4].hex }}>MiApp</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors[0].hex }} />
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors[1].hex }} />
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors[2].hex }} />
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="grid grid-cols-3 gap-2">
                  {['Ingresos', 'Usuarios', 'Ventas'].map((label, i) => (
                    <div key={label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: `${colors[i % 3].hex}10`, border: `1px solid ${colors[i % 3].hex}20` }}>
                      <p className="text-[15px] font-semibold" style={{ color: colors[i % 3].hex }}>
                        {['$24K', '1.2K', '847'][i]}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium" style={{ color: `${colors[4].hex}99` }}>{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex h-16 items-end gap-1.5 px-1">
                  {[65, 40, 80, 55, 90, 45, 70, 85, 60, 75, 50, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        backgroundColor: i === 11 ? colors[0].hex : `${colors[0].hex}${Math.round(30 + (h / 100) * 40).toString(16)}`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <span className="flex-1 rounded-lg py-2 text-center text-[11px] font-semibold" style={{ backgroundColor: colors[0].hex, color: colors[3].hex }}>
                    Acción principal
                  </span>
                  <span className="flex-1 rounded-lg border py-2 text-center text-[11px] font-semibold" style={{ borderColor: `${colors[1].hex}50`, color: colors[1].hex, backgroundColor: `${colors[1].hex}08` }}>
                    Secundaria
                  </span>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <span className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: `${colors[2].hex}15`, color: colors[2].hex }}>Premium</span>
                  <span className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: `${colors[0].hex}15`, color: colors[0].hex }}>Activo</span>
                  <span className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: `${colors[1].hex}15`, color: colors[1].hex }}>Nuevo</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[var(--mv-hairline)] p-4" style={{ backgroundColor: colors[3].hex }}>
              <div className="mb-2 flex items-center gap-2" style={{ color: `${colors[4].hex}99` }}>
                <Type className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Legibilidad del texto</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: colors[4].hex }}>Título principal con color claro</p>
              <p className="text-xs" style={{ color: colors[0].hex }}>Subtítulo destacado con color primario</p>
              <p className="text-[11px]" style={{ color: `${colors[4].hex}80` }}>Cuerpo de texto con menor opacidad para lectura cómoda.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Export */}
      <section aria-labelledby="palette-export" className="mv-panel p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-1">
          <h3 id="palette-export" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">Llevala a tu proyecto</h3>
          <p className="text-sm text-[var(--text-secondary)]">Copiá el código en el formato que uses o descargá la guía de marca.</p>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: 'variables CSS', handler: handleCopyCSS, icon: '{ }' },
            { label: 'Tailwind', handler: handleCopyTailwind, icon: 'tw' },
            { label: 'variables SCSS', handler: handleCopySCSS, icon: '$' },
            { label: 'JSON', handler: handleCopyJSON, icon: '[ ]' },
          ].map(exp => (
            <button key={exp.label} type="button" onClick={exp.handler} className={buttonClass("secondary", "sm", "w-full justify-start px-3.5")}>
              <span aria-hidden className="mv-data w-6 text-xs text-gold">{exp.icon}</span>
              <span className="truncate">Copiar {exp.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <button type="button" onClick={handleDownloadAnalysisPDF} className={buttonClass("secondary", "md", "w-full")}>
            <FileDown className="h-4 w-4" aria-hidden /> Análisis de colores (PDF)
          </button>
          <button type="button" onClick={handleDownloadStyleGuidePDF} className={buttonClass("secondary", "md", "w-full")}>
            <Download className="h-4 w-4" aria-hidden /> Guía de estilo de marca (PDF)
          </button>
        </div>
      </section>

      <ToolHistory
        toolId="palette-generator"
        current={{ title: `Paleta ${mode} · ${colors.map((c) => c.hex.toUpperCase()).join(" ")}`.slice(0, 120), input: { base, mode }, output: colors }}
        onRestore={(run: SavedRun) => {
          const saved = Array.isArray(run.output) ? run.output.filter((c: any) => typeof c?.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex)) : [];
          if (saved.length === 5) setColors(saved.map((c: any) => ({ hex: c.hex, locked: Boolean(c.locked) })));
          if (typeof run.input?.base === "string") setBase(run.input.base);
          if (typeof run.input?.mode === "string") setMode(run.input.mode);
          setActiveColorIndex(0);
        }}
      />

      <Toast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function PromptGenerator() {
  const [form, setForm] = useState({ template: PROMPT_TEMPLATES[0].id as string, business: "", audience: "", tone: "cercano", locale: "neutro", description: "" });
  const [prompts, setPrompts] = useState<PromptVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const template = templateById(form.template);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/prompt-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) setPrompts(json.data);
      else setError(json.error || "No pudimos generar los prompts.");
    } catch {
      setError("No pudimos generar los prompts. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!prompts.length) return;
    setToast({ visible: true, message: "Generando el PDF…", type: "info" });
    try {
      await downloadBrandedPdf({
        toolName: "Generador de prompts",
        title: template.label,
        subtitle: form.business || undefined,
        blocks: [
          { type: "paragraph", text: "Copiá la variante que prefieras y pegala en el asistente de IA que uses.", muted: true },
          ...prompts.flatMap((p): PdfBlock[] => [
            { type: "heading", text: p.label },
            ...p.prompt.split("\n").filter((line) => line.trim()).map((line): PdfBlock => ({ type: "paragraph", text: line })),
          ]),
        ],
        fileName: `mercav-prompts-${safeFileName(template.label)}`,
      });
      setToast({ visible: true, message: "PDF descargado.", type: "success" });
    } catch {
      setToast({ visible: true, message: "No pudimos generar el PDF.", type: "error" });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <ToolPanel title="Qué necesitás">
        <div className="space-y-4">
          <fieldset>
            <legend className={FIELD_LABEL}>Qué querés escribir</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {PROMPT_TEMPLATES.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[0.875rem] border border-[var(--mv-hairline-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors duration-200 has-[:checked]:border-[var(--color-border-gold)] has-[:checked]:bg-[var(--mv-gold-wash)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-border-gold)]"
                >
                  <input type="radio" name="prompt-template" value={item.id} checked={form.template === item.id} onChange={() => setForm({ ...form, template: item.id })} className="h-4 w-4 accent-gold" />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className={FIELD_LABEL}>Tu negocio</span>
            <span className={FIELD_HINT}>Nombre y rubro. Ej.: Panadería Doña Rosa, Cochabamba.</span>
            <input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} maxLength={300} autoComplete="organization" className="mv-input" />
          </label>
          <label className="block">
            <span className={FIELD_LABEL}>A quién le hablás</span>
            <span className={FIELD_HINT}>Ej.: familias del barrio, dueños de pymes, estudiantes.</span>
            <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} maxLength={300} className="mv-input" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={FIELD_LABEL}>Tono</span>
              <CustomSelect
                value={form.tone}
                onChange={(val) => setForm({ ...form, tone: val })}
                options={PROMPT_TONES.map((tone) => ({ value: tone, label: tone.charAt(0).toUpperCase() + tone.slice(1) }))}
              />
            </div>
            <div>
              <span className={FIELD_LABEL}>Español de</span>
              <CustomSelect
                value={form.locale}
                onChange={(val) => setForm({ ...form, locale: val })}
                options={PROMPT_LOCALES.map((locale) => ({ value: locale, label: locale === "neutro" ? "Neutro (Latinoamérica)" : locale }))}
              />
            </div>
          </div>
          <label className="block">
            <span className={FIELD_LABEL}>Detalles</span>
            <span className={FIELD_HINT}>{template.hint} Solo se usa lo que escribas: lo que falte queda como [marcador].</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} rows={5} className="mv-input h-auto min-h-32 resize-y py-3 leading-relaxed" />
          </label>
          <button type="button" onClick={generate} disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full")}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
            {loading ? "Generando…" : "Generar prompts"}
          </button>
          {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
          {prompts.length > 0 && (
            <button type="button" onClick={handleDownloadPDF} className={buttonClass("secondary", "md", "w-full")}>
              <FileDown className="h-4 w-4" aria-hidden /> Descargar en PDF
            </button>
          )}
        </div>
      </ToolPanel>
      <ToolPanel title="Variantes" live>
        {prompts.length ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">Copiá la que prefieras y pegala en cualquier asistente de IA.</p>
            <ul className="space-y-3">
              {prompts.map((p) => (
                <li key={p.label} className={cn(TILE, "p-4 md:p-5")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gold">{p.label}</p>
                    <CopyButton text={p.prompt} label={`Copiar ${p.label}`} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{p.prompt}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState text="Elegí qué querés escribir, contá los detalles y tocá «Generar prompts». Vas a recibir tres variantes para cualquier asistente de IA." />
        )}
      </ToolPanel>

      <ToolHistory
        toolId="prompt-generator"
        current={prompts.length ? { title: `${template.label}${form.business ? ` · ${form.business}` : ""}`.slice(0, 120), input: form, output: prompts } : null}
        onRestore={(run: SavedRun) => {
          setForm({ ...form, ...(run.input || {}) });
          setPrompts(Array.isArray(run.output) ? run.output : []);
        }}
      />

      <Toast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

/** Copy-to-clipboard for a single prompt. The original button had no handler; this only adds the copy itself. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          },
          () => {},
        );
      }}
      className={buttonClass("ghost", "sm", "h-10 shrink-0 px-3")}
    >
      {done ? <Check className="h-4 w-4 text-gold" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{done ? "Copiado" : "Copiar"}</span>
    </button>
  );
}

/** `live` marks the results side: it gets a subtle raised fill so input and output read as two steps. */
function ToolPanel({ title, children, live }: { title: string; children: ReactNode; live?: boolean }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("mv-panel min-w-0 p-5 md:p-7", live && "bg-[var(--color-bg-secondary)]")}>
      <h3 id={id} className="mb-5 font-display text-lg font-semibold tracking-tight text-[var(--text-primary)] md:mb-6">{title}</h3>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-6 py-10 text-center md:min-h-[20rem]">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-tertiary)]">
        <ArrowRight className="h-5 w-5 -rotate-90 lg:rotate-180" aria-hidden />
      </span>
      <p className="mv-body max-w-xs">{text}</p>
    </div>
  );
}

function labelFor(key: string) {
  const map: Record<string, string> = {
    price: "Presupuesto / Costo Diario",
    audience: "Alcance / Audiencia Diaria",
    conversion: "Tasa de Conversión (%)",
    ticket: "Ticket Promedio de Venta",
    days: "Duración de Campaña (Días)",
  };
  return map[key] || key;
}

function renderROI(result: any, currency = "USD") {
  const formatVal = (val: number) => formatMoney(val, currency);
  const isPositive = result.roi >= 0;

  return (
    <div className="space-y-3">
      <div className={cn(TILE, "p-5", isPositive ? "border-emerald-500/25" : "border-red-500/25")}>
        <p className={TILE_LABEL}>Retorno sobre la inversión</p>
        <p className={cn("mv-data mt-1 text-4xl font-semibold tracking-tight", isPositive ? "text-emerald-400" : "text-red-400")}>
          {isPositive ? '+' : ''}{result.roi?.toFixed?.(2) || 0}%
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {isPositive ? "Con estos supuestos, la campaña recupera lo invertido." : "Con estos supuestos, la campaña no llega a cubrir lo invertido."}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Inversión total", value: formatVal(result.investment), tone: "" },
          { label: "Ingresos estimados", value: formatVal(result.revenue), tone: "text-gold" },
          { label: "Ganancia neta", value: formatVal(result.revenue - result.investment), tone: isPositive ? "text-emerald-400" : "text-red-400" },
          { label: "Ventas estimadas", value: `${result.potentialClients} clientes`, tone: "" },
        ].map((row) => (
          <div key={row.label} className={cn(TILE, "flex flex-col-reverse gap-1 p-4")}>
            <dt className={TILE_LABEL}>{row.label}</dt>
            <dd className={cn("mv-data text-xl font-semibold text-[var(--text-primary)]", row.tone)}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Punto de equilibrio</p>
          <p className="text-xs text-[var(--text-secondary)]">Ventas necesarias para cubrir la inversión.</p>
        </div>
        <p className="mv-data shrink-0 text-xl font-semibold text-[var(--text-primary)]">{result.breakEvenClients}</p>
      </div>
    </div>
  );
}

function seoAnalysis(result: any) {
  const scores = result.scores || {
    speed: result.loadTimeScore || 70,
    content: Math.min(100, Math.max(30, Math.round((result.words / 1000) * 100))),
    links: Math.min(100, Math.max(20, Math.round(((result.links.internal + result.links.external) / 20) * 100))),
    technical: (result.technical.hasSitemap ? 25 : 0) + (result.technical.hasRobots ? 25 : 0) + (result.images.withAlt === result.images.total ? 25 : 10) + 25
  };
  
  const overallScore = Math.round((scores.speed + scores.content + scores.links + scores.technical) / 4);

  // Dynamic status based on overallScore
  let scoreColor = "text-red-400";
  let scoreBg = "bg-red-500/[0.04] border-red-500/25";
  let scoreText = "Crítico";
  let scoreDesc = "Tu sitio tiene problemas graves que dañan el posicionamiento en Google.";
  
  if (overallScore >= 80) {
    scoreColor = "text-emerald-400";
    scoreBg = "bg-emerald-500/[0.04] border-emerald-500/25";
    scoreText = "Excelente";
    scoreDesc = "¡Excelente! Tu sitio está optimizado para los motores de búsqueda.";
  } else if (overallScore >= 55) {
    scoreColor = "text-yellow-400";
    scoreBg = "bg-yellow-500/[0.04] border-yellow-500/25";
    scoreText = "Aceptable";
    scoreDesc = "Buen trabajo, pero hay áreas clave de optimización que deberías mejorar.";
  }

  // Dynamic recommendations list
  const recommendations: Array<{ type: string; title: string; desc: string; solution: string }> = [];
  
  // Title Check
  const titleLength = result.title?.length || 0;
  if (!result.title || titleLength === 0) {
    recommendations.push({
      type: "error",
      title: "Título de Página no detectado",
      desc: "La etiqueta <title> está vacía o falta por completo. Es el factor principal en buscadores.",
      solution: "Define un título conciso entre 30 y 60 caracteres."
    });
  } else if (titleLength < 30) {
    recommendations.push({
      type: "warning",
      title: "Título demasiado corto",
      desc: `El título tiene solo ${titleLength} caracteres. Google podría complementarlo automáticamente.`,
      solution: "Escribe un título más informativo que incluya tus palabras clave principales."
    });
  } else if (titleLength > 60) {
    recommendations.push({
      type: "warning",
      title: "Título demasiado largo",
      desc: `El título tiene ${titleLength} caracteres (máx. recomendado: 60). Se cortará en Google.`,
      solution: "Acorta el título eliminando redundancias y deja solo lo más importante."
    });
  } else {
    recommendations.push({
      type: "success",
      title: "Título perfectamente optimizado",
      desc: `El título tiene ${titleLength} caracteres, cumpliendo con los estándares de Google.`,
      solution: `"${result.title}"`
    });
  }

  // Meta Description Check
  const descLength = result.metaDescription?.length || 0;
  if (!result.metaDescription || descLength === 0) {
    recommendations.push({
      type: "error",
      title: "Falta la Meta Descripción",
      desc: "No se encontró etiqueta de descripción. Google generará un fragmento genérico.",
      solution: "Redacta una meta descripción persuasiva que invite a los usuarios a hacer clic."
    });
  } else if (descLength < 120) {
    recommendations.push({
      type: "warning",
      title: "Meta Descripción demasiado corta",
      desc: `Tiene ${descLength} caracteres. No aprovechas el espacio visual en buscadores (ideal: 120-160).`,
      solution: "Añade detalles relevantes o un llamado a la acción claro para ampliarla."
    });
  } else if (descLength > 160) {
    recommendations.push({
      type: "warning",
      title: "Meta Descripción demasiado larga",
      desc: `Tiene ${descLength} caracteres. Supera el límite de Google y aparecerá recortada con puntos suspensivos.`,
      solution: "Resume la propuesta de valor eliminando palabras complementarias para no pasar de 160."
    });
  } else {
    recommendations.push({
      type: "success",
      title: "Meta Descripción optimizada",
      desc: `Excelente. La descripción posee ${descLength} caracteres, ideal para el fragmento de búsqueda.`,
      solution: `"${result.metaDescription}"`
    });
  }

  // Word Count Check
  if (result.words < 300) {
    recommendations.push({
      type: "error",
      title: "Contenido muy escaso",
      desc: `El sitio tiene solo ${result.words} palabras. Google prefiere páginas con contenido rico y profundo.`,
      solution: "Escribe más contenido relevante o añade explicaciones del servicio para superar las 300 palabras."
    });
  } else if (result.words < 600) {
    recommendations.push({
      type: "warning",
      title: "Volumen de contenido aceptable",
      desc: `La página cuenta con ${result.words} palabras, volumen medio para SEO competitivo.`,
      solution: "Para palabras clave de alta competencia, expande tu contenido a más de 800 palabras."
    });
  } else {
    recommendations.push({
      type: "success",
      title: "Excelente volumen de texto",
      desc: `Tu página posee ${result.words} palabras, lo que permite insertar términos de forma orgánica.`,
      solution: "Mantén este nivel y añade encabezados H2/H3 para estructurar la lectura."
    });
  }

  // Alt Images Check
  if (result.images.total > 0 && result.images.withoutAlt > 0) {
    recommendations.push({
      type: "warning",
      title: "Imágenes sin atributo ALT",
      desc: `${result.images.withoutAlt} de tus ${result.images.total} imágenes no tienen etiqueta de descripción ALT.`,
      solution: "Añade texto alternativo (ALT) descriptivo en el HTML de tus imágenes para mejorar la búsqueda visual."
    });
  } else if (result.images.total > 0) {
    recommendations.push({
      type: "success",
      title: "Imágenes 100% optimizadas",
      desc: `Todas tus ${result.images.total} imágenes tienen su respectiva descripción ALT.`,
      solution: "Google entiende el contenido de tus imágenes para indexarlas en Google Images."
    });
  }

  // Technical Tracking Files Check
  if (!result.technical.hasSitemap) {
    recommendations.push({
      type: "error",
      title: "Sitemap.xml no detectado",
      desc: "El mapa del sitio web no está configurado o no responde en /sitemap.xml.",
      solution: "Genera un archivo sitemap.xml y súbelo al servidor para que los buscadores rastreen todas tus páginas."
    });
  }
  if (!result.technical.hasRobots) {
    recommendations.push({
      type: "warning",
      title: "Robots.txt no configurado",
      desc: "Falta el archivo de instrucciones para robots de búsqueda en /robots.txt.",
      solution: "Crea un archivo robots.txt indicando a los bots qué directorios rastrear y cuáles ignorar."
    });
  }
  if (result.technical.hasSitemap && result.technical.hasRobots) {
    recommendations.push({
      type: "success",
      title: "Archivos de rastreo técnico completos",
      desc: "Tanto sitemap.xml como robots.txt están activos y accesibles.",
      solution: "Los crawlers de Google pueden explorar tu web con total eficiencia."
    });
  }

  return { scores, overallScore, scoreColor, scoreBg, scoreText, scoreDesc, recommendations };
}

function renderSEO(result: any, url: string) {
  const { scores, overallScore, scoreColor, scoreBg, scoreText, scoreDesc, recommendations } = seoAnalysis(result);
  const scoreStroke = overallScore >= 80 ? "#10b981" : overallScore >= 55 ? "#f59e0b" : "#ef4444";
  const counts = {
    error: recommendations.filter((r) => r.type === "error").length,
    warning: recommendations.filter((r) => r.type === "warning").length,
  };
  const host = url.replace(/https?:\/\//i, '').split('/')[0];

  return (
    <div className="space-y-4 text-left">
      {/* Summary */}
      <div className={cn("flex flex-col items-center gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center md:p-6", scoreBg)}>
        <div className="relative grid h-28 w-28 shrink-0 place-items-center">
          <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="56" cy="56" r="44" fill="none" stroke="var(--mv-hairline-strong)" strokeWidth="8" />
            <circle cx="56" cy="56" r="44" fill="none" strokeWidth="8" strokeDasharray="276.4" strokeDashoffset={276.4 - (276.4 * overallScore) / 100} stroke={scoreStroke} strokeLinecap="round" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="mv-data text-3xl font-semibold text-[var(--text-primary)]">{overallScore}</span>
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">de 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h4 className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">Puntaje general</h4>
            <span className={cn("mv-chip", scoreColor)}>{scoreText}</span>
          </div>
          <p className="text-sm text-[var(--text-primary)]">{scoreDesc}</p>
          <p className="mv-data truncate text-xs text-[var(--text-secondary)]">{url}</p>
          {(counts.error > 0 || counts.warning > 0) && (
            <p className="text-xs text-[var(--text-secondary)]">
              {counts.error > 0 ? `${counts.error} crítico${counts.error === 1 ? "" : "s"}` : null}
              {counts.error > 0 && counts.warning > 0 ? " · " : null}
              {counts.warning > 0 ? `${counts.warning} para optimizar` : null}
            </p>
          )}
        </div>
      </div>

      {/* Sub-scores */}
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Velocidad', score: scores.speed, icon: Zap, stroke: '#f59e0b' },
          { label: 'Contenido', score: scores.content, icon: FileText, stroke: '#10b981' },
          { label: 'Enlaces', score: scores.links, icon: Layers, stroke: '#3b82f6' },
          { label: 'Técnico', score: scores.technical, icon: Shield, stroke: '#d4af37' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(TILE, "space-y-2 p-4")}>
              <dt className="flex items-center justify-between">
                <span className={TILE_LABEL}>{item.label}</span>
                <Icon className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden />
              </dt>
              <dd>
                <span className="mv-data text-2xl font-semibold text-[var(--text-primary)]">{item.score}</span>
                <span className="mv-data text-xs text-[var(--text-tertiary)]">/100</span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--mv-hairline)]">
                  <div className="h-full rounded-full" style={{ width: `${item.score}%`, backgroundColor: item.stroke }} />
                </div>
              </dd>
            </div>
          );
        })}
      </dl>

      {/* Search result preview */}
      <div className={cn(TILE, "space-y-3 p-4 md:p-5")}>
        <div className="flex items-center justify-between gap-3">
          <p className={SUBHEAD}>
            <Globe className="h-4 w-4 text-gold" aria-hidden /> Cómo te ve Google
          </p>
          <span className="hidden text-xs text-[var(--text-tertiary)] sm:inline">Vista aproximada en escritorio</span>
        </div>
        <div className="rounded-xl border border-black/5 p-4 text-left font-sans md:p-5" style={{ background: "#fff" }}>
          <div className="mb-0.5 flex items-center gap-1 truncate text-[12px]" style={{ color: "#4d5156" }}>
            <Globe className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{host}</span>
          </div>
          <p className="mt-0.5 truncate text-[18px] font-medium leading-snug md:text-[19px]" style={{ color: "#1a0dab" }}>
            {result.title || "Sin título"}
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "#4d5156" }}>
            {result.metaDescription || "Sin meta descripción: Google va a mostrar un fragmento tomado del contenido de la página."}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className={cn(TILE, "space-y-4 p-4 md:p-5")}>
          <p className={SUBHEAD}>
            <FileText className="h-4 w-4 text-gold" aria-hidden /> Contenido y metadatos
          </p>
          <div>
            <div className="mb-1 flex justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Título de la página</span>
              <span className="mv-data text-[var(--text-secondary)]">{result.title?.length || 0} caracteres</span>
            </div>
            <p className="truncate rounded-xl border border-[var(--mv-hairline)] p-3 text-sm text-[var(--text-primary)]">{result.title || "No detectado"}</p>
          </div>
          <div>
            <div className="mb-1 flex justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Meta descripción</span>
              <span className="mv-data text-[var(--text-secondary)]">{result.metaDescription?.length || 0} caracteres</span>
            </div>
            <p className="whitespace-pre-wrap rounded-xl border border-[var(--mv-hairline)] p-3 text-sm leading-relaxed text-[var(--text-primary)]">{result.metaDescription || "No detectada"}</p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--mv-hairline)] p-3">
            <span className="text-sm text-[var(--text-secondary)]">Volumen de texto</span>
            <span className="mv-data text-sm font-semibold text-[var(--text-primary)]">{result.words} palabras</span>
          </div>
        </div>

        <div className={cn(TILE, "space-y-4 p-4 md:p-5")}>
          <p className={SUBHEAD}>
            <Layers className="h-4 w-4 text-gold" aria-hidden /> Imágenes y enlaces
          </p>
          <div>
            <div className="mb-1.5 flex justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Texto alternativo (ALT)</span>
              <span className="mv-data text-[var(--text-secondary)]">{result.images.withAlt}/{result.images.total}</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--mv-hairline)]">
              <div className="h-full bg-emerald-500" style={{ width: `${result.images.total > 0 ? (result.images.withAlt / result.images.total) * 100 : 100}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${result.images.total > 0 ? (result.images.withoutAlt / result.images.total) * 100 : 0}%` }} />
            </div>
            <div className="mv-data mt-1 flex justify-between text-[11px] text-[var(--text-secondary)]">
              <span>{result.images.withAlt} con ALT</span>
              <span>{result.images.withoutAlt} sin ALT</span>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between gap-2 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Enlaces</span>
              <span className="mv-data text-[var(--text-secondary)]">{result.links.internal + result.links.external} en total</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--mv-hairline)]">
              {(() => {
                const totalL = result.links.internal + result.links.external;
                const intW = totalL > 0 ? (result.links.internal / totalL) * 100 : 50;
                const extW = totalL > 0 ? (result.links.external / totalL) * 100 : 50;
                return (
                  <>
                    <div className="h-full bg-blue-500" style={{ width: `${intW}%` }} />
                    <div className="h-full bg-indigo-400" style={{ width: `${extW}%` }} />
                  </>
                );
              })()}
            </div>
            <div className="mv-data mt-1 flex justify-between text-[11px] text-[var(--text-secondary)]">
              <span>{result.links.internal} internos</span>
              <span>{result.links.external} externos</span>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {[
              { label: "sitemap.xml", ok: result.technical.hasSitemap, missTone: "bg-red-500" },
              { label: "robots.txt", ok: result.technical.hasRobots, missTone: "bg-yellow-500" },
            ].map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 rounded-xl border border-[var(--mv-hairline)] p-3">
                <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", f.ok ? "bg-emerald-500" : f.missTone)} />
                <span className="min-w-0">
                  <span className="mv-data block truncate text-xs text-[var(--text-secondary)]">{f.label}</span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">{f.ok ? "Encontrado" : "Falta"}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Keywords */}
      {result.topWords && result.topWords.length > 0 && (
        <div className={cn(TILE, "space-y-3 p-4 md:p-5")}>
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <p className={SUBHEAD}>
              <Contrast className="h-4 w-4 text-gold" aria-hidden /> Palabras más repetidas
            </p>
            <span className="text-xs text-[var(--text-tertiary)]">Cantidad de apariciones</span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {result.topWords.map((item: any, i: number) => (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-[var(--mv-hairline)] py-1.5 pl-3 pr-1.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">{item.word}</span>
                <span className="mv-data rounded-md bg-[var(--mv-gold-wash)] px-1.5 py-0.5 text-xs font-semibold text-gold">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-3">
        <h4 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">Qué conviene hacer</h4>
        <ul className="space-y-2.5">
          {recommendations.map((rec, i) => {
            const isError = rec.type === "error";
            const isWarning = rec.type === "warning";
            const isSuccess = rec.type === "success";

            return (
              <li
                key={i}
                className={cn(
                  "flex gap-3 rounded-2xl border p-4 text-left md:gap-4 md:p-5",
                  isError ? "border-red-500/25 bg-red-500/[0.04]" : isWarning ? "border-yellow-500/25 bg-yellow-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    isError ? "bg-red-500/10 text-red-400" : isWarning ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400",
                  )}
                >
                  {isSuccess ? <Check className="h-4 w-4" /> : isError ? <Zap className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-sm font-semibold text-[var(--text-primary)]">{rec.title}</h5>
                    <span className={cn("text-xs font-semibold", isError ? "text-red-400" : isWarning ? "text-yellow-400" : "text-emerald-400")}>
                      {isError ? "Crítico" : isWarning ? "Para optimizar" : "Bien"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{rec.desc}</p>
                  <div className="mt-2 rounded-xl border border-[var(--mv-hairline)] bg-[var(--color-bg-primary)] p-3">
                    <p className="mb-0.5 text-xs font-medium text-[var(--text-secondary)]">{isSuccess ? "Valor actual" : "Qué hacer"}</p>
                    <p className={cn("break-words text-sm", isSuccess ? "mv-data text-[var(--text-primary)]" : "font-medium text-[var(--text-primary)]")}>{rec.solution}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}


const PRICE_CATEGORY_LABELS: Record<string, string> = {
  "desarrollo web": "Desarrollo Web",
  "diseño": "Diseño UI/UX y Gráfico",
  "marketing": "Marketing Digital",
  "seo": "Optimización SEO",
};
const PRICE_REGION_LABELS: Record<string, string> = {
  "global": "Internacional / Global",
  "bolivia": "Bolivia",
  "mexico": "México",
  "argentina": "Argentina",
  "chile": "Chile",
};
const PRICE_DELIVERY_LABELS: Record<string, string> = {
  "básico": "Básico (Tarifa Ajustada)",
  "basico": "Básico (Tarifa Ajustada)",
  "estándar": "Estándar (Recomendado)",
  "estandar": "Estándar (Recomendado)",
  "premium": "Premium (Complejo / Urgente)",
};

function priceLabels(result: any) {
  const delivery = String(result.deliveryType || "");
  return {
    category: PRICE_CATEGORY_LABELS[result.category] || result.category,
    region: PRICE_REGION_LABELS[result.region] || result.region,
    delivery: PRICE_DELIVERY_LABELS[delivery] || delivery,
    experienceAdjustment: result.experienceYears >= 5 ? "+35% (Senior)" : result.experienceYears >= 2 ? "+15% (Semi-Senior)" : "Tarifa Base (Junior)",
    deliveryAdjustment: delivery.includes("premium") ? "+35% (Complejidad/Urgencia)" : delivery.includes("básico") || delivery.includes("basico") ? "-10% (Básico)" : "Tarifa Estándar",
  };
}

function renderPrice(result: any) {
  const { category: formattedCat, region: formattedReg, delivery: formattedDel, experienceAdjustment: expMult, deliveryAdjustment: delMult } = priceLabels(result);

  return (
    <div className="space-y-4 text-left">
      {/* Hourly rate */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Tarifa por hora sugerida</p>
          <p className="text-xs text-[var(--text-secondary)]">Según tu experiencia, el mercado y la complejidad.</p>
        </div>
        <p className="shrink-0">
          <span className="mv-data text-4xl font-semibold tracking-tight text-[var(--text-primary)]">${result.hourly}</span>
          <span className="mv-data ml-1.5 text-sm text-[var(--text-secondary)]">USD/h</span>
        </p>
      </div>

      {/* Project ranges */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Precio del proyecto completo <span className="mv-data font-normal text-[var(--text-secondary)]">({result.hours} h)</span>
        </h4>
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Mínimo", note: "Para proyectos simples o clientes que recién empiezan.", value: result.min, featured: false },
            { label: "Promedio", note: "Tarifa de mercado para un servicio profesional.", value: result.avg, featured: true },
            { label: "Premium", note: "Para desarrollos complejos, urgentes o agencias.", value: result.premium, featured: false },
          ].map((tier) => (
            <div
              key={tier.label}
              className={cn(
                "flex flex-col justify-between gap-4 rounded-2xl border p-4 md:p-5",
                tier.featured ? "border-[var(--color-border-gold)] bg-[var(--color-bg-primary)] shadow-[0_0_0_1px_var(--color-border-gold)]" : "border-[var(--mv-hairline)] bg-[var(--mv-panel)]",
              )}
            >
              <dt>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{tier.label}</span>
                  {tier.featured ? <span className="mv-chip mv-chip-gold h-6 px-2 text-[11px]">Recomendado</span> : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--text-secondary)]">{tier.note}</span>
              </dt>
              <dd className="border-t border-[var(--mv-hairline)] pt-3">
                <span className={cn("mv-data text-2xl font-semibold", tier.featured ? "text-gold" : "text-[var(--text-primary)]")}>${tier.value}</span>
                <span className="mv-data ml-1 text-xs text-[var(--text-secondary)]">USD</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Stage breakdown */}
      <div className={cn(TILE, "space-y-4 p-4 md:p-5")}>
        <div className="flex items-center justify-between gap-3">
          <p className={SUBHEAD}>Cómo repartir el precio promedio</p>
          <span className="text-xs text-[var(--text-tertiary)]">Proporción de referencia</span>
        </div>
        <ul className="space-y-3.5">
          {[
            { stage: 'Planificación y concepto', pct: 20, amount: Math.round(result.avg * 0.20), color: 'bg-blue-500' },
            { stage: 'Desarrollo y ejecución', pct: 60, amount: Math.round(result.avg * 0.60), color: 'bg-gold' },
            { stage: 'Pruebas, ajustes y entrega', pct: 20, amount: Math.round(result.avg * 0.20), color: 'bg-emerald-500' }
          ].map((item) => (
            <li key={item.stage} className="space-y-1.5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-[var(--text-secondary)]">
                  {item.stage} <span className="mv-data text-[var(--text-tertiary)]">· {item.pct}%</span>
                </span>
                <span className="mv-data shrink-0 font-semibold text-[var(--text-primary)]">${item.amount}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--mv-hairline)]">
                <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Inputs summary */}
      <div className={cn(TILE, "p-4 md:p-5")}>
        <p className={cn(SUBHEAD, "mb-3")}>Con qué datos se calculó</p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[
            { label: "Rubro", value: formattedCat },
            { label: "Mercado", value: formattedReg },
            { label: "Horas", value: `${result.hours} horas`, data: true },
            { label: "Entrega", value: formattedDel },
            { label: "Ajuste por experiencia", value: expMult, data: true },
            { label: "Ajuste por complejidad", value: delMult, data: true },
          ].map((row) => (
            <div key={row.label} className="flex flex-col-reverse gap-0.5">
              <dt className="text-xs text-[var(--text-secondary)]">{row.label}</dt>
              <dd className={cn("text-[var(--text-primary)]", row.data && "mv-data")}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function generatePalette(base: string, mode: string) {
  const hexToHsl = (hex: string) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };
  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  const baseHsl = hexToHsl(base);
  const offsets = mode === 'monocromática' ? [0, 8, -8, 16, -16] : mode === 'análoga' ? [0, 20, -20, 40, -40] : mode === 'triádica' ? [0, 120, 240, 40, -40] : [0, 180, 30, 210, -30];
  return offsets.map((offset, index) => {
    const h = (baseHsl.h + offset + 360) % 360;
    const s = Math.max(20, Math.min(90, baseHsl.s + (index % 2 === 0 ? 0 : 6)));
    const l = Math.max(18, Math.min(92, baseHsl.l + (index - 2) * 6));
    return hslToHex(h, s, l);
  });
}
// creado por pato dev y askforvini
