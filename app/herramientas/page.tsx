"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  Star,
  ArrowRight,
  Store,
  Unlock,
  RefreshCw,
  Eye,
  Droplets,
  Sun,
  Moon,
  Type,
  Check,
  Contrast,
  Image as ImageIcon,
  FileDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toolPlanLabel } from "@/lib/toolPlanCatalog";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Toast } from "@/components/ui/toast";

const TOOLS = [
  { id: "roi-calculator", title: "Calculadora ROI", desc: "Proyecta el retorno de inversión de tus campañas con precisión quirúrgica.", icon: Calculator, color: "from-gold/20 to-gold/5", plan: toolPlanLabel("roi-calculator") },
  { id: "contract-generator", title: "Generador de Contratos", desc: "Crea contratos legales para freelancers y empresas en segundos.", icon: FileText, color: "from-white/10 to-white/5", plan: toolPlanLabel("contract-generator") },
  { id: "seo-analyzer", title: "Analizador SEO", desc: "Analiza el posicionamiento de cualquier dominio y recibe un reporte técnico.", icon: Globe, color: "from-gold/20 to-gold/5", plan: toolPlanLabel("seo-analyzer") },
  { id: "price-simulator", title: "Simulador de Precios", desc: "Calcula tarifas competitivas basadas en el mercado actual y tu experiencia.", icon: BarChart3, color: "from-white/10 to-white/5", plan: toolPlanLabel("price-simulator") },
  { id: "palette-generator", title: "Generador de Paletas", desc: "Crea esquemas de colores profesionales para tu marca o proyecto.", icon: Palette, color: "from-gold/20 to-gold/5", plan: toolPlanLabel("palette-generator") },
  { id: "prompt-generator", title: "Prompt Engineer", desc: "Genera prompts optimizados para Midjourney, ChatGPT y DALL-E.", icon: Sparkles, color: "from-white/10 to-white/5", plan: toolPlanLabel("prompt-generator") },
  { id: "pos-system", title: "Punto de Venta (POS)", desc: "Gestiona ventas, inventario y facturación de tu local físico con precisión elite.", icon: Store, color: "from-gold/20 to-gold/5", plan: toolPlanLabel("pos-system") },
];

type ToolId = typeof TOOLS[number]["id"];

export default function HerramientasPage() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) setUserPlan(json.data?.plan || null);
      })
      .catch(() => {});
  }, []);

  const selectedTool = useMemo(() => TOOLS.find((tool) => tool.id === activeTool) || null, [activeTool]);

  return (
    <div className="min-h-screen w-full bg-bg-primary pb-40 relative overflow-hidden">
      {/* Unified Brand Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gold/[0.02] blur-[150px]" />
      </div>

      <section className="relative pt-40 pb-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="flex items-center gap-3 mb-8 px-5 py-2 rounded-full bg-gold/10 border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
            >
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_#d4af37]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Ecosistema Funcional Elite</span>
            </motion.div>
            
            <h1 className="font-display text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-none">
              Soluciones <span className="text-transparent bg-clip-text bg-gradient-to-b from-gold via-yellow-200 to-gold/40">Técnicas</span>
            </h1>
            <p className="max-w-2xl text-xl text-gray-400 font-medium leading-relaxed">
              Herramientas de <span className="text-gold/80">precisión absoluta</span> diseñadas para potenciar la rentabilidad de tu empresa.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  if (tool.id === "pos-system") {
                    router.push("/dashboard/pos");
                  } else {
                    setActiveTool(tool.id);
                  }
                }}
                className="group relative flex items-center gap-8 p-10 rounded-[3rem] bg-bg-secondary border border-white/5 hover:bg-white/[0.04] hover:border-gold/20 transition-all duration-700 text-left overflow-hidden shadow-lg"
              >
                {/* Magnetic Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center group-hover:scale-110 group-hover:border-gold/50 transition-all duration-700 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                  <Icon className="h-9 w-9 text-gold group-hover:text-white transition-colors duration-500" />
                  <div className="absolute inset-0 bg-gold/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>

                <div className="relative flex-1">
                  <div className="flex flex-col gap-2 mb-3">
                    <h3 className="text-2xl font-black text-white group-hover:text-gold transition-all duration-500">{tool.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tool.plan.split("/").map((p) => (
                        <span key={p} className="px-3 py-1 rounded-lg bg-gold/5 text-[7px] font-black text-gold/80 uppercase tracking-[0.25em] border border-gold/20 group-hover:bg-gold group-hover:text-primary-foreground transition-all duration-500">
                          {p.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-md line-clamp-2 font-medium">{tool.desc}</p>
                </div>

                <div className="relative w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all duration-500">
                  <ArrowRight size={20} className="text-gray-600 group-hover:text-primary-foreground transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setActiveTool(null)} userPlan={userPlan} />
      )}
    </div>
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
    "pos-system": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
  };
  return access[toolId]?.includes(plan);
}

function ToolModal({ tool, onClose, userPlan }: { tool: (typeof TOOLS)[number]; onClose: () => void; userPlan: string | null }) {
  const allowed = !userPlan || matchesPlan(tool.id as ToolId, userPlan);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

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

  const handleExportPDF = (title: string) => {
    setToast({ visible: true, message: `Generando reporte PDF para: ${title}...`, type: 'info' });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2 md:p-10 backdrop-blur-2xl">
      <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] md:rounded-[3rem] bg-black/60 backdrop-blur-3xl border-none relative scrollbar-hide">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/0 via-gold/30 to-gold/0" />
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-5 md:p-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black text-gold/60">Mercav Functional Unit</span>
              <div className="h-px w-8 bg-gold/30" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tighter">{tool.title}</h2>
            <p className="mt-3 md:mt-4 max-w-3xl text-sm md:text-lg text-gray-500 leading-relaxed font-medium">{tool.desc}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-full md:w-auto text-center rounded-2xl bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gold hover:text-black transition-all"
          >
            Cerrar
          </button>
        </div>
        <div className="p-5 md:p-10 pt-0">
          {allowed ? <ToolBody toolId={tool.id as ToolId} onExport={() => handleExportPDF(tool.title)} /> : <LockedTool tool={tool} />}
        </div>
      </div>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function LockedTool({ tool }: { tool: (typeof TOOLS)[number] }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-primary p-8 text-center">
      <Lock className="mx-auto mb-4 h-12 w-12 text-gold" />
      <h3 className="text-xl font-semibold text-white">Herramienta bloqueada</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">Tu plan actual no permite usar <span className="text-white">{tool.title}</span>.</p>
      <p className="mt-3 text-sm text-gray-500">Plan requerido: {tool.plan}</p>
      <Button asChild className="mt-6 bg-gold text-black hover:bg-gold-light">
        <a href="/precios">Ver planes</a>
      </Button>
    </div>
  );
}

function ToolBody({ toolId, onExport }: { toolId: ToolId; onExport: () => void }) {
  if (toolId === "roi-calculator") return <ROIForm onExport={onExport} />;
  if (toolId === "contract-generator") return <ContractGenerator onExport={onExport} />;
  if (toolId === "seo-analyzer") return <SEOAnalyzer onExport={onExport} />;
  if (toolId === "price-simulator") return <PriceSimulator onExport={onExport} />;
  if (toolId === "palette-generator") return <PaletteGenerator onExport={onExport} />;
  return <PromptGenerator onExport={onExport} />;
}

function ROIForm({ onExport }: { onExport: () => void }) {
  const [form, setForm] = useState({ price: 0, audience: 0, conversion: 0, ticket: 0, days: 1 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const calculate = async () => {
    setLoading(true);
    const res = await fetch("/api/tools/roi-calculator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (json.success) setResult(json.data);
    setLoading(false);
  };

  const handleDownloadRoiPDF = () => {
    if (!result) return;
    
    setToast({ visible: true, message: "Generando proyección de ROI...", type: "info" });
    
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);

    let pageNum = 1;

    // Helper functions
    const addHeader = (firstPage = false) => {
      if (firstPage) {
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, pageWidth, 42, "F");
        doc.setFillColor(212, 175, 55);
        doc.rect(0, 42, pageWidth, 1.5, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(212, 175, 55);
        doc.text("INFORME DE RETORNO DE INVERSIÓN (ROI)", margin, 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 180, 180);
        doc.text(`Campaña: Proyección Financiera de Marketing`, margin, 26);
        doc.text(`Fecha del Reporte: ${new Date().toLocaleString()}`, margin, 32);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("MERCAV.LAT", pageWidth - margin - 20, 18);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(212, 175, 55);
        doc.text("ECOSISTEMA ELITE", pageWidth - margin - 20, 22);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text("INFORME DE RENDIMIENTO Y RETORNO (ROI)", margin, 12);
        doc.text("MERCAV.LAT", pageWidth - margin - 18, 12);
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(margin, 14, pageWidth - margin, 14);
      }
    };

    const addFooter = () => {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Este reporte representa un análisis matemático preliminar basado en las tasas ingresadas a través de MERCAV.LAT.", margin, pageHeight - 10);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Pág. ${pageNum}`, pageWidth - margin - 8, pageHeight - 10);
    };

    const checkPageBreak = (neededSpace: number, currentY: number): number => {
      if (currentY + neededSpace > pageHeight - 20) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(false);
        return 22;
      }
      return currentY;
    };

    const drawSectionHeader = (title: string, currentY: number): number => {
      let finalY = checkPageBreak(15, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(212, 175, 55);
      doc.text(title, margin, finalY);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.2);
      doc.line(margin, finalY + 2, pageWidth - margin, finalY + 2);
      return finalY + 8;
    };

    // Initialize Page 1
    addHeader(true);
    let y = 52;

    // 1. ROI KPI CARD BOX
    y = checkPageBreak(30, y);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "D");

    const isPositive = result.roi >= 0;
    doc.setFillColor(isPositive ? 16 : 239, isPositive ? 185 : 68, isPositive ? 129 : 68);
    doc.circle(margin + 12, y + 12, 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(isPositive ? "+" : "-", margin + 11, y + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("RETORNO DE INVERSIÓN (ROI) PROYECTADO", margin + 26, y + 9);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(isPositive ? 16 : 239, isPositive ? 120 : 50, isPositive ? 50 : 50);
    doc.text(`${result.roi?.toFixed(2) || 0}%`, margin + 26, y + 15.5);
    y += 32;

    // 2. FINANCIAL METRICS COMPARATIVE
    y = drawSectionHeader("1. RESUMEN DE PROYECCIÓN FINANCIERA", y);
    
    const financialRows = [
      { label: "Inversión Total de Campaña", value: `$${result.investment} USD`, desc: "Presupuesto total acumulado durante la campaña." },
      { label: "Ingresos Totales Estimados (Revenue)", value: `$${result.revenue} USD`, desc: "Monto total facturado en base al volumen de clientes." },
      { label: "Retorno Neto Proyectado", value: `$${(result.revenue - result.investment)} USD`, desc: "Ganancia o pérdida neta descontando el costo inicial." },
      { label: "Punto de Equilibrio (Break-Even)", value: `${result.breakEvenClients} ventas`, desc: "Cantidad mínima de ventas para cubrir la inversión inicial." }
    ];

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("MÉTRICA FINANCIERA", margin + 3, y + 4.5);
    doc.text("VALOR ESTIMADO", margin + 75, y + 4.5);
    doc.text("ANÁLISIS Y APLICACIÓN", margin + 110, y + 4.5);
    y += 6.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    financialRows.forEach((item, idx) => {
      const splitDesc = doc.splitTextToSize(item.desc, 58);
      const lineCount = splitDesc.length;
      const rowHeight = lineCount > 1 ? 7.5 + (lineCount - 1) * 3.5 : 7.5;

      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, y + rowHeight - 0.5, pageWidth - margin, y + rowHeight - 0.5);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(idx === 2 ? (isPositive ? 16 : 200) : 40, idx === 2 ? (isPositive ? 120 : 40) : 40, idx === 2 ? (isPositive ? 50 : 40) : 40);
      doc.text(item.label, margin + 3, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(idx === 2 ? (isPositive ? 16 : 200) : 50, idx === 2 ? (isPositive ? 120 : 50) : 50, idx === 2 ? (isPositive ? 50 : 50) : 50);
      doc.text(item.value, margin + 75, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(splitDesc, margin + 110, y + 4.5);
      y += rowHeight;
    });
    y += 10;

    // 3. INPUT PARAMETERS SECTION
    y = drawSectionHeader("2. PARÁMETROS E INPUTS INGRESADOS", y);

    const inputDataRows = [
      { label: "Presupuesto / Costo Diario", val: `$${form.price} USD` },
      { label: "Duración de la Campaña", val: `${form.days} días` },
      { label: "Alcance / Audiencia Diaria", val: `${form.audience} personas / día` },
      { label: "Tasa de Conversión Estimada", val: `${form.conversion}%` },
      { label: "Ticket Promedio de Venta", val: `$${form.ticket} USD` }
    ];

    inputDataRows.forEach((row) => {
      y = checkPageBreak(10, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`${row.label}:`, margin + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(row.val, margin + 65, y + 5);
      y += 6.5;
    });

    addFooter();

    doc.save(`analisis_roi_campaña.pdf`);
    setToast({ visible: true, message: "¡Informe de ROI descargado como PDF con éxito!", type: "success" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ToolPanel title="Datos de la campaña">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Presupuesto Diario (USD)</span>
              <span className="text-[7.5px] text-gray-600 block mb-1.5 ml-2 font-medium">Monto gastado al día en publicidad</span>
              <input 
                type="number" 
                min="0"
                value={form.price} 
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} 
                className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all font-mono font-bold" 
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Duración (Días)</span>
              <span className="text-[7.5px] text-gray-600 block mb-1.5 ml-2 font-medium">Total de días activos de campaña</span>
              <input 
                type="number" 
                min="1"
                value={form.days} 
                onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} 
                className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all font-mono font-bold" 
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Alcance / Audiencia Diaria</span>
            <span className="text-[7.5px] text-gray-600 block mb-1.5 ml-2 font-medium">Número estimado de personas que ven el anuncio al día</span>
            <input 
              type="number" 
              min="0"
              value={form.audience} 
              onChange={(e) => setForm({ ...form, audience: Number(e.target.value) })} 
              className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all font-mono font-bold" 
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Tasa Conversión (%)</span>
              <span className="text-[7.5px] text-gray-600 block mb-1.5 ml-2 font-medium">Porcentaje que termina comprando</span>
              <input 
                type="number" 
                min="0"
                max="100"
                step="0.01"
                value={form.conversion} 
                onChange={(e) => setForm({ ...form, conversion: Number(e.target.value) })} 
                className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all font-mono font-bold" 
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Ticket Promedio (USD)</span>
              <span className="text-[7.5px] text-gray-600 block mb-1.5 ml-2 font-medium">Precio promedio de venta de tu producto</span>
              <input 
                type="number" 
                min="0"
                value={form.ticket} 
                onChange={(e) => setForm({ ...form, ticket: Number(e.target.value) })} 
                className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all font-mono font-bold" 
              />
            </label>
          </div>

          <Button onClick={calculate} className="w-full h-14 rounded-2xl bg-gold text-primary-foreground hover:bg-gold-light font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Calcular Proyección ROI
          </Button>

          {result && (
            <Button onClick={handleDownloadRoiPDF} variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold flex items-center justify-center gap-2 transition-all">
              <Download size={16} /> Exportar Proyección PDF
            </Button>
          )}
        </div>
      </ToolPanel>

      <ToolPanel title="Reporte de Retorno">
        <div className="h-full flex flex-col">
          <div className="flex-1">
            {result ? <div className="space-y-4">{renderROI(result)}</div> : <EmptyState text="Configurá los datos de tu campaña y simulá la tasa de retorno de inversión detallada en tiempo real." />}
          </div>
        </div>
      </ToolPanel>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function ContractGenerator({ onExport }: { onExport: () => void }) {
  const [form, setForm] = useState({ freelancerName: "", clientName: "", serviceDescription: "", startDate: "", deliveryDate: "", price: "", currency: "USD", revisions: 2, paymentMethod: "50-50", confidentiality: true, ip: true, country: "Bolivia" });
  const [contractText, setContractText] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const generate = async () => {
    setLoading(true);
    const res = await fetch("/api/tools/contract-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (json.success) setContractText(json.data.contractText);
    setLoading(false);
  };

  const handleCopy = () => {
    if (!contractText) return;
    navigator.clipboard.writeText(contractText);
    setToast({ visible: true, message: "Contrato copiado al portapapeles", type: "success" });
  };

  const handleDownloadPDF = () => {
    if (!contractText) return;
    
    setToast({ visible: true, message: "Generando PDF legal del contrato...", type: "info" });
    
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2); // 170 mm
    
    const addHeader = (pageNum: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("CONTRATO DE PRESTACIÓN DE SERVICIOS - MERCAV.LAT", margin, 12);
      doc.text(`Pág. ${pageNum}`, pageWidth - margin - 10, 12);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, 14, pageWidth - margin, 14);
    };

    const addFooter = () => {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text("Este documento constituye un acuerdo preliminar generado a través de la plataforma MERCAV.LAT.", margin, pageHeight - 12);
    };

    let pageNum = 1;
    addHeader(pageNum);
    addFooter();

    let y = 25;
    const paragraphs = contractText.split("\n");
    
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim() === "") {
        y += 5;
        return;
      }
      
      const isTitle = paragraph.startsWith("CONTRATO DE PRESTACIÓN") || paragraph.toUpperCase() === paragraph && paragraph.length < 50;
      const isHeader = paragraph.startsWith("CLÁUSULA") || paragraph.startsWith("PRIMERA:") || paragraph.startsWith("SEGUNDA:") || paragraph.startsWith("TERCERA:") || paragraph.startsWith("CUARTA:") || paragraph.startsWith("QUINTA:") || paragraph.startsWith("SEXTA:") || paragraph.startsWith("SÉPTIMA:") || paragraph.startsWith("DECLARACIONES:");
      
      if (isTitle) {
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
      } else if (isHeader) {
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
      }
      
      const wrappedLines = doc.splitTextToSize(paragraph, contentWidth);
      
      wrappedLines.forEach((line: string) => {
        if (y > pageHeight - 25) {
          doc.addPage();
          pageNum++;
          addHeader(pageNum);
          addFooter();
          y = 25;
          
          if (isTitle) {
            doc.setFont("times", "bold");
            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);
          } else if (isHeader) {
            doc.setFont("times", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
          } else {
            doc.setFont("times", "normal");
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
          }
        }
        
        doc.text(line, margin, y);
        y += 6;
      });
      
      y += 2;
    });
    
    doc.save(`contrato_${form.freelancerName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ToolPanel title="Formulario">
        <div className="space-y-4">
          {[
            ["freelancerName", "Nombre completo del freelancer"],
            ["clientName", "Nombre completo del cliente"],
            ["serviceDescription", "Descripción del servicio"],
            ["startDate", "Fecha de inicio"],
            ["deliveryDate", "Fecha de entrega"],
            ["price", "Precio total"],
            ["currency", "Moneda"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">{label}</span>
              <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition" />
            </label>
          ))}
          
          <CustomSelect
            label="País de aplicación"
            value={form.country}
            onChange={(val) => setForm({ ...form, country: val })}
            options={[
              { value: "Bolivia", label: "Bolivia" },
              { value: "Argentina", label: "Argentina" },
              { value: "Chile", label: "Chile" },
              { value: "Colombia", label: "Colombia" },
              { value: "México", label: "México" },
              { value: "España", label: "España" },
              { value: "Otro", label: "Internacional" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Revisiones</span><input type="number" value={form.revisions} onChange={(e) => setForm({ ...form, revisions: Number(e.target.value) })} className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition" /></label>
            <label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Pago</span><input value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition" /></label>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-400 p-2">
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.confidentiality} onChange={(e) => setForm({ ...form, confidentiality: e.target.checked })} className="accent-gold w-4 h-4" />Confidencialidad</label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.checked })} className="accent-gold w-4 h-4" />Propiedad intelectual</label>
          </div>
          <Button onClick={generate} className="w-full h-14 rounded-2xl bg-gold text-primary-foreground hover:bg-gold-light font-black uppercase tracking-widest text-[10px]">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generar contrato</Button>
        </div>
      </ToolPanel>
      <ToolPanel title="Contrato generado">
        <div className="h-full flex flex-col">
          <div className="flex-1">
            {contractText ? <div className="p-6 rounded-2xl bg-black/40 border-none min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-hide text-sm leading-relaxed text-gray-300 font-mono">{contractText}</div> : <EmptyState text="Generá un contrato y luego descargalo o copialo." />}
          </div>
          <div className="mt-6 flex gap-4">
            <Button onClick={handleCopy} variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold"><Copy className="mr-2 h-4 w-4" />Copiar</Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold"><Download className="mr-2 h-4 w-4" />PDF</Button>
          </div>
        </div>
      </ToolPanel>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function SEOAnalyzer({ onExport }: { onExport: () => void }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const analyze = async () => {
    setLoading(true);
    const res = await fetch("/api/tools/seo-analyzer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    const json = await res.json();
    if (json.success) setResult(json.data);
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    
    setToast({ visible: true, message: "Generando informe técnico SEO...", type: "info" });
    
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);

    let pageNum = 1;

    // Helper functions for page structures
    const addHeader = (firstPage = false) => {
      if (firstPage) {
        // Dark executive header banner
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, pageWidth, 42, "F");
        
        doc.setFillColor(212, 175, 55); // Gold divider
        doc.rect(0, 42, pageWidth, 1.5, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(212, 175, 55);
        doc.text("INFORME TÉCNICO DE AUDITORÍA SEO", margin, 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 180, 180);
        const truncatedUrl = url.length > 85 ? url.substring(0, 82) + "..." : url;
        doc.text(`Sitio Auditado: ${truncatedUrl}`, margin, 26);
        doc.text(`Fecha del Reporte: ${new Date().toLocaleString()}`, margin, 32);
        
        // Brand logo/text in top right
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("MERCAV.LAT", pageWidth - margin - 20, 18);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(212, 175, 55);
        doc.text("ECOSISTEMA ELITE", pageWidth - margin - 20, 22);
      } else {
        // Light clean running header for inner pages
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        const displayUrlInner = url.replace(/https?:\/\//i, '');
        const truncatedUrlInner = displayUrlInner.length > 55 ? displayUrlInner.substring(0, 55) + "..." : displayUrlInner;
        doc.text(`INFORME TÉCNICO SEO — ${truncatedUrlInner}`, margin, 12);
        doc.text("MERCAV.LAT", pageWidth - margin - 18, 12);
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(margin, 14, pageWidth - margin, 14);
      }
    };

    const addFooter = () => {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Este informe constituye una auditoría técnica confidencial y privada en tiempo real a través de la plataforma MERCAV.LAT.", margin, pageHeight - 10);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Pág. ${pageNum}`, pageWidth - margin - 8, pageHeight - 10);
    };

    const checkPageBreak = (neededSpace: number, currentY: number): number => {
      if (currentY + neededSpace > pageHeight - 20) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(false);
        return 22; // Start position for inner pages
      }
      return currentY;
    };

    const drawSectionHeader = (title: string, currentY: number): number => {
      let finalY = checkPageBreak(15, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(212, 175, 55);
      doc.text(title, margin, finalY);
      
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.2);
      doc.line(margin, finalY + 2, pageWidth - margin, finalY + 2);
      return finalY + 8;
    };

    // Initialize Page 1
    addHeader(true);
    let y = 52;

    const scores = result.scores || {
      speed: result.loadTimeScore || 70,
      content: Math.min(100, Math.max(30, Math.round((result.words / 1000) * 100))),
      links: Math.min(100, Math.max(20, Math.round(((result.links.internal + result.links.external) / 20) * 100))),
      technical: (result.technical.hasSitemap ? 25 : 0) + (result.technical.hasRobots ? 25 : 0) + (result.images.withAlt === result.images.total ? 25 : 10) + 25
    };
    
    const overallScore = Math.round((scores.speed + scores.content + scores.links + scores.technical) / 4);

    // 1. OVERALL SCORE CARD BOX
    y = checkPageBreak(30, y);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "D");

    // Circular Score Simulator Text
    doc.setFillColor(
      overallScore >= 80 ? 16 : (overallScore >= 55 ? 245 : 239),
      overallScore >= 80 ? 185 : (overallScore >= 55 ? 158 : 68),
      overallScore >= 80 ? 129 : (overallScore >= 55 ? 11 : 68)
    );
    doc.circle(margin + 12, y + 12, 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(String(overallScore), margin + (overallScore >= 100 ? 9.5 : overallScore >= 10 ? 10.5 : 11.5), y + 15.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("PUNTUACIÓN GLOBAL DE OPTIMIZACIÓN", margin + 26, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    
    const ratingLabel = overallScore >= 80 ? "Excelente. El sitio cumple con la mayoría de lineamientos y estándares SEO." : overallScore >= 55 ? "Aceptable. Hay áreas clave de optimización que requieren mejoras prontas." : "Deficiente. Se han detectado fallos importantes de rastreo y metadatos.";
    const splitRating = doc.splitTextToSize(ratingLabel, contentWidth - 28);
    doc.text(splitRating, margin + 26, y + 15);
    y += 32;

    // 2. SUB-METRICAS TABLE
    y = checkPageBreak(25, y);
    const subCategories = [
      { label: "Rendimiento y Carga", score: `${scores.speed}/100`, desc: "Velocidad de respuesta del servidor y peso de la página." },
      { label: "Calidad de Contenido", score: `${scores.content}/100`, desc: "Volumen de palabras y optimización del corpus textual." },
      { label: "Enlaces e Integraciones", score: `${scores.links}/100`, desc: "Presencia y proporción de hipervínculos internos y externos." },
      { label: "Aspectos Técnicos", score: `${scores.technical}/100`, desc: "Indexabilidad de sitemap.xml, robots.txt e imágenes." }
    ];

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("CATEGORÍA DE AUDITORÍA", margin + 3, y + 4.5);
    doc.text("PUNTAJE", margin + 85, y + 4.5);
    doc.text("ESTADO / DETALLES", margin + 110, y + 4.5);
    y += 6.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    subCategories.forEach((cat) => {
      const splitDesc = doc.splitTextToSize(cat.desc, 58);
      const lineCount = splitDesc.length;
      const rowHeight = lineCount > 1 ? 7.5 + (lineCount - 1) * 3.5 : 7.5;

      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, y + rowHeight - 0.5, pageWidth - margin, y + rowHeight - 0.5);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(cat.label, margin + 3, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(overallScore >= 60 ? 30 : 200, overallScore >= 60 ? 120 : 30, 30);
      doc.text(cat.score, margin + 85, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(splitDesc, margin + 110, y + 4.5);
      y += rowHeight;
    });
    y += 10;

    // 3. SECCIÓN METAETIQUETAS Y TEXTO
    y = drawSectionHeader("1. CONTENIDO Y METAETIQUETAS", y);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Título de la Página:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const titleText = result.title || "No detectado";
    const splitTitle = doc.splitTextToSize(`"${titleText}"  (${titleText.length} caracteres)`, contentWidth - 50);
    doc.text(splitTitle, margin + 45, y);
    y += (splitTitle.length * 4.5) + 3;

    y = checkPageBreak(15, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Meta Descripción:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const descText = result.metaDescription || "No detectada";
    const splitDesc = doc.splitTextToSize(`"${descText}"  (${descText.length} caracteres)`, contentWidth - 50);
    doc.text(splitDesc, margin + 45, y);
    y += (splitDesc.length * 4.5) + 3;

    y = checkPageBreak(12, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Volumen de Contenido:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${result.words} palabras en el cuerpo del texto`, margin + 45, y);
    y += 12;

    // 4. SECCIÓN IMÁGENES Y ENLACES
    y = drawSectionHeader("2. AUDITORÍA DE MEDIOS Y ENLACES (LINKBUILDING)", y);

    y = checkPageBreak(12, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Imágenes en Página:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Total: ${result.images.total} imágenes  (Con atributo ALT: ${result.images.withAlt}  / Sin atributo ALT: ${result.images.withoutAlt})`, margin + 45, y);
    y += 5.5;

    y = checkPageBreak(12, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Enlaces Internos:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${result.links.internal} enlaces de navegación interna del dominio`, margin + 45, y);
    y += 5.5;

    y = checkPageBreak(12, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Enlaces Externos:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${result.links.external} enlaces salientes hacia otros sitios externos`, margin + 45, y);
    y += 12;

    // 5. SECCIÓN ASPECTOS TÉCNICOS
    y = drawSectionHeader("3. RASTREO E INDEXABILIDAD TÉCNICA", y);

    y = checkPageBreak(12, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Mapa de Sitio (Sitemap.xml):", margin, y);
    doc.setFont("helvetica", "bold");
    if (result.technical.hasSitemap) {
      doc.setTextColor(16, 185, 129); // Green
      doc.text("DETECTADO Y ACTIVO ✓", margin + 55, y);
    } else {
      doc.setTextColor(239, 68, 68); // Red
      doc.text("NO DETECTADO ✗", margin + 55, y);
    }
    y += 5.5;

    y = checkPageBreak(12, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text("Archivo robots.txt:", margin, y);
    doc.setFont("helvetica", "bold");
    if (result.technical.hasRobots) {
      doc.setTextColor(16, 185, 129);
      doc.text("CONFIGURADO CORRECTAMENTE ✓", margin + 55, y);
    } else {
      doc.setTextColor(245, 158, 11); // Amber
      doc.text("NO DETECTADO / INACTIVO ⚠️", margin + 55, y);
    }
    y += 12;

    // 6. SECCIÓN PALABRAS CLAVE FRECUENTES
    if (result.topWords && result.topWords.length > 0) {
      y = drawSectionHeader("4. FRECUENCIA Y PESO DE PALABRAS CLAVE", y);
      
      y = checkPageBreak(40, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Listado de palabras clave más frecuentes extraídas del corpus del sitio web:", margin, y);
      y += 5;

      const itemsPerRow = 5;
      const cardW = contentWidth / itemsPerRow;
      const cardH = 12;
      
      let rowX = margin;
      let startY = y;
      
      result.topWords.forEach((item: any, idx: number) => {
        if (idx > 0 && idx % itemsPerRow === 0) {
          rowX = margin;
          startY += cardH + 2.5;
        }
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(rowX, startY, cardW - 2.5, cardH, 1, 1, "F");
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.15);
        doc.roundedRect(rowX, startY, cardW - 2.5, cardH, 1, 1, "D");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(40, 40, 40);
        doc.text(item.word, rowX + 2.5, startY + 5.5, { maxWidth: cardW - 7 });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text(`Rep: ${item.count}`, rowX + 2.5, startY + 9.5);
        
        rowX += cardW;
      });
      y = startY + cardH + 12;
    }

    // 7. COMPREHENSIVE SEO ACTION CHECKLIST
    y = drawSectionHeader("5. PLAN DE ACCIÓN Y RECOMENDACIONES SEO", y);
    
    const pdfRecs: { title: string; solution: string; level: string }[] = [];
    
    const pTitleLen = result.title?.length || 0;
    if (!result.title || pTitleLen === 0) {
      pdfRecs.push({ title: "Falta etiqueta de Título", solution: "Añade la etiqueta <title> en el <head> de tu página (30-60 caracteres).", level: "CRÍTICO" });
    } else if (pTitleLen < 30 || pTitleLen > 60) {
      pdfRecs.push({ title: "Longitud de Título no estándar", solution: "Ajusta la extensión del título para que mida entre 30 y 60 caracteres.", level: "OPTIMIZAR" });
    }
    
    const pDescLen = result.metaDescription?.length || 0;
    if (!result.metaDescription || pDescLen === 0) {
      pdfRecs.push({ title: "Falta Meta Descripción", solution: "Escribe una meta descripción de 120-160 caracteres con llamados a la acción.", level: "CRÍTICO" });
    } else if (pDescLen < 120 || pDescLen > 160) {
      pdfRecs.push({ title: "Longitud de Meta Descripción incorrecta", solution: "Ajusta tu meta descripción para que posea exactamente entre 120 y 160 caracteres.", level: "OPTIMIZAR" });
    }
    
    if (result.words < 300) {
      pdfRecs.push({ title: "Contenido muy escaso en texto", solution: "Agrega contenido informativo y estructurado para superar las 300-500 palabras.", level: "CRÍTICO" });
    }
    
    if (result.images.withoutAlt > 0) {
      pdfRecs.push({ title: "Imágenes sin atributos ALT", solution: "Añade texto alternativo descriptivo (ALT) a las imágenes faltantes en tu HTML.", level: "OPTIMIZAR" });
    }
    
    if (!result.technical.hasSitemap) {
      pdfRecs.push({ title: "Ausencia de Sitemap.xml", solution: "Genera y publica un archivo sitemap.xml para acelerar el rastreo de Google.", level: "CRÍTICO" });
    }
    if (!result.technical.hasRobots) {
      pdfRecs.push({ title: "Robots.txt ausente o inaccesible", solution: "Sube un archivo robots.txt al directorio raíz con las directivas de indexación.", level: "OPTIMIZAR" });
    }

    if (pdfRecs.length === 0) {
      pdfRecs.push({
        title: "¡Felicitaciones! Cumples con todos los estándares SEO",
        solution: "Sigue monitorizando el rendimiento de tus palabras clave y la competencia.",
        level: "COMPLETO"
      });
    }

    pdfRecs.forEach((rec) => {
      y = checkPageBreak(25, y);
      
      doc.setFillColor(253, 253, 253);
      doc.rect(margin, y, contentWidth, 18, "F");
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.15);
      doc.rect(margin, y, contentWidth, 18, "D");
      
      if (rec.level === "CRÍTICO") {
        doc.setFillColor(239, 68, 68); // Red
      } else if (rec.level === "OPTIMIZAR") {
        doc.setFillColor(245, 158, 11); // Amber
      } else {
        doc.setFillColor(16, 185, 129); // Green
      }
      doc.roundedRect(margin + 3, y + 3, 16, 4.5, 0.5, 0.5, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(rec.level, margin + 4.5, y + 6.2);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(rec.title, margin + 22, y + 6.5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const splitSol = doc.splitTextToSize(`Acción: ${rec.solution}`, contentWidth - 28);
      doc.text(splitSol, margin + 22, y + 11.5);
      
      y += 21;
    });

    addFooter();

    const sanitizedUrl = url.replace(/https?:\/\//i, "").replace(/\W+/g, "_");
    doc.save(`reporte_seo_${sanitizedUrl}.pdf`);
    setToast({ visible: true, message: "¡Informe técnico de auditoría SEO descargado!", type: "success" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ToolPanel title="Analizar dominio">
        <div className="space-y-6">
          <label className="block">
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">URL del Sitio</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tusitio.com" className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition" />
          </label>
          <Button onClick={analyze} className="w-full h-14 rounded-2xl bg-gold text-primary-foreground hover:bg-gold-light font-black uppercase tracking-widest text-[10px]">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Analizar SEO
          </Button>
          {result && (
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold">
              Exportar Reporte PDF
            </Button>
          )}
        </div>
      </ToolPanel>
      <ToolPanel title="Reporte">
        {result ? <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide p-1">{renderSEO(result, url)}</div> : <EmptyState text="Ingresá una URL para recibir un reporte visual." />}
      </ToolPanel>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function PriceSimulator({ onExport }: { onExport: () => void }) {
  const [form, setForm] = useState({ category: "desarrollo web", region: "global", experienceYears: 2, deliveryType: "estándar", hours: 10 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });

  const simulate = async () => {
    setLoading(true);
    const res = await fetch("/api/tools/price-simulator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (json.success) setResult(json.data);
    setLoading(false);
  };

  const handleDownloadPricePDF = () => {
    if (!result) return;
    
    setToast({ visible: true, message: "Generando tarifario profesional...", type: "info" });
    
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);

    let pageNum = 1;

    // Helper functions
    const addHeader = (firstPage = false) => {
      if (firstPage) {
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, pageWidth, 42, "F");
        doc.setFillColor(212, 175, 55);
        doc.rect(0, 42, pageWidth, 1.5, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(212, 175, 55);
        doc.text("INFORME DE SIMULACIÓN DE TARIFARIO", margin, 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 180, 180);
        const displayCat = result.category.toUpperCase();
        const truncatedCat = displayCat.length > 55 ? displayCat.substring(0, 55) + "..." : displayCat;
        doc.text(`Categoría: ${truncatedCat}`, margin, 26);
        doc.text(`Fecha de Simulación: ${new Date().toLocaleString()}`, margin, 32);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("MERCAV.LAT", pageWidth - margin - 20, 18);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(212, 175, 55);
        doc.text("ECOSISTEMA ELITE", pageWidth - margin - 20, 22);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text("INFORME DE TARIFARIO Y PRECIOS SIMULADOS", margin, 12);
        doc.text("MERCAV.LAT", pageWidth - margin - 18, 12);
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(margin, 14, pageWidth - margin, 14);
      }
    };

    const addFooter = () => {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Este reporte representa una estimación teórica de precios basada en referencias de mercado analizadas a través de MERCAV.LAT.", margin, pageHeight - 10);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Pág. ${pageNum}`, pageWidth - margin - 8, pageHeight - 10);
    };

    const checkPageBreak = (neededSpace: number, currentY: number): number => {
      if (currentY + neededSpace > pageHeight - 20) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(false);
        return 22;
      }
      return currentY;
    };

    const drawSectionHeader = (title: string, currentY: number): number => {
      let finalY = checkPageBreak(15, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(212, 175, 55);
      doc.text(title, margin, finalY);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.2);
      doc.line(margin, finalY + 2, pageWidth - margin, finalY + 2);
      return finalY + 8;
    };

    // Initialize Page 1
    addHeader(true);
    let y = 52;

    // 1. TARIFA SUGERIDA MAIN SUMMARY BOX
    y = checkPageBreak(30, y);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "D");

    doc.setFillColor(212, 175, 55);
    doc.circle(margin + 12, y + 12, 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("$", margin + 10.5, y + 15.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("TARIFA HORARIA BASE SIMULADA", margin + 26, y + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(212, 175, 55);
    doc.text(`$${result.hourly} USD / hora`, margin + 26, y + 15.5);
    y += 32;

    // 2. DETALLE RANGOS SUGERIDOS
    y = drawSectionHeader("1. PRESUPUESTO PROYECTADO DEL PROYECTO", y);

    const ranges = [
      { label: "Rango Mínimo (Junior / Ajustado)", value: `$${result.min} USD`, desc: "Presupuestos ajustados de clientes medianos o portfolios iniciales." },
      { label: "Rango Promedio Sugerido", value: `$${result.avg} USD`, desc: "Valor justo del mercado para proyectos profesionales estándar." },
      { label: "Rango Premium (Elite / Especialista)", value: `$${result.premium} USD`, desc: "Proyectos de alta escala, alta complejidad o gran soporte de calidad." }
    ];

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("NIVEL DE SERVICIO", margin + 3, y + 4.5);
    doc.text("COSTO PROYECTADO", margin + 75, y + 4.5);
    doc.text("DESCRIPCIÓN Y APLICACIÓN", margin + 110, y + 4.5);
    y += 6.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    ranges.forEach((item, idx) => {
      const splitDesc = doc.splitTextToSize(item.desc, 58);
      const lineCount = splitDesc.length;
      const rowHeight = lineCount > 1 ? 7.5 + (lineCount - 1) * 3.5 : 7.5;

      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, y + rowHeight - 0.5, pageWidth - margin, y + rowHeight - 0.5);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(idx === 1 ? 212 : 40, idx === 1 ? 175 : 40, idx === 1 ? 55 : 40);
      doc.text(item.label, margin + 3, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(idx === 1 ? 212 : 50, idx === 1 ? 175 : 50, idx === 1 ? 55 : 50);
      doc.text(item.value, margin + 75, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(splitDesc, margin + 110, y + 4.5);
      y += rowHeight;
    });
    y += 10;

    // 3. DESGLOSE ETAPAS
    y = drawSectionHeader("2. DESGLOSE SUGERIDO DE COSTOS POR FASES (ETAPAS)", y);

    const phases = [
      { stage: "Etapa 1: Planificación, Diseño y Requerimientos", percent: "20%", amount: `$${Math.round(result.avg * 0.20)} USD`, desc: "Planificación comercial, diseño conceptual de UI/UX, wireframes y arquitectura." },
      { stage: "Etapa 2: Desarrollo, Ejecución Técnica y Producción", percent: "60%", amount: `$${Math.round(result.avg * 0.60)} USD`, desc: "Codificación técnica principal, estructuración del core de marketing o maquetación." },
      { stage: "Etapa 3: Control de Calidad, Feedback y Lanzamiento", percent: "20%", amount: `$${Math.round(result.avg * 0.20)} USD`, desc: "Pruebas de calidad del entregable, depuración, SEO básico y entrega al cliente." }
    ];

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("FASE DEL PROYECTO", margin + 3, y + 4.5);
    doc.text("PROPORCIÓN", margin + 75, y + 4.5);
    doc.text("COSTO ESTIMADO", margin + 100, y + 4.5);
    y += 6.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    phases.forEach((phase) => {
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 7, pageWidth - margin, y + 7);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(phase.stage, margin + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(phase.percent, margin + 75, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(phase.amount, margin + 100, y + 5);
      
      y += 7.5;
      
      y = checkPageBreak(12, y);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      const splitPhaseDesc = doc.splitTextToSize(`Fase: ${phase.desc}`, contentWidth - 10);
      doc.text(splitPhaseDesc, margin + 5, y + 4);
      y += 7.5;
    });
    y += 10;

    // 4. PARAMETROS DE ENTRADA
    y = drawSectionHeader("3. PARÁMETROS UTILIZADOS PARA LA SIMULACIÓN", y);

    const categoryLabels: Record<string, string> = {
      "desarrollo web": "Desarrollo Web",
      "diseño": "Diseño UI/UX y Gráfico",
      "marketing": "Marketing Digital y Copywriting",
      "seo": "Optimización SEO"
    };
    const regionLabels: Record<string, string> = {
      global: "Internacional / Global",
      bolivia: "Bolivia",
      mexico: "México",
      argentina: "Argentina",
      chile: "Chile"
    };

    const expText = result.experienceYears >= 5 ? `${result.experienceYears} años (Sólido / Senior)` : result.experienceYears >= 2 ? `${result.experienceYears} años (Intermedio / Semi-Senior)` : `${result.experienceYears} años (Junior / Iniciación)`;
    const delText = result.deliveryType.includes("premium") ? "Premium (Urgente o Complejo)" : (result.deliveryType.includes("básico") || result.deliveryType.includes("basico")) ? "Básico (Simplificado)" : "Estándar (Recomendado)";

    const parameters = [
      { label: "Categoría de Trabajo", val: categoryLabels[result.category] || result.category },
      { label: "Región Geográfica", val: regionLabels[result.region] || result.region },
      { label: "Experiencia Profesional", val: expText },
      { label: "Tipo de Entrega", val: delText },
      { label: "Horas Estimadas", val: `${result.hours} horas de dedicación` }
    ];

    parameters.forEach((param) => {
      y = checkPageBreak(10, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`${param.label}:`, margin + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(param.val, margin + 55, y + 5);
      y += 6.5;
    });

    addFooter();

    const sanitizedCategory = result.category.replace(/\s+/g, "_");
    doc.save(`simulacion_tarifario_${sanitizedCategory}.pdf`);
    setToast({ visible: true, message: "¡Tarifario descargado como PDF con éxito!", type: "success" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ToolPanel title="Datos del servicio">
        <div className="space-y-5">
          <CustomSelect
            label="Categoría del Servicio"
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
            options={[
              { value: "desarrollo web", label: "Desarrollo Web" },
              { value: "diseño", label: "Diseño UI/UX y Gráfico" },
              { value: "marketing", label: "Marketing Digital" },
              { value: "seo", label: "Optimización SEO" },
            ]}
          />

          <CustomSelect
            label="Región o Mercado de Referencia"
            value={form.region}
            onChange={(val) => setForm({ ...form, region: val })}
            options={[
              { value: "global", label: "Internacional / Global" },
              { value: "bolivia", label: "Bolivia" },
              { value: "mexico", label: "México" },
              { value: "argentina", label: "Argentina" },
              { value: "chile", label: "Chile" },
            ]}
          />

          <CustomSelect
            label="Tipo de Entrega / Complejidad"
            value={form.deliveryType}
            onChange={(val) => setForm({ ...form, deliveryType: val })}
            options={[
              { value: "básico", label: "Básico (Tarifa Ajustada)" },
              { value: "estándar", label: "Estándar (Recomendado)" },
              { value: "premium", label: "Premium (Complejo / Urgente)" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Años de Experiencia</span>
              <input
                type="number"
                min="0"
                max="30"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition font-mono font-bold"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Horas Estimadas</span>
              <input
                type="number"
                min="1"
                max="2000"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
                className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition font-mono font-bold"
              />
            </label>
          </div>

          <Button onClick={simulate} className="w-full h-14 rounded-2xl bg-gold text-primary-foreground hover:bg-gold-light font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simular Tarifario
          </Button>

          {result && (
            <Button onClick={handleDownloadPricePDF} variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold flex items-center justify-center gap-2 transition-all">
              <Download size={16} /> Exportar Tarifario PDF
            </Button>
          )}
        </div>
      </ToolPanel>

      <ToolPanel title="Reporte Tarifario">
        {result ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide p-1">
            {renderPrice(result)}
          </div>
        ) : (
          <EmptyState text="Configurá los datos de tu proyecto y simulá una proyección de cobros detallada en tiempo real." />
        )}
      </ToolPanel>

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function PaletteGenerator({ onExport }: { onExport: () => void }) {
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

  const handleDownloadAnalysisPDF = () => {
    setToast({ visible: true, message: "Generando análisis de colores...", type: "info" });
    const { jsPDF } = require("jspdf");
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

  const handleDownloadStyleGuidePDF = () => {
    setToast({ visible: true, message: "Generando Guía de Estilo de Marca...", type: "info" });
    const { jsPDF } = require("jspdf");
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
    <div className="space-y-6">
      {/* TOP ROW: Controls + Full-Width Swatches */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

        {/* Left: Controls Panel */}
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Palette size={16} className="text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Generador</h3>
              <p className="text-[9px] text-gray-500 font-medium">Estudio de color interactivo</p>
            </div>
          </div>

          {/* Base Color */}
          <div>
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Color base</span>
            <div className="flex gap-2">
              <div className="relative group">
                <input type="color" value={base} onChange={(e) => { setBase(e.target.value); handleColorChange(0, e.target.value); }} className="h-12 w-14 rounded-xl border border-white/10 bg-transparent cursor-pointer opacity-0 absolute inset-0 z-10" />
                <div className="h-12 w-14 rounded-xl border border-white/10 overflow-hidden group-hover:border-gold/30 transition-all shadow-lg" style={{ backgroundColor: base }}>
                  <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
              <input type="text" value={base.toUpperCase()} onChange={(e) => { const val = e.target.value; if (/^#?[0-9a-fA-F]{0,6}$/.test(val)) { const hex = val.startsWith('#') ? val : `#${val}`; setBase(hex); if (hex.length === 7) handleColorChange(0, hex); }}} className="flex-1 h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white outline-none font-mono font-bold text-sm focus:border-gold/40 transition-colors" />
            </div>
          </div>

          {/* Palette Mode */}
          <CustomSelect
            label="Modo de armonía"
            value={mode}
            onChange={(val) => { setMode(val); setTimeout(() => regenerate(), 50); }}
            options={[
              { value: "monocromática", label: "Monocromática" },
              { value: "complementaria", label: "Complementaria" },
              { value: "análoga", label: "Análoga" },
              { value: "triádica", label: "Triádica" },
            ]}
          />

          {/* Image Extractor */}
          <div>
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Extraer desde imagen</span>
            <label className="flex items-center gap-3 h-12 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 cursor-pointer hover:border-gold/30 hover:bg-gold/[0.02] transition-all group">
              <ImageIcon size={14} className="text-gray-500 group-hover:text-gold transition-colors" />
              <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{imagePreview ? "Imagen cargada ✓" : "Seleccionar archivo..."}</span>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && extractFromImage(e.target.files[0])} className="hidden" />
            </label>
          </div>

          {/* Regenerate */}
          <Button onClick={regenerate} className="w-full h-12 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black hover:from-gold-light hover:to-yellow-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-all hover:shadow-[0_4px_30px_rgba(212,175,55,0.4)]">
            <RefreshCw size={13} /> Regenerar
          </Button>
        </div>

        {/* Right: Full-Width Color Swatches */}
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] overflow-hidden">
          {/* Image preview banner */}
          {imagePreview && (
            <div className="relative h-20 overflow-hidden">
              <img src={imagePreview} className="w-full h-full object-cover" alt="Source" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 flex items-center justify-center">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/80">Colores extraídos de la imagen</span>
              </div>
            </div>
          )}

          {/* Color Bars - Full width horizontal swatches */}
          <div className="flex h-44">
            {colors.map((c, index) => (
              <motion.div
                key={index}
                className={`relative flex-1 cursor-pointer group transition-all duration-500 ${activeColorIndex === index ? 'flex-[1.6]' : 'flex-1'}`}
                onClick={() => setActiveColorIndex(index)}
                whileHover={{ flex: 1.3 }}
              >
                <div className="w-full h-full relative" style={{ backgroundColor: c.hex }}>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Active indicator */}
                  {activeColorIndex === index && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute top-0 left-0 right-0 h-1 bg-white"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Lock button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLock(index); }}
                    className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-all z-10 ${
                      c.locked
                        ? "bg-gold/30 border border-gold/50 text-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        : "bg-black/30 border border-white/10 text-white/50 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {c.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>

                  {/* Color picker trigger */}
                  <label className="absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md bg-black/30 border border-white/10 text-white/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10 hover:bg-black/50">
                    <Droplets size={11} />
                    <input type="color" value={c.hex} onChange={(e) => handleColorChange(index, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </label>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopySingle(c.hex, index); }}
                      className="flex items-center gap-1.5 text-[10px] font-mono font-black text-white/90 hover:text-gold transition-colors"
                    >
                      {copiedIndex === index ? <Check size={10} className="text-green-400" /> : <Copy size={9} className="opacity-50" />}
                      {c.hex.toUpperCase()}
                    </button>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{colorNames[index]}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Palette strip (continuous gradient preview) */}
          <div className="h-2 flex">
            {colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: `linear-gradient(to right, ${c.hex}, ${colors[(i + 1) % colors.length].hex})` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ANALYSIS + LIVE PREVIEW ROW */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

        {/* Color Analysis Panel */}
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.05]">
            {[
              { key: 'info' as const, label: 'Detalles', icon: Eye },
              { key: 'contrast' as const, label: 'Contraste', icon: Contrast },
              { key: 'harmony' as const, label: 'Armonía', icon: Sun },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setAnalysisTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                    analysisTab === tab.key ? 'text-gold' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                  {analysisTab === tab.key && (
                    <motion.div
                      layoutId="analysisTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {analysisTab === 'info' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Active color hero */}
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-2xl border border-white/10 shadow-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: activeColor.hex }}>
                    <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <h4 className="text-lg font-black text-white">{colorNames[activeColorIndex]}</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { label: 'HEX', value: activeColor.hex.toUpperCase() },
                        { label: 'RGB', value: hexToRgbString(activeColor.hex) },
                        { label: 'HSL', value: hexToHslString(activeColor.hex) },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-gray-600 w-7">{row.label}</span>
                          <span className="text-[11px] font-mono text-gray-300">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* HSL Bars */}
                <div className="space-y-3 pt-2">
                  {[
                    { label: 'Tono (Hue)', value: activeHsl.h, max: 360, unit: '°', gradient: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' },
                    { label: 'Saturación', value: activeHsl.s, max: 100, unit: '%', gradient: `linear-gradient(to right, hsl(${activeHsl.h}, 0%, ${activeHsl.l}%), hsl(${activeHsl.h}, 100%, ${activeHsl.l}%))` },
                    { label: 'Luminosidad', value: activeHsl.l, max: 100, unit: '%', gradient: `linear-gradient(to right, #000, hsl(${activeHsl.h}, ${activeHsl.s}%, 50%), #fff)` },
                  ].map(bar => (
                    <div key={bar.label} className="space-y-1">
                      <div className="flex justify-between text-[9px]">
                        <span className="font-bold text-gray-500">{bar.label}</span>
                        <span className="font-mono font-black text-white">{bar.value}{bar.unit}</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: bar.gradient }}>
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-black/30 shadow-lg" style={{ left: `${(bar.value / bar.max) * 100}%`, transform: 'translate(-50%, -50%)' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Luminance badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: activeLum > 0.5 ? '#fef3c720' : '#1a1a2e' }}>
                    {activeLum > 0.5 ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-blue-300" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400">Luminancia relativa</p>
                    <p className="text-xs font-mono font-bold text-white">{(activeLum * 100).toFixed(1)}% — {activeLum > 0.5 ? 'Color claro' : activeLum > 0.2 ? 'Color medio' : 'Color oscuro'}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {analysisTab === 'contrast' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <p className="text-[10px] font-bold text-gray-500 mb-3">Ratio de contraste de <span className="text-gold">{colorNames[activeColorIndex]}</span> contra los demás colores:</p>
                {colors.map((c, i) => {
                  if (i === activeColorIndex) return null;
                  const ratio = getContrastRatio(activeColor.hex, c.hex);
                  const rating = getWCAGRating(ratio);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/10" style={{ backgroundColor: c.hex }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{colorNames[i]}</span>
                          <span className="text-[10px] font-mono font-black text-white">{ratio.toFixed(2)}:1</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (ratio / 21) * 100)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: rating.color }}
                            />
                          </div>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ backgroundColor: rating.bg, color: rating.color }}>
                            {rating.label}
                          </span>
                        </div>
                      </div>
                      {/* Preview text on bg */}
                      <div className="w-16 h-8 rounded-lg flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ backgroundColor: c.hex, color: activeColor.hex }}>
                        Texto
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {analysisTab === 'harmony' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Color wheel visualization */}
                <div className="flex justify-center py-4">
                  <div className="relative w-48 h-48">
                    {/* Wheel background */}
                    <div className="w-full h-full rounded-full" style={{
                      background: 'conic-gradient(from 0deg, hsl(0, 80%, 50%), hsl(30, 80%, 50%), hsl(60, 80%, 50%), hsl(90, 80%, 50%), hsl(120, 80%, 50%), hsl(150, 80%, 50%), hsl(180, 80%, 50%), hsl(210, 80%, 50%), hsl(240, 80%, 50%), hsl(270, 80%, 50%), hsl(300, 80%, 50%), hsl(330, 80%, 50%), hsl(0, 80%, 50%))',
                      opacity: 0.3,
                    }} />
                    <div className="absolute inset-4 rounded-full bg-bg-primary border border-white/5" />

                    {/* Color dots on wheel */}
                    {colors.map((c, i) => {
                      const hsl = hexToHsl(c.hex);
                      const angle = (hsl.h - 90) * (Math.PI / 180);
                      const radius = 80;
                      const x = 96 + Math.cos(angle) * radius;
                      const y = 96 + Math.sin(angle) * radius;
                      return (
                        <motion.div
                          key={i}
                          className={`absolute w-6 h-6 rounded-full border-2 shadow-lg cursor-pointer z-10 ${i === activeColorIndex ? 'border-white scale-125' : 'border-white/30'}`}
                          style={{
                            backgroundColor: c.hex,
                            left: x - 12,
                            top: y - 12,
                            boxShadow: i === activeColorIndex ? `0 0 20px ${c.hex}80` : 'none',
                          }}
                          onClick={() => setActiveColorIndex(i)}
                          whileHover={{ scale: 1.3 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      );
                    })}

                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{mode}</p>
                        <p className="text-xs font-mono font-bold text-white mt-0.5">{activeHsl.h}°</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Harmony info */}
                <div className="grid grid-cols-2 gap-2">
                  {colors.map((c, i) => {
                    const hsl = hexToHsl(c.hex);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          i === activeColorIndex ? 'bg-white/[0.04] border-gold/20' : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03]'
                        }`}
                        onClick={() => setActiveColorIndex(i)}
                      >
                        <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ backgroundColor: c.hex }} />
                        <div>
                          <p className="text-[9px] font-black text-white">{colorNames[i]}</p>
                          <p className="text-[8px] font-mono text-gray-500">{hsl.h}° · {hsl.s}% · {hsl.l}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Live UI Preview */}
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Eye size={13} className="text-gold" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live UI Preview</span>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors[0].hex, boxShadow: `0 0 8px ${colors[0].hex}` }} />
          </div>

          <div className="p-6 space-y-4">
            {/* Simulated App Card */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.05]" style={{ backgroundColor: `${colors[3].hex}` }}>
              {/* Nav bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${colors[0].hex}15` }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: colors[0].hex }} />
                  <span className="text-[10px] font-black" style={{ color: colors[4].hex }}>MiApp</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[0].hex }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[1].hex }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[2].hex }} />
                </div>
              </div>

              {/* Content area */}
              <div className="p-4 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {['Ingresos', 'Usuarios', 'Ventas'].map((label, i) => (
                    <div key={label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: `${colors[i % 3].hex}10`, border: `1px solid ${colors[i % 3].hex}20` }}>
                      <p className="text-[15px] font-black" style={{ color: colors[i % 3].hex }}>
                        {['$24K', '1.2K', '847'][i]}
                      </p>
                      <p className="text-[7px] font-bold mt-0.5" style={{ color: `${colors[4].hex}80` }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Chart bars */}
                <div className="flex items-end gap-1.5 h-16 px-1">
                  {[65, 40, 80, 55, 90, 45, 70, 85, 60, 75, 50, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${h}%`,
                        backgroundColor: i === 11 ? colors[0].hex : `${colors[0].hex}${Math.round(30 + (h / 100) * 40).toString(16)}`,
                      }}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-transform hover:scale-[1.02]" style={{ backgroundColor: colors[0].hex, color: colors[3].hex }}>
                    Acción Principal
                  </button>
                  <button className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-transform hover:scale-[1.02]" style={{ borderColor: `${colors[1].hex}50`, color: colors[1].hex, backgroundColor: `${colors[1].hex}08` }}>
                    Secundario
                  </button>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 pt-1">
                  <span className="text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider" style={{ backgroundColor: `${colors[2].hex}15`, color: colors[2].hex }}>Premium</span>
                  <span className="text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider" style={{ backgroundColor: `${colors[0].hex}15`, color: colors[0].hex }}>Activo</span>
                  <span className="text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-wider" style={{ backgroundColor: `${colors[1].hex}15`, color: colors[1].hex }}>Nuevo</span>
                </div>
              </div>
            </div>

            {/* Text readability preview */}
            <div className="rounded-xl p-4 border border-white/[0.05] space-y-2" style={{ backgroundColor: colors[3].hex }}>
              <div className="flex items-center gap-2 mb-2">
                <Type size={11} className="text-gray-500" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Legibilidad tipográfica</span>
              </div>
              <p className="text-sm font-bold" style={{ color: colors[4].hex }}>Título principal con color claro</p>
              <p className="text-xs" style={{ color: colors[0].hex }}>Subtítulo destacado con color primario</p>
              <p className="text-[10px]" style={{ color: `${colors[4].hex}80` }}>Cuerpo de texto con baja opacidad para lectura cómoda.</p>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT ROW */}
      <div className="rounded-[2rem] bg-gradient-to-r from-white/[0.03] via-white/[0.04] to-white/[0.03] border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Download size={14} className="text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Exportar y Copiar</h3>
            <p className="text-[9px] text-gray-500 font-medium">Formatos de código y reportes de marca</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Variables CSS', handler: handleCopyCSS, icon: '{ }' },
            { label: 'Tailwind CSS', handler: handleCopyTailwind, icon: '🎨' },
            { label: 'Variables SCSS', handler: handleCopySCSS, icon: '$' },
            { label: 'JSON Completo', handler: handleCopyJSON, icon: '[ ]' },
          ].map(exp => (
            <Button
              key={exp.label}
              onClick={exp.handler}
              variant="outline"
              className="h-11 rounded-xl text-[9px] font-black uppercase tracking-widest border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.04] hover:border-gold/20 transition-all gap-2"
            >
              <span className="text-[11px] opacity-40">{exp.icon}</span>
              {exp.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button
            onClick={handleDownloadAnalysisPDF}
            className="h-12 rounded-xl bg-gradient-to-r from-gold/20 to-gold/10 text-gold hover:from-gold/30 hover:to-gold/20 font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2 border border-gold/20 hover:border-gold/40 transition-all"
          >
            <FileDown size={15} /> Exportar Análisis de Colores PDF
          </Button>
          <Button
            onClick={handleDownloadStyleGuidePDF}
            variant="outline"
            className="h-12 rounded-xl border-white/[0.08] text-gray-300 hover:bg-white/[0.04] hover:text-white font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2 transition-all"
          >
            <Download size={15} /> Exportar Brand Style Guide PDF
          </Button>
        </div>
      </div>

      <Toast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}

function PromptGenerator({ onExport }: { onExport: () => void }) {
  const [form, setForm] = useState({ tool: "Midjourney", category: "imagen de producto", description: "" });
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    const res = await fetch("/api/tools/prompt-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    if (json.success) setPrompts(json.data);
    setLoading(false);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ToolPanel title="Configuración">
        <div className="space-y-6">
          <CustomSelect
            label="Herramienta de IA"
            value={form.tool}
            onChange={(val) => setForm({ ...form, tool: val })}
            options={[
              { value: "Midjourney", label: "Midjourney" },
              { value: "ChatGPT", label: "ChatGPT" },
              { value: "DALL-E", label: "DALL-E" },
              { value: "Claude", label: "Claude" },
              { value: "Stable Diffusion", label: "Stable Diffusion" },
            ]}
          />
          <label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Categoría</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-2xl bg-bg-tertiary border border-white/10 px-6 h-14 text-white outline-none focus:border-gold/50 transition-all animate-transition" /></label>
          <label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Descripción Detallada</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-32 w-full rounded-[2rem] bg-bg-tertiary border border-white/10 p-6 text-white outline-none focus:border-gold/50 transition-all resize-none animate-transition" /></label>
          <Button onClick={generate} className="w-full h-14 rounded-2xl bg-gold text-primary-foreground hover:bg-gold-light font-black uppercase tracking-widest text-[10px]">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generar prompts</Button>
          {prompts.length > 0 && (
            <Button onClick={onExport} variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold">
              Exportar Prompts PDF
            </Button>
          )}
        </div>
      </ToolPanel>
      <ToolPanel title="Variaciones">
        {prompts.length ? <div className="space-y-4">{prompts.map((p) => <div key={p.label} className="rounded-2xl border border-border bg-bg-primary p-4"><div className="text-xs uppercase tracking-wide text-gold">{p.label}</div><p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{p.prompt}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="border-border text-white"><Copy className="mr-2 h-4 w-4" />Copiar</Button></div></div>)}</div> : <EmptyState text="Generá 3 variaciones optimizadas para la herramienta elegida." />}
      </ToolPanel>
    </div>
  );
}

function ToolPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] md:rounded-[2.5rem] bg-white/[0.02] p-4 md:p-8">
      <div className="flex items-center gap-3 mb-5 md:mb-8">
        <div className="h-1 w-6 bg-gold/50 rounded-full" />
        <h3 className="text-lg md:text-xl font-black text-white tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border-2 border-dashed border-white/5 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        <Zap className="text-gray-600" />
      </div>
      <p className="text-gray-500 max-w-xs leading-relaxed text-sm">{text}</p>
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

function renderROI(result: any) {
  const formatVal = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };
  const isPositive = result.roi >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col gap-1 border border-white/[0.03]">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Inversión Total</span>
          <span className="text-xl font-bold text-white font-mono">{formatVal(result.investment)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col gap-1 border border-white/[0.03]">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Retorno (ROI)</span>
          <span className={`text-xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{result.roi?.toFixed?.(2) || 0}%
          </span>
        </div>
      </div>
      
      <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col gap-1 border border-white/[0.03]">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ingresos Estimados</span>
        <span className="text-2xl font-black text-gold tracking-tight font-mono">{formatVal(result.revenue)}</span>
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.03] flex flex-col gap-1 border border-white/[0.03]">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Retorno Neto (Ganancia)</span>
        <span className={`text-2xl font-black tracking-tight font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatVal(result.revenue - result.investment)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-black/20 flex flex-col gap-1 text-center border border-white/[0.02]">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">Ventas Estimadas</span>
          <span className="text-sm font-bold text-white font-mono">{result.potentialClients} clientes</span>
        </div>
        <div className="p-4 rounded-2xl bg-black/20 flex flex-col gap-1 text-center border border-white/[0.02]">
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">Punto de Equilibrio</span>
          <span className="text-sm font-bold text-white font-mono">{result.breakEvenClients} ventas</span>
        </div>
      </div>
      
      <div className="mt-4 h-24 rounded-2xl bg-black/40 p-6 border border-white/[0.01]">
        <div className="flex h-full items-end gap-3">
          {[40, 70, 45, 90, 60, 85, 50].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 rounded-t-lg transition-all" 
              style={{ 
                height: `${h}%`,
                backgroundColor: i === 3 ? 'rgba(212, 175, 55, 0.8)' : 'rgba(212, 175, 55, 0.2)' 
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function renderSEO(result: any, url: string) {
  const scores = result.scores || {
    speed: result.loadTimeScore || 70,
    content: Math.min(100, Math.max(30, Math.round((result.words / 1000) * 100))),
    links: Math.min(100, Math.max(20, Math.round(((result.links.internal + result.links.external) / 20) * 100))),
    technical: (result.technical.hasSitemap ? 25 : 0) + (result.technical.hasRobots ? 25 : 0) + (result.images.withAlt === result.images.total ? 25 : 10) + 25
  };
  
  const overallScore = Math.round((scores.speed + scores.content + scores.links + scores.technical) / 4);

  // Dynamic status based on overallScore
  let scoreColor = "text-red-400";
  let scoreBg = "bg-red-500/[0.02] border-red-500/10";
  let scoreText = "Crítico";
  let scoreDesc = "Tu sitio tiene problemas graves que dañan el posicionamiento en Google.";
  
  if (overallScore >= 80) {
    scoreColor = "text-emerald-400";
    scoreBg = "bg-emerald-500/[0.02] border-emerald-500/10";
    scoreText = "Excelente";
    scoreDesc = "¡Excelente! Tu sitio está optimizado para los motores de búsqueda.";
  } else if (overallScore >= 55) {
    scoreColor = "text-yellow-400";
    scoreBg = "bg-yellow-500/[0.02] border-yellow-500/10";
    scoreText = "Aceptable";
    scoreDesc = "Buen trabajo, pero hay áreas clave de optimización que deberías mejorar.";
  }

  // Dynamic recommendations list
  const recommendations = [];
  
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

  return (
    <div className="space-y-6 text-left">
      {/* 1. TOP HEADER SUMMARY */}
      <div className={`rounded-3xl border p-6 flex flex-col md:flex-row items-center gap-6 ${scoreBg} transition-all`}>
        {/* Radial Progress Score */}
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="44" className="stroke-white/[0.06] fill-transparent" strokeWidth="8" />
            <motion.circle
              cx="56"
              cy="56"
              r="44"
              className="fill-transparent"
              strokeWidth="8"
              strokeDasharray="276.4"
              initial={{ strokeDashoffset: 276.4 }}
              animate={{ strokeDashoffset: 276.4 - (276.4 * overallScore) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                stroke: overallScore >= 80 ? "#10b981" : overallScore >= 55 ? "#f59e0b" : "#ef4444",
                strokeLinecap: "round"
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{overallScore}</span>
            <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Score</span>
          </div>
        </div>

        {/* Text overview */}
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h4 className="text-xl font-black text-white">Análisis de Dominio</h4>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              overallScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : overallScore >= 55 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {scoreText}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-300">{scoreDesc}</p>
          <p className="text-[10px] text-gray-500 font-mono">Objetivo auditado: {url}</p>
        </div>
      </div>

      {/* 2. SUB-SCORES METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Velocidad', score: scores.speed, icon: Zap, color: 'text-yellow-400', stroke: '#f59e0b' },
          { label: 'Contenido', score: scores.content, icon: FileText, color: 'text-emerald-400', stroke: '#10b981' },
          { label: 'Enlaces', score: scores.links, icon: Layers, color: 'text-blue-400', stroke: '#3b82f6' },
          { label: 'Técnico', score: scores.technical, icon: Shield, color: 'text-gold', stroke: '#d4af37' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{item.label}</span>
                <Icon size={14} className={item.color} />
              </div>
              <div>
                <span className="text-2xl font-black text-white">{item.score}</span>
                <span className="text-[10px] text-gray-600 font-bold">/100</span>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.stroke }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. GOOGLE SERP SIMULATOR */}
      <div className="rounded-2xl border border-white/[0.05] bg-black/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-gold" />
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Google SERP Mockup</span>
          </div>
          <span className="text-[7.5px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-500 uppercase tracking-widest font-black">Escritorio</span>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-2xl border border-gray-100 text-left font-sans">
          <div className="text-[11px] text-[#202124] flex items-center gap-1 truncate mb-0.5">
            <span className="text-xs">🌐</span>
            <span className="font-sans text-gray-500 font-normal">{url.replace(/https?:\/\//i, '').split('/')[0]}</span>
            <span className="text-gray-400 font-light">&gt; index</span>
          </div>
          <h4 className="text-[19px] text-[#1a0dab] hover:underline font-sans cursor-pointer truncate mt-0.5 leading-snug font-medium">
            {result.title || "Sin título"}
          </h4>
          <p className="text-xs text-[#4d5156] font-sans leading-relaxed mt-1 line-clamp-2">
            {result.metaDescription || "Escribe una meta descripción para mejorar el porcentaje de clics (CTR) en los resultados de búsqueda de Google..."}
          </p>
        </div>
      </div>

      {/* 4. DETAILS ACCORDION GRID */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Metas & Contents Card */}
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] p-6 space-y-4">
          <h5 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/[0.05] pb-3 flex items-center gap-2">
            <FileText size={13} className="text-gold" /> Contenido y Metas
          </h5>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-gray-500 font-bold">Título de la Página</span>
                <span className="font-mono text-gray-400">{result.title?.length || 0} caracteres</span>
              </div>
              <p className="text-xs text-white bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 font-medium truncate">
                {result.title || "No detectado"}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-gray-500 font-bold">Meta Descripción</span>
                <span className="font-mono text-gray-400">{result.metaDescription?.length || 0} caracteres</span>
              </div>
              <p className="text-xs text-gray-300 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 font-medium whitespace-pre-wrap leading-relaxed text-[11.5px]">
                {result.metaDescription || "No detectada"}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] text-gray-400 font-black uppercase">Volumen de Texto</span>
              <span className="text-xs font-mono font-bold text-white bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20">{result.words} palabras</span>
            </div>
          </div>
        </div>

        {/* Media & Links Card */}
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] p-6 space-y-4">
          <h5 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/[0.05] pb-3 flex items-center gap-2">
            <Layers size={13} className="text-gold" /> Medios y Enlaces
          </h5>
          <div className="space-y-4">
            {/* Images Alt bar */}
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-gray-500 font-bold">Atributos ALT en Imágenes</span>
                <span className="font-mono text-gray-300">{result.images.withAlt} con ALT / {result.images.total} total</span>
              </div>
              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${result.images.total > 0 ? (result.images.withAlt / result.images.total) * 100 : 100}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${result.images.total > 0 ? (result.images.withoutAlt / result.images.total) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 mt-1 font-mono font-bold">
                <span>{result.images.withAlt} optimizadas</span>
                <span>{result.images.withoutAlt} sin ALT</span>
              </div>
            </div>

            {/* Links Distribution */}
            <div>
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-gray-500 font-bold">Distribución de Enlaces (Link Building)</span>
                <span className="font-mono text-gray-300">{result.links.internal + result.links.external} enlaces</span>
              </div>
              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden flex">
                {(() => {
                  const totalL = result.links.internal + result.links.external;
                  const intW = totalL > 0 ? (result.links.internal / totalL) * 100 : 50;
                  const extW = totalL > 0 ? (result.links.external / totalL) * 100 : 50;
                  return (
                    <>
                      <div className="h-full bg-blue-500" style={{ width: `${intW}%` }} />
                      <div className="h-full bg-indigo-500" style={{ width: `${extW}%` }} />
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between text-[8px] text-gray-500 mt-1 font-mono font-bold">
                <span>{result.links.internal} Enlaces Internos</span>
                <span>{result.links.external} Enlaces Externos</span>
              </div>
            </div>

            {/* Sitemap/Robots quick check */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className={`w-2 h-2 rounded-full ${result.technical.hasSitemap ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                <div className="flex flex-col text-[8.5px]">
                  <span className="text-gray-500 font-bold">Sitemap.xml</span>
                  <span className="text-white font-mono">{result.technical.hasSitemap ? "Detectado" : "Falta"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className={`w-2 h-2 rounded-full ${result.technical.hasRobots ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"}`} />
                <div className="flex flex-col text-[8.5px]">
                  <span className="text-gray-500 font-bold">Robots.txt</span>
                  <span className="text-white font-mono">{result.technical.hasRobots ? "Detectado" : "Falta"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. KEYWORDS FREQUENCY GRID */}
      {result.topWords && result.topWords.length > 0 && (
        <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-3 gap-2">
            <h5 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Contrast size={13} className="text-gold" /> Densidad de Palabras Clave
            </h5>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-black">Top 10 Más Frecuentes</span>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {result.topWords.map((item: any, i: number) => {
              const maxCount = result.topWords[0]?.count || 1;
              const percent = Math.max(10, Math.round((item.count / maxCount) * 100));
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-gold/30 hover:bg-gold/[0.02] transition-all">
                  <span className="text-xs font-bold text-white font-mono">{item.word}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `rgba(212, 175, 55, ${percent / 100})` }} />
                  <span className="text-[10px] font-black font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded-md border border-gold/15">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. COMPREHENSIVE SEO ACTION CHECKLIST */}
      <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-5 md:p-6 space-y-4">
        <h5 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/[0.05] pb-3 flex items-center gap-2">
          <Check size={13} className="text-gold" /> Checklist de Optimización Recomendada
        </h5>
        
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const isError = rec.type === "error";
            const isWarning = rec.type === "warning";
            const isSuccess = rec.type === "success";

            return (
              <div key={i} className={`rounded-2xl border p-4 md:p-5 flex gap-4 text-left transition-all ${

                isError ? "bg-red-500/[0.02] border-red-500/10 hover:border-red-500/20" : isWarning ? "bg-yellow-500/[0.01] border-yellow-500/10 hover:border-yellow-500/20" : "bg-emerald-500/[0.01] border-emerald-500/10 hover:border-emerald-500/20"
              }`}>
                {/* Icon wrapper */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isError ? "bg-red-500/10 text-red-400" : isWarning ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {isSuccess ? <Check size={14} /> : isError ? <Zap size={14} /> : <Lock size={12} />}
                </div>

                {/* Text section */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h6 className="text-[13px] font-black text-white tracking-tight">{rec.title}</h6>
                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      isError ? "bg-red-500/25 text-red-200" : isWarning ? "bg-yellow-500/25 text-yellow-100" : "bg-emerald-500/25 text-emerald-200"
                    }`}>
                      {isError ? "Crítico" : isWarning ? "Optimizar" : "Aprobado"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{rec.desc}</p>
                  
                  <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[8px] font-black uppercase tracking-wider text-gray-500 mb-0.5">
                      {isSuccess ? "Valor actual" : "Plan de acción sugerido"}
                    </p>
                    <p className={`text-[11px] font-bold ${isSuccess ? "text-gray-300 font-mono" : "text-gold font-sans"}`}>
                      {rec.solution}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function renderPrice(result: any) {
  const categoryLabels: Record<string, string> = {
    "desarrollo web": "Desarrollo Web",
    "diseño": "Diseño UI/UX y Gráfico",
    "marketing": "Marketing Digital",
    "seo": "Optimización SEO"
  };
  const regionLabels: Record<string, string> = {
    "global": "Internacional / Global",
    "bolivia": "Bolivia",
    "mexico": "México",
    "argentina": "Argentina",
    "chile": "Chile"
  };
  const deliveryLabels: Record<string, string> = {
    "básico": "Básico (Tarifa Ajustada)",
    "basico": "Básico (Tarifa Ajustada)",
    "estándar": "Estándar (Recomendado)",
    "estandar": "Estándar (Recomendado)",
    "premium": "Premium (Complejo / Urgente)"
  };

  const formattedCat = categoryLabels[result.category] || result.category;
  const formattedReg = regionLabels[result.region] || result.region;
  const formattedDel = deliveryLabels[result.deliveryType] || result.deliveryType;

  // Multipliers display info
  const expMult = result.experienceYears >= 5 ? "+35% (Senior)" : result.experienceYears >= 2 ? "+15% (Semi-Senior)" : "Tarifa Base (Junior)";
  const delMult = result.deliveryType.includes("premium") ? "+35% (Complejidad/Urgencia)" : (result.deliveryType.includes("básico") || result.deliveryType.includes("basico")) ? "-10% (Básico)" : "Tarifa Estándar";

  return (
    <div className="space-y-6 text-left">
      {/* 1. HOURLY RATE MAIN KPI */}
      <div className="rounded-3xl border border-gold/15 bg-gold/[0.02] p-5 flex items-center justify-between shadow-[0_0_20px_rgba(212,175,55,0.03)]">
        <div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Tarifa por Hora Sugerida</span>
          <span className="text-[9px] font-bold text-gold/80 block mt-0.5">Basada en tu experiencia y región</span>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-gold font-mono">${result.hourly}</span>
          <span className="text-xs font-bold text-gray-400 ml-1">USD/hr</span>
        </div>
      </div>

      {/* 2. THREE RANGES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Min price card */}
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 flex flex-col justify-between min-h-[175px] hover:border-white/10 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500/60" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Rango Mínimo</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Presupuesto inicial para proyectos simples o clientes junior.</p>
          </div>
          <div className="pt-3 border-t border-white/[0.03] flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-black text-white font-mono transition-colors group-hover:text-gold">${result.min}</span>
            <span className="text-[9px] font-black text-gray-600 uppercase">USD</span>
          </div>
        </div>

        {/* Avg price card (Sugerido/Recomendado) */}
        <div className="rounded-3xl bg-gradient-to-b from-gold/[0.06] to-gold/[0.01] border border-gold/30 p-6 flex flex-col justify-between min-h-[175px] relative shadow-[0_10px_30px_rgba(212,175,55,0.05)] hover:border-gold/50 transition-all group">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_8px_#d4af37]" />
              <span className="text-[9px] font-black text-gold uppercase tracking-widest">Promedio Justo</span>
              <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded bg-gold text-black uppercase tracking-widest shadow-sm">
                Recomendado
              </span>
            </div>
            <p className="text-[10px] text-gray-300 font-medium leading-relaxed">Tarifa de mercado ideal para un servicio profesional equilibrado.</p>
          </div>
          <div className="pt-3 border-t border-gold/10 flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-black text-gold font-mono">${result.avg}</span>
            <span className="text-[9px] font-black text-gold/60 uppercase">USD</span>
          </div>
        </div>

        {/* Premium price card */}
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 flex flex-col justify-between min-h-[175px] hover:border-white/10 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Premium / Elite</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Tarifa corporativa óptima para desarrollos complejos o agencias.</p>
          </div>
          <div className="pt-3 border-t border-white/[0.03] flex items-baseline gap-1 mt-4">
            <span className="text-2xl font-black text-white font-mono transition-colors group-hover:text-gold">${result.premium}</span>
            <span className="text-[9px] font-black text-gray-600 uppercase">USD</span>
          </div>
        </div>
      </div>

      {/* 3. SIMULATED STAGE BREAKDOWN */}
      <div className="rounded-[2rem] bg-gradient-to-r from-white/[0.02] via-white/[0.03] to-white/[0.02] border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <span className="text-[10px] font-black text-white uppercase tracking-widest block">Desglose de Costos por Etapas</span>
          <span className="text-[8px] font-mono text-gray-500 uppercase font-bold">Proyección Promedio</span>
        </div>
        <div className="space-y-4">
          {[
            { stage: '1. Planificación, Wireframes y Concepto (20%)', amount: Math.round(result.avg * 0.20), color: 'bg-blue-500', width: 20 },
            { stage: '2. Desarrollo, Codificación y Ejecución (60%)', amount: Math.round(result.avg * 0.60), color: 'bg-gold', width: 60 },
            { stage: '3. Fase de Pruebas, Ajustes y Despliegue (20%)', amount: Math.round(result.avg * 0.20), color: 'bg-emerald-500', width: 20 }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-[9.5px]">
                <span className="text-gray-400 font-medium">{item.stage}</span>
                <span className="font-mono font-black text-white">${item.amount} USD</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.width}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PARAMETERS SUMMARY TABLE */}
      <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] p-5 space-y-3.5">
        <span className="text-[10px] font-black text-white uppercase tracking-widest block border-b border-white/[0.05] pb-2.5">Detalles del Simulador</span>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-[11px] font-medium leading-relaxed text-gray-400">
          <div>
            <span className="text-[8px] font-black text-gray-600 uppercase block mb-0.5">Categoría</span>
            <span className="text-white">{formattedCat}</span>
          </div>
          <div>
            <span className="text-[8px] font-black text-gray-600 uppercase block mb-0.5">Región</span>
            <span className="text-white">{formattedReg}</span>
          </div>
          <div>
            <span className="text-[8px] font-black text-gray-600 uppercase block mb-0.5">Horas Totales</span>
            <span className="text-white font-mono">{result.hours} horas</span>
          </div>
          <div>
            <span className="text-[8px] font-black text-gray-600 uppercase block mb-0.5">Tipo de Entrega</span>
            <span className="text-white">{formattedDel}</span>
          </div>
          <div>
            <span className="text-[8px] font-black text-gray-600 uppercase block mb-0.5">Multiplicador Experiencia</span>
            <span className="text-gold font-mono">{expMult}</span>
          </div>
          <div>
            <span className="text-[8px] font-black text-gray-600 uppercase block mb-0.5">Complejidad de Entrega</span>
            <span className="text-gold font-mono">{delMult}</span>
          </div>
        </div>
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
