"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ArrowLeft,
  ChevronRight,
  Package,
  Calendar,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  LifeBuoy,
  FileText,
  RefreshCcw,
  Send,
  X,
  Loader2,
  ChevronDown
} from "@/components/icons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ButtonLink, Container, Section, buttonClass } from "@/components/site/primitives";
import { AppHeader } from "@/components/app-shell/AppPage";
import { ReceiptTemplate } from "@/components/checkout/ReceiptTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

interface PedidosClientProps {
  user: any;
  purchases: any[];
  sales: any[];
  spacePurchases: any[];
  spaceSales: any[];
  transactions: any[];
  tickets: any[];
  initialTab?: 'purchases' | 'sales' | 'transactions' | 'tickets';
}

export default function PedidosClient({ 
  user,
  purchases, 
  sales, 
  spacePurchases, 
  spaceSales, 
  transactions,
  tickets: initialTickets,
  initialTab = 'purchases'
}: PedidosClientProps) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales' | 'transactions' | 'tickets'>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [tickets, setTickets] = useState(initialTickets);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedItemForTicket, setSelectedItemForTicket] = useState<any>(null);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "", category: "PAYMENT_ERROR" });
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const allPurchases = [...purchases, ...spacePurchases].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const allSales = [...sales, ...spaceSales].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredItems = () => {
    let items: any[] = [];
    if (activeTab === 'purchases') items = allPurchases;
    else if (activeTab === 'sales') items = allSales;
    else if (activeTab === 'transactions') items = transactions;
    else if (activeTab === 'tickets') items = tickets;
    
    if (searchQuery) {
      items = items.filter((item: any) => {
        const title = item.service?.title || item.space?.title || item.subject || item.stripeId || "";
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    return items;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
      case 'PAGADO':
      case 'CONFIRMED':
        return 'border-green-500/25 bg-green-500/10 text-green-400';
      case 'PENDING':
        return 'border-yellow-500/25 bg-yellow-500/10 text-yellow-400';
      case 'EXPIRED':
      case 'EXPIRADO':
      case 'FAILED':
        return 'border-red-500/25 bg-red-500/10 text-red-400';
      case 'CANCELLED':
        return 'border-red-500/25 bg-red-500/10 text-red-400';
      default:
        return 'mv-chip-gold';
    }
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    EXPIRADO: "Expirado",
    EXPIRED: "Expirado",
    PROCESANDO: "En curso",
    IN_PROGRESS: "En curso",
    PAGADO: "Pagado",
    PAID: "Pagado",
    COMPLETED: "Completado",
    SUCCESS: "Exitoso",
    CANCELLED: "Cancelado",
    IN_REVIEW: "En revisión",
    REVISION: "Con cambios",
    DISPUTED: "En disputa",
    CONFIRMED: "Confirmada",
    ACTIVE: "Activa",
    FAILED: "Fallido",
    REFUNDED: "Reembolsado",
    OPEN: "Abierto",
    RESOLVED: "Resuelto",
    CLOSED: "Cerrado",
  };

  const getDisplayStatus = (item: any) => {
    if (item.status === 'PENDING') {
      const created = new Date(item.createdAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - created) / (1000 * 60);
      
      // Verificamos si hay algún indicio de pago
      const hasPayment = item.stripeId || item.paymentId;

      if (diffMinutes > 20 && !hasPayment) return 'EXPIRADO';
      return 'PENDING';
    }
    if (item.status === 'IN_PROGRESS') return 'PROCESANDO';
    if (item.status === 'PAID') return 'PAGADO';
    return item.status;
  };

  const formatPrice = (price: any) => {
    return Number(price).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownloadReceipt = async (item: any) => {
    const data = {
      id: item.id.split('-')[0].toUpperCase(),
      date: formatDate(item.createdAt),
      title: item.service?.title || item.space?.title || "Servicio Digital",
      amount: Number(item.totalPrice || item.amount),
      currency: item.currency || 'USD',
      method: 'Tarjeta de Crédito (Stripe)',
      clientName: user.name,
      clientEmail: user.email,
      providerName: item.service?.provider?.name || item.space?.owner?.name || "Proveedor Mercav",
    };

    setReceiptData(data);
    setIsGenerating(true);

    // Wait for the template to render
    setTimeout(async () => {
      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`recibo-mercav-${data.id}.pdf`);
      }
      setIsGenerating(false);
      setReceiptData(null);
    }, 500);
  };

  const handleSubmitTicket = async () => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticketForm,
          // Solo los pagos (tienen stripeId) llevan transactionId, y es el id interno de la transacción.
          // Antes se mandaba el stripeId o el id del pedido y el servidor respondía 403.
          transactionId: selectedItemForTicket?.stripeId ? selectedItemForTicket.id : null,
          orderId: selectedItemForTicket?.serviceId ? selectedItemForTicket.id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setTickets([data.data, ...tickets]);
        setIsTicketModalOpen(false);
        setTicketForm({ subject: "", message: "", category: "PAYMENT_ERROR" });
        setSuccessMessage("Tu reporte ha sido enviado. Recibirás una respuesta en la sección de Tickets.");
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { value: "PAYMENT_ERROR", label: "Error en el Pago" },
    { value: "DOUBLE_PAYMENT", label: "Pago Duplicado" },
    { value: "FRAUD", label: "Sospecha de Fraude" },
    { value: "SCAM", label: "Estafa / No entrega" },
    { value: "TECHNICAL_ISSUE", label: "Problema Técnico" },
    { value: "OTHER", label: "Otro" }
  ];

  const tabs = [
    { id: 'purchases', label: 'Compras', icon: ShoppingBag },
    { id: 'sales', label: 'Ventas', icon: DollarSign },
    { id: 'transactions', label: 'Transacciones', icon: CreditCard },
    { id: 'tickets', label: 'Reportes', icon: LifeBuoy },
  ];

  const emptyStates: Record<string, { title: string; body: string; href?: string; cta: string }> = {
    purchases: {
      title: "Todavía no tenés compras",
      body: "Cuando contrates un servicio o reserves un espacio, el pedido aparece acá con su estado y su recibo.",
      href: "/servicios",
      cta: "Explorar servicios",
    },
    sales: {
      title: "Todavía no tenés ventas",
      body: "Los pedidos de tus servicios y las reservas de tus espacios se listan acá. Publicá algo para empezar a recibirlos.",
      href: "/publicar",
      cta: "Nueva publicación",
    },
    transactions: {
      title: "Sin movimientos registrados",
      body: "Cada pago que hagas en Mercav queda registrado acá, con la opción de reportarlo si algo salió mal.",
      href: "/servicios",
      cta: "Explorar servicios",
    },
    tickets: {
      title: "No abriste ningún reporte",
      body: "Si tenés un problema con un pago o un pedido, usá Reportar en la compra o la transacción y seguí el caso desde acá.",
      cta: "Ver mis compras",
    },
  };

  const items = filteredItems();
  const empty = emptyStates[activeTab];
  const ticketCategoryLabel = (category: string) =>
    category === "PAYMENT_ERROR" ? "Error en el Pago" :
    category === "DOUBLE_PAYMENT" ? "Pago Duplicado" :
    category === "FRAUD" ? "Sospecha de Fraude" :
    category === "SCAM" ? "Estafa / No entrega" :
    category === "TECHNICAL_ISSUE" ? "Problema Técnico" :
    "Otro";

  return (
    <div className="w-full min-h-screen bg-bg-primary">
      <AppHeader
        title="Pedidos y pagos"
        lead="Tus compras, tus ventas, los pagos registrados y los reportes que abriste, en un mismo lugar."
        back={{ href: "/inicio#actividad", label: "Tu actividad" }}
      />

      <Section tight labelledBy="pedidos-lista" className="pt-0 md:pt-0">
        <Container>
          <h2 id="pedidos-lista" className="sr-only">Listado</h2>

          {/* Tabs + búsqueda */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="liquid-glass rounded-full p-1.5 lg:w-auto">
              <div role="group" aria-label="Secciones" className="scrollbar-hide flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`mv-focus flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold outline-none transition-colors duration-200 ${
                        active
                          ? 'bg-gold text-[var(--mv-on-gold)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--mv-panel-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" aria-hidden />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative w-full lg:w-80">
                <label htmlFor="pedidos-search" className="sr-only">Buscar por título o ID</label>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden />
                <input
                  id="pedidos-search"
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="Buscar por título o ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mv-input pl-11"
                />
              </div>
              <p className="shrink-0 text-sm text-[var(--text-secondary)]" aria-live="polite">
                <span className="mv-data text-[var(--text-primary)]">{items.length}</span> {items.length === 1 ? "resultado" : "resultados"}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <AnimatePresence mode="wait" initial={false}>
              {items.length > 0 ? (
                <motion.ul
                  key={activeTab + searchQuery}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex flex-col gap-3"
                >
                  {items.map((item: any) => {
                    const displayStatus = getDisplayStatus(item);
                    return (
                      <li key={item.id} className="mv-panel p-5 md:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                          {/* Info */}
                          <div className="flex min-w-0 items-start gap-4">
                            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold sm:flex">
                              {activeTab === 'transactions' ? <CreditCard className="h-5 w-5" aria-hidden /> : (item.service ? <Package className="h-5 w-5" aria-hidden /> : activeTab === 'tickets' ? <LifeBuoy className="h-5 w-5" aria-hidden /> : <Calendar className="h-5 w-5" aria-hidden />)}
                            </span>
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className={`mv-chip ${getStatusStyle(displayStatus)}`}>
                                  {statusLabels[displayStatus] || displayStatus}
                                </span>
                                <span className="mv-data inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                  <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDate(item.createdAt)}
                                </span>
                              </div>
                              <h3 className="text-base font-semibold text-[var(--text-primary)] md:text-lg">
                                {activeTab === 'transactions'
                                  ? `Pago por ${item.metadata?.title || "Servicio Digital"}`
                                  : (item.subject || item.service?.title || item.space?.title || "Sin título")}
                              </h3>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {activeTab === 'purchases' ? (
                                  <>Proveedor: <span className="font-medium text-[var(--text-primary)]">{item.service?.provider?.name || item.space?.owner?.name || "Proveedor"}</span></>
                                ) : activeTab === 'sales' ? (
                                  <>
                                    Cliente:{" "}
                                    {(item.client ?? item.advertiser)?.id ? (
                                      <Link href={`/perfil/${(item.client ?? item.advertiser).id}`} className="font-medium text-[var(--text-primary)] hover:underline mv-focus">
                                        {item.client?.name || item.advertiser?.name || "Cliente"}
                                      </Link>
                                    ) : (
                                      <span className="font-medium text-[var(--text-primary)]">{item.client?.name || item.advertiser?.name || "Cliente"}</span>
                                    )}
                                    {(item.client ?? item.advertiser)?.email ? <span className="text-[var(--text-tertiary)]"> · {(item.client ?? item.advertiser).email}</span> : null}
                                  </>
                                ) : activeTab === 'tickets' ? (
                                  <>Categoría: <span className="font-medium text-[var(--text-primary)]">{ticketCategoryLabel(item.category)}</span></>
                                ) : (
                                  <>Pago registrado en Mercav</>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Monto + acciones */}
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:gap-6">
                            {(item.totalPrice || item.amount) && (
                              <div className="sm:text-right">
                                <p className="text-xs text-[var(--text-secondary)]">{activeTab === 'tickets' ? 'Monto reportado' : 'Monto'}</p>
                                <p className="mv-data text-xl font-medium text-[var(--text-primary)]">{formatPrice(item.totalPrice || item.amount)}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                              {activeTab === 'purchases' && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(item)}
                                  disabled={isGenerating}
                                  className={buttonClass("ghost", "sm", "w-full sm:w-auto")}
                                >
                                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
                                  Recibo
                                </button>
                              )}
                              {(activeTab === 'transactions' || activeTab === 'purchases') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedItemForTicket(item);
                                    setTicketForm({ ...ticketForm, subject: `Problema con: ${item.metadata?.title || item.service?.title || "Pago"}` });
                                    setIsTicketModalOpen(true);
                                  }}
                                  className={buttonClass("ghost", "sm", "w-full text-red-400 sm:w-auto")}
                                >
                                  <ShieldAlert className="h-4 w-4" aria-hidden />
                                  Reportar
                                </button>
                              )}
                              {(item.status === 'FAILED' || displayStatus === 'EXPIRADO') && (
                                <ButtonLink href={`/checkout/${item.metadata?.type || 'servicio'}/${item.metadata?.id || ''}`} size="sm" className="w-full sm:w-auto">
                                  <RefreshCcw className="h-4 w-4" aria-hidden /> Reintentar
                                </ButtonLink>
                              )}
                              {(item.service || activeTab === 'tickets') && activeTab !== 'transactions' && (
                                <ButtonLink
                                  href={activeTab === 'tickets' ? `/dashboard/pedidos/tickets/${item.id}` : `/dashboard/pedidos/${item.id}`}
                                  tone="secondary"
                                  size="sm"
                                  className="w-full sm:w-auto"
                                >
                                  Detalles <ChevronRight className="h-4 w-4" aria-hidden />
                                </ButtonLink>
                              )}
                              {activeTab !== 'tickets' && (
                                <ButtonLink href="/mensajes" tone="secondary" size="sm" className="w-full sm:w-auto">
                                  <MessageSquare className="h-4 w-4" aria-hidden /> Chat
                                </ButtonLink>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </motion.ul>
              ) : (
                <motion.div
                  key={"empty-" + activeTab}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mv-panel flex flex-col items-start gap-4 p-8 md:p-12"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
                    <Package className="h-5 w-5" aria-hidden />
                  </span>
                  {searchQuery ? (
                    <>
                      <h3 className="mv-h3">Sin resultados para “{searchQuery}”</h3>
                      <p className="mv-body max-w-lg">Probá con otra palabra del título o con parte del ID.</p>
                      <button type="button" onClick={() => setSearchQuery("")} className={buttonClass("secondary", "md", "mt-2 w-full sm:w-auto")}>
                        Limpiar búsqueda
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="mv-h3">{empty.title}</h3>
                      <p className="mv-body max-w-lg">{empty.body}</p>
                      {empty.href ? (
                        <ButtonLink href={empty.href} className="mt-2 w-full sm:w-auto">{empty.cta}</ButtonLink>
                      ) : (
                        <button type="button" onClick={() => setActiveTab('purchases')} className={buttonClass("secondary", "md", "mt-2 w-full sm:w-auto")}>
                          {empty.cta}
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Container>
      </Section>

      {/* Modal de reporte */}
      <AnimatePresence>
        {isTicketModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsTicketModalOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ticket-modal-title"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mv-menu relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 id="ticket-modal-title" className="mv-h3">Reportar un problema</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Contanos qué pasó con esta transacción. El caso queda en la pestaña Reportes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  aria-label="Cerrar"
                  className={buttonClass("ghost", "sm", "w-10 shrink-0 px-0")}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div className="relative">
                  <p id="ticket-category-label" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Categoría</p>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isCategoryDropdownOpen}
                    aria-labelledby="ticket-category-label"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="mv-input flex items-center justify-between text-left"
                  >
                    <span>{categories.find(c => c.value === ticketForm.category)?.label}</span>
                    <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} aria-hidden />
                  </button>

                  <AnimatePresence>
                    {isCategoryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[160]" onClick={() => setIsCategoryDropdownOpen(false)} aria-hidden />
                        <motion.ul
                          role="listbox"
                          aria-labelledby="ticket-category-label"
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: EASE }}
                          className="absolute left-0 top-full z-[170] mt-2 w-full origin-top overflow-hidden rounded-2xl border border-[var(--mv-hairline-strong)] bg-bg-secondary p-1 shadow-2xl"
                        >
                          {categories.map((cat) => (
                            <li key={cat.value} role="option" aria-selected={ticketForm.category === cat.value}>
                              <button
                                type="button"
                                onClick={() => {
                                  setTicketForm({ ...ticketForm, category: cat.value });
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`flex h-11 w-full items-center rounded-xl px-3 text-left text-sm outline-none transition-colors duration-150 hover:bg-[var(--mv-panel-hover)] focus-visible:bg-[var(--mv-panel-hover)] ${ticketForm.category === cat.value ? 'font-semibold text-gold' : 'text-[var(--text-primary)]'}`}
                              >
                                {cat.label}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label htmlFor="ticket-subject" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Asunto</label>
                  <input
                    id="ticket-subject"
                    type="text"
                    autoComplete="off"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="mv-input"
                  />
                </div>
                <div>
                  <label htmlFor="ticket-message" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Qué pasó</label>
                  <textarea
                    id="ticket-message"
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    className="mv-input h-auto min-h-[120px] resize-y py-3"
                    placeholder="Contá qué esperabas y qué ocurrió."
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={() => setIsTicketModalOpen(false)} className={buttonClass("ghost", "md", "w-full sm:flex-1")}>
                  Cancelar
                </button>
                <button type="button" onClick={handleSubmitTicket} className={buttonClass("primary", "md", "w-full sm:flex-1")}>
                  <Send className="h-4 w-4" aria-hidden /> Enviar reporte
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmación */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-hidden
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="ticket-success-title"
              aria-describedby="ticket-success-body"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mv-menu relative w-full max-w-sm rounded-[1.75rem] p-8 text-center"
            >
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-400" aria-hidden />
              </span>
              <h2 id="ticket-success-title" className="mv-h3">Reporte enviado</h2>
              <p id="ticket-success-body" className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {successMessage}
              </p>
              <button type="button" onClick={() => setIsSuccessModalOpen(false)} className={buttonClass("primary", "md", "mt-8 w-full")}>
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Receipt Template for Generation */}
      <div className="fixed left-[-9999px] top-[-9999px]" aria-hidden>
        {receiptData && (
          <ReceiptTemplate ref={receiptRef} data={receiptData} />
        )}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
