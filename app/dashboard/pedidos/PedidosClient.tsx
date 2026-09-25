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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ReceiptTemplate } from "@/components/checkout/ReceiptTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

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
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'EXPIRED':
      case 'EXPIRADO':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
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
          transactionId: selectedItemForTicket?.stripeId || selectedItemForTicket?.id,
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

  return (
    <div className="w-full min-h-screen bg-bg-primary text-white pt-24 pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumbs & Header */}
        <div className="mb-12">
          <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-gold transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em] group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al Panel
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter mb-4">
            Gestión de <span className="text-gold">Pedidos</span>
          </h1>
          <p className="text-gray-500 text-lg">Historial completo de tus compras, ventas y movimientos financieros.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mb-10 p-2 bg-white/[0.03] border border-white/5 rounded-3xl w-fit">
          {[
            { id: 'purchases', label: 'Mis Compras', icon: ShoppingBag },
            { id: 'sales', label: 'Mis Ventas', icon: DollarSign },
            { id: 'transactions', label: 'Transacciones', icon: CreditCard },
            { id: 'tickets', label: 'Reportes y Tickets', icon: LifeBuoy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-gold text-primary-foreground shadow-lg shadow-gold/20' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por título o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 pl-16 pr-6 text-white focus:outline-none focus:border-gold/30 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-500">
            Total items: <span className="text-white font-mono">{filteredItems().length}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {filteredItems().length > 0 ? (
              <motion.div
                key={activeTab + searchQuery}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 gap-6"
              >
                {filteredItems().map((item: any, i: number) => (
                  <div key={item.id} className="group relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                      {/* Left Side: Info */}
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          {activeTab === 'transactions' ? <CreditCard size={32} /> : (item.service ? <Package size={32} /> : <Calendar size={32} />)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(getDisplayStatus(item))}`}>
                              {getDisplayStatus(item)}
                            </span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                              <Clock size={12} /> {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                            {activeTab === 'transactions' 
                              ? `Pago por ${item.metadata?.title || "Servicio Digital"}` 
                              : (item.subject || item.service?.title || item.space?.title || "Sin Título")}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {activeTab === 'purchases' ? (
                              <>Comprado a <span className="text-gray-300 font-bold">{item.service?.provider?.name || item.space?.owner?.name || "Proveedor"}</span></>
                            ) : activeTab === 'sales' ? (
                              <>Vendido a <span className="text-gray-300 font-bold">{item.client?.name || item.advertiser?.name || "Cliente"}</span></>
                            ) : activeTab === 'tickets' ? (
                               <>Categoría: <span className="text-gray-300">{
                                 item.category === "PAYMENT_ERROR" ? "Error en el Pago" :
                                 item.category === "DOUBLE_PAYMENT" ? "Pago Duplicado" :
                                 item.category === "FRAUD" ? "Sospecha de Fraude" :
                                 item.category === "SCAM" ? "Estafa / No entrega" :
                                 item.category === "TECHNICAL_ISSUE" ? "Problema Técnico" :
                                 "Otro"
                               }</span></>
                            ) : (
                              <>Procesado de forma segura vía Mercav Protocol</>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: Price & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
                        {(item.totalPrice || item.amount) && (
                          <div className="text-right">
                            <div className="text-2xl font-mono font-black text-gold mb-1">
                              {formatPrice(item.totalPrice || item.amount)}
                            </div>
                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                              {activeTab === 'tickets' ? 'Monto Reportado' : 'Pago Protegido'}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3 w-full sm:w-auto">
                          {activeTab === 'purchases' && (
                             <Button 
                              onClick={() => handleDownloadReceipt(item)}
                              disabled={isGenerating}
                              variant="outline" 
                              className="flex-1 sm:flex-initial rounded-xl border-gold/20 text-gold hover:bg-gold/5 h-12 px-6"
                             >
                               {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <FileText className="mr-2 w-4 h-4" />}
                               Recibo
                             </Button>
                          )}
                          {(activeTab === 'transactions' || activeTab === 'purchases') && (
                             <Button 
                              onClick={() => {
                                setSelectedItemForTicket(item);
                                setTicketForm({ ...ticketForm, subject: `Problema con: ${item.metadata?.title || item.service?.title || "Pago"}` });
                                setIsTicketModalOpen(true);
                              }}
                              variant="outline" 
                              className="flex-1 sm:flex-initial rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/5 h-12 px-6"
                             >
                               <ShieldAlert className="mr-2 w-4 h-4" />
                               Reportar
                             </Button>
                          )}
                          {(item.status === 'FAILED' || getDisplayStatus(item) === 'EXPIRADO') && (
                             <Button asChild className="flex-1 sm:flex-initial bg-foreground text-background hover:opacity-90 rounded-xl h-12 px-6 font-bold">
                               <Link href={`/checkout/${item.metadata?.type || 'servicio'}/${item.metadata?.id || ''}`}>
                                 <RefreshCcw className="mr-2 w-4 h-4" /> Reintentar
                               </Link>
                             </Button>
                          )}
                          {(item.service || activeTab === 'tickets') && activeTab !== 'transactions' && (
                             <Button asChild variant="outline" className="flex-1 sm:flex-initial rounded-xl border-white/5 bg-white/5 hover:bg-white/10 h-12 px-6">
                               <Link href={activeTab === 'tickets' ? `/dashboard/pedidos/tickets/${item.id}` : `/dashboard/pedidos/${item.id}`}>
                                 Detalles <ChevronRight className="ml-2 w-4 h-4" />
                               </Link>
                             </Button>
                          )}
                          {activeTab !== 'tickets' && (
                             <Button asChild className="flex-1 sm:flex-initial bg-gold text-primary-foreground hover:bg-gold-light rounded-xl h-12 px-6 font-bold">
                               <Link href="/mensajes">
                                 Chat <MessageSquare className="ml-2 w-4 h-4" />
                               </Link>
                             </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar (Mock) */}
                    {item.status === 'PENDING' && (
                      <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
                          <span>Progreso del Proyecto</span>
                          <span className="text-gold">30% completado</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gold w-[30%] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-700 mb-8">
                  <Package size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No se encontraron registros</h3>
                <p className="text-gray-600 max-w-sm mx-auto">Parece que aún no tienes actividad en esta sección. ¡Explora Mercav para comenzar!</p>
                <Button asChild className="mt-10 bg-gold text-primary-foreground rounded-2xl h-14 px-10 font-bold">
                  <Link href="/servicios">Explorar Servicios</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Modal for Tickets */}
        <AnimatePresence>
          {isTicketModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTicketModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-bg-secondary border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
              >
                {/* Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <LifeBuoy size={120} className="text-gold" />
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Reportar Problema</h2>
                    <p className="text-sm text-gray-400">Describe el problema que tuviste con esta transacción.</p>
                  </div>
                  <button onClick={() => setIsTicketModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 mt-8">
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Categoría</label>
                    <button 
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full bg-bg-primary border border-white/5 rounded-xl h-12 px-4 text-white flex items-center justify-between hover:border-gold/30 transition-all"
                    >
                      <span>{categories.find(c => c.value === ticketForm.category)?.label}</span>
                      <ChevronDown size={16} className={`text-gray-500 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[160]" onClick={() => setIsCategoryDropdownOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 w-full mt-2 bg-bg-secondary border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[170]"
                          >
                            {categories.map((cat) => (
                              <button
                                key={cat.value}
                                onClick={() => {
                                  setTicketForm({ ...ticketForm, category: cat.value });
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`w-full h-12 px-4 text-left text-sm hover:bg-gold hover:text-black transition-colors ${ticketForm.category === cat.value ? 'bg-white/5 text-gold' : 'text-gray-300'}`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Asunto</label>
                    <input 
                      type="text" 
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      className="w-full bg-bg-primary border border-white/5 rounded-xl h-12 px-4 text-white focus:outline-none focus:border-gold/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Mensaje Detallado</label>
                    <textarea 
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      className="w-full bg-bg-primary border border-white/5 rounded-xl p-4 text-white min-h-[120px] focus:outline-none focus:border-gold/30 resize-none transition-all"
                      placeholder="Explica qué sucedió..."
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsTicketModalOpen(false)} 
                    className="flex-1 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/20 h-14 font-bold text-gray-400 hover:text-white transition-all"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitTicket} 
                    className="flex-1 bg-gold text-primary-foreground hover:bg-gold-light rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-gold/20 hover:scale-[1.02] transition-all"
                  >
                    <Send className="mr-2 w-5 h-5" /> Enviar Reporte
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {isSuccessModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSuccessModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-bg-secondary border border-gold/20 rounded-[2.5rem] p-12 text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]"
              >
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                    <CheckCircle2 className="text-gold w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">¡Envío Exitoso!</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-10">
                  {successMessage}
                </p>
                <Button 
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="w-full bg-gold text-primary-foreground hover:bg-gold-light rounded-2xl h-14 font-black uppercase tracking-widest transition-all"
                >
                  Entendido
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Hidden Receipt Template for Generation */}
        <div className="fixed left-[-9999px] top-[-9999px]">
          {receiptData && (
            <ReceiptTemplate ref={receiptRef} data={receiptData} />
          )}
        </div>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
