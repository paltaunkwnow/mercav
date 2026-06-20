"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import POSHeader from '@/components/pos/POSHeader';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSCart from '@/components/pos/POSCart';
import POSInvoice from '@/components/pos/POSInvoice';
import POSPaymentModal from '@/components/pos/POSPaymentModal';
import { Loader2, Plus, LogOut, Wallet, ShieldAlert, CheckCircle2, X, Package, TrendingUp, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/ui/toast';

export default function POSTerminalPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [showCajaModal, setShowCajaModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState<any>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const currentSessionSalesTotal = session?.sales?.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0) || 0;

  useEffect(() => {
    if (showCajaModal || showCloseModal || showPaymentModal || lastSale) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCajaModal, showCloseModal, showPaymentModal, lastSale]);

  useEffect(() => {
    const init = async () => {
      try {
        const [configRes, productsRes, catsRes, sessionRes] = await Promise.all([
          fetch('/api/pos/config'),
          fetch('/api/pos/products'),
          fetch('/api/pos/categories'),
          fetch('/api/pos/sessions')
        ]);

        const [configData, productsData, catsData, sessionData] = await Promise.all([
          configRes.json(),
          productsRes.json(),
          catsRes.json(),
          sessionRes.json()
        ]);

        if (configData.success) setConfig(configData.data);
        if (productsData.success) setProducts(productsData.data);
        if (catsData.success) setCategories(catsData.data);
        if (sessionData.success) setSession(sessionData.data);

        if (!sessionData.data) {
          setShowCajaModal(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAddToCart = (product: any) => {
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleOpenCaja = async () => {
    if (!openingAmount) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN', amount: Number(openingAmount) })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
        setShowCajaModal(false);
        setToast({ visible: true, message: 'Caja abierta con éxito', type: 'success' });
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error al abrir caja', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseCaja = async () => {
    if (!closingAmount) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE', amount: Number(closingAmount) })
      });
      const data = await res.json();
      if (data.success) {
        setSession(null);
        setShowCloseModal(false);
        setClosingAmount('');
        setShowCajaModal(true);
        setToast({ visible: true, message: 'Caja cerrada correctamente', type: 'success' });
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error al cerrar caja', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = (checkoutData: any) => {
    setPendingCheckoutData(checkoutData);
    setReceivedAmount('');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (clientNit?: string, clientName?: string) => {
    if (!pendingCheckoutData) return;
    setProcessing(true);
    try {
      const finalPayload = {
        ...pendingCheckoutData,
        receivedAmount: Number(receivedAmount),
        changeAmount: Math.max(0, Number(receivedAmount) - pendingCheckoutData.totalAmount),
        clientNit,
        clientName
      };

      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      const data = await res.json();
      if (data.success) {
        setLastSale(data.data);
        setCartItems([]);
        setShowPaymentModal(false);
        setToast({ visible: true, message: 'Venta procesada con éxito', type: 'success' });
        // Refresh session to get updated sales total
        const sRes = await fetch('/api/pos/sessions');
        const sData = await sRes.json();
        if (sData.success) setSession(sData.data);
      } else {
        setToast({ visible: true, message: data.error || 'Error al procesar venta', type: 'error' });
      }
    } catch (err) {
      setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Iniciando Terminal POS...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert size={60} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4">Configuración Requerida</h1>
        <p className="text-gray-400 max-w-md mb-8">Debes configurar el nombre y la moneda de tu local antes de poder usar la terminal de punto de venta.</p>
        <a href="/dashboard/pos/config" className="px-8 py-4 bg-gold text-black rounded-2xl font-black uppercase tracking-widest text-[10px]">Ir a Configuración</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen bg-bg-primary flex flex-col lg:overflow-hidden relative">
      <div className="no-print">
        <POSHeader />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">
        {/* Premium Session Bar - Responsive & Sticky */}
        <div className="sticky top-0 lg:absolute lg:top-6 lg:left-1/2 lg:-translate-x-1/2 z-[60] no-print w-full lg:w-auto px-4 py-3 lg:p-0 bg-bg-primary/60 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none border-b border-white/5 lg:border-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between lg:justify-start gap-1 p-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl lg:rounded-[2rem] shadow-2xl max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 lg:gap-4 px-3 lg:px-6 py-2 lg:py-3">
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                <div className="absolute inset-0 w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-green-500 animate-ping opacity-30" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 truncate">Ventas Turno</span>
                <span className="text-[10px] lg:text-xs font-mono font-bold text-white whitespace-nowrap">
                   {config.currency} <span className="text-gold">{currentSessionSalesTotal.toFixed(2)}</span>
                </span>
              </div>
            </div>

            <div className="w-[1px] h-6 lg:h-8 bg-white/5 mx-1 flex-shrink-0" />

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <Link
                href="/dashboard/pos/inventory"
                title="Inventario"
                className="w-10 h-10 lg:w-auto lg:h-12 lg:px-5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-gold rounded-xl lg:rounded-[1.5rem] flex items-center justify-center lg:gap-2 transition-all group flex-shrink-0"
              >
                <Package size={14} className="group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-[0.2em]">Inventario</span>
              </Link>

              <Link
                href="/dashboard/pos/reports"
                title="Reportes"
                className="w-10 h-10 lg:w-auto lg:h-12 lg:px-5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-gold rounded-xl lg:rounded-[1.5rem] flex items-center justify-center lg:gap-2 transition-all group flex-shrink-0"
              >
                <TrendingUp size={14} className="group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-[0.2em]">Reportes</span>
              </Link>

              <button
                onClick={() => setShowCloseModal(true)}
                title="Cerrar Caja"
                className="w-10 h-10 lg:w-auto lg:h-12 lg:px-6 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white rounded-xl lg:rounded-[1.5rem] flex items-center justify-center lg:gap-2 transition-all group flex-shrink-0"
              >
                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-[0.2em]">Cerrar</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Left: Product Selection */}
        <div className={`flex-1 lg:overflow-hidden no-print ${mobileView === 'cart' ? 'hidden lg:block' : 'block'}`}>
          <POSProductGrid 
            products={products}
            categories={categories}
            onAdd={handleAddToCart}
            currency={config.currency}
          />
        </div>

        {/* Right: Cart and Checkout */}
        <div className={`w-full lg:w-[450px] lg:h-full flex-shrink-0 no-print ${mobileView === 'products' ? 'hidden lg:block' : 'block'}`}>
          {/* Back button on mobile cart view */}
          {mobileView === 'cart' && (
            <div className="lg:hidden p-4 bg-bg-secondary border-b border-white/5 sticky top-0 z-50 flex items-center gap-4">
              <button 
                onClick={() => setMobileView('products')}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400"
              >
                <Plus className="rotate-45" size={20} />
              </button>
              <span className="text-white font-bold">Volver al Catálogo</span>
            </div>
          )}
          <POSCart 
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveFromCart}
            onCheckout={handleCheckout}
            currency={config.currency}
          />
        </div>
      </div>

      {/* Floating Action Button (FAB) for Mobile Cart */}
      <AnimatePresence>
        {cartItems.length > 0 && mobileView === 'products' && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setMobileView('cart')}
            className="lg:hidden fixed bottom-8 right-6 z-[60] w-20 h-20 bg-gold text-primary-foreground rounded-full shadow-[0_10px_40px_rgba(212,175,55,0.4)] flex flex-col items-center justify-center border-4 border-bg-primary group active:scale-95 transition-all"
          >
            <div className="relative">
              <ShoppingBag size={28} />
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-black text-gold text-[10px] font-black rounded-full flex items-center justify-center border-2 border-gold">
                {cartItems.length}
              </span>
            </div>
            <span className="text-[7px] font-black uppercase tracking-tighter mt-1">Ver Caja</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Caja Opening Modal */}
      <AnimatePresence>
        {showCajaModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-md bg-bg-secondary border border-white/5 p-10 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <Link 
                href="/dashboard"
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 transition-all z-20"
              >
                <X size={20} />
              </Link>

              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Wallet size={120} className="text-gold" />
              </div>

              <header className="mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-6">
                  <Wallet size={24} />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Apertura de Caja</h2>
                <p className="text-xs lg:text-sm text-gray-500">Ingresa el monto inicial para comenzar el turno.</p>
              </header>

              <div className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Monto Inicial ({config.currency})</label>
                  <input
                    type="number"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-16 bg-bg-primary border border-white/5 rounded-2xl px-6 text-white text-3xl font-mono outline-none focus:border-gold/30 transition-all text-center"
                  />
                </div>

                <button
                  onClick={handleOpenCaja}
                  disabled={!openingAmount || processing}
                  className="w-full h-16 bg-gold hover:bg-gold-light text-primary-foreground font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-xl shadow-gold/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={18} />}
                  Abrir Caja y Empezar
                </button>

                <Link
                  href="/dashboard"
                  className="w-full h-16 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                  <LayoutDashboard size={18} />
                  Regresar al Panel
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Caja Closing Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowCloseModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-md bg-bg-secondary border border-white/5 p-10 rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <header className="mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                  <LogOut size={24} />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Cierre de Caja</h2>
                <p className="text-xs lg:text-sm text-gray-500">Resumen del turno y arqueo final.</p>
              </header>

              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Monto Apertura</p>
                    <p className="text-lg font-mono font-bold text-white">{config.currency} {Number(session?.openingAmount || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Ventas</p>
                    <p className="text-lg font-mono font-bold text-white">{config.currency} {currentSessionSalesTotal.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-4 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                   <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Efectivo Esperado</p>
                   <p className="text-2xl font-mono font-black text-gold">{config.currency} {(Number(session?.openingAmount || 0) + currentSessionSalesTotal).toFixed(2)}</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Monto en Caja Real</label>
                  <input
                    autoFocus
                    type="number"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-16 bg-bg-primary border border-white/5 rounded-2xl px-6 text-white text-3xl font-mono outline-none focus:border-gold/30 transition-all text-center"
                  />
                </div>

                <button
                  onClick={handleCloseCaja}
                  disabled={!closingAmount || processing}
                  className="w-full h-16 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <X size={18} />}
                  Cerrar Caja y Turno
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <POSPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        total={pendingCheckoutData?.totalAmount || 0}
        currency={config.currency}
        receivedAmount={receivedAmount}
        setReceivedAmount={setReceivedAmount}
      />

      {/* Invoice Modal after successful sale */}
      {lastSale && (
        <POSInvoice 
          sale={lastSale}
          config={config}
          onClose={() => setLastSale(null)}
        />
      )}

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}
