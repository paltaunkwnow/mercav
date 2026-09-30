"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import POSHeader from '@/components/pos/POSHeader';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSCart, { type CartItem, type CheckoutData } from '@/components/pos/POSCart';
import POSInvoice from '@/components/pos/POSInvoice';
import POSPaymentModal, { type PaymentConfirmation } from '@/components/pos/POSPaymentModal';
import type { POSGridProduct } from '@/components/pos/POSProductGrid';
import { getBusinessType, paymentMethodLabel } from '@/lib/pos/business';
import { formatMoney } from '@/lib/pos/money';
import { Loader2, Plus, LogOut, Wallet, ShieldAlert, CheckCircle2, X, Package, TrendingUp, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/ui/toast';

type TerminalCartItem = CartItem & { stock: number; trackStock: boolean };

export default function POSTerminalPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [products, setProducts] = useState<POSGridProduct[]>([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartState] = useState<TerminalCartItem[]>([]);
  // Blur and click handlers can fire in the same tick; read the latest cart, not the render's copy.
  const cartRef = useRef<TerminalCartItem[]>([]);
  const setCartItems = (next: TerminalCartItem[]) => {
    cartRef.current = next;
    setCartState(next);
  };
  const [cartKey, setCartKey] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [showCajaModal, setShowCajaModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState<CheckoutData | null>(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const currentSessionSalesTotal = Number(session?.summary?.total ?? 0);
  const business = getBusinessType(config?.businessType);
  const showError = (message: string) => setToast({ visible: true, message, type: 'error' });

  const refreshProducts = async () => {
    const res = await fetch('/api/pos/products');
    const data = await res.json();
    if (data.success) setProducts(data.data);
  };

  const refreshSession = async () => {
    const res = await fetch('/api/pos/sessions');
    const data = await res.json();
    if (data.success) setSession(data.data);
  };

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

  const exceedsStock = (item: { name: string; stock: number; trackStock: boolean }, quantity: number) => {
    if (!item.trackStock || quantity <= item.stock) return false;
    showError(`No hay stock suficiente de ${item.name}`);
    return true;
  };

  const handleAddToCart = (product: POSGridProduct) => {
    const current = cartRef.current;
    const existing = current.find(item => item.id === product.id);
    const step = product.unit === 'G' ? 100 : 1;
    if (existing) {
      if (exceedsStock(existing, existing.quantity + step)) return;
      setCartItems(current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + step } : item));
      return;
    }
    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      taxRate: product.taxRate ?? null,
      stock: Number(product.stock),
      trackStock: product.trackStock !== false,
      quantity: step,
    };
    if (exceedsStock(item, step)) return;
    setCartItems([...current, item]);
  };

  const handleSetQuantity = (id: string, quantity: number) => {
    const item = cartRef.current.find(i => i.id === id);
    if (!item || exceedsStock(item, quantity)) return;
    setCartItems(cartRef.current.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = cartRef.current.find(i => i.id === id);
    if (item) handleSetQuantity(id, Math.max(1, item.quantity + delta));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartRef.current.filter(item => item.id !== id));
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
        await refreshSession();
        setShowCajaModal(false);
        setToast({ visible: true, message: 'Caja abierta con éxito', type: 'success' });
      } else {
        showError(data.error || 'Error al abrir caja');
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

  const handleCheckout = (checkoutData: CheckoutData) => {
    setPendingCheckoutData(checkoutData);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (payment: PaymentConfirmation) => {
    if (!pendingCheckoutData) return;
    setProcessing(true);
    try {
      const { totalAmount, ...checkout } = pendingCheckoutData;
      const finalPayload = { ...checkout, ...payment };

      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      const data = await res.json();
      if (data.success) {
        setLastSale(data.data);
        setCartItems([]);
        setCartKey((k) => k + 1);
        setShowPaymentModal(false);
        setToast({ visible: true, message: 'Venta procesada con éxito', type: 'success' });
        await Promise.all([refreshSession(), refreshProducts()]);
      } else {
        showError(data.error || 'Error al procesar venta');
        if (res.status === 409 || res.status === 400) refreshProducts();
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
                   <span className="text-gold">{formatMoney(currentSessionSalesTotal, config.currency)}</span>
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
            onNotFound={(code) => showError(`No hay ningún producto con el código ${code}`)}
            currency={config.currency}
            business={business}
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
            key={`${cartKey}-${business.id}`}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onRemove={handleRemoveFromCart}
            onClear={() => setCartItems([])}
            onCheckout={handleCheckout}
            currency={config.currency}
            business={business}
            taxName={config.taxName || 'IVA'}
            taxRate={Number(config.taxRate || 0)}
            pricesIncludeTax={config.pricesIncludeTax !== false}
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
                    <p className="text-lg font-mono font-bold text-white">{formatMoney(session?.openingAmount, config.currency)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Ventas</p>
                    <p className="text-lg font-mono font-bold text-white">{formatMoney(currentSessionSalesTotal, config.currency)}</p>
                  </div>
                </div>

                {Object.keys(session?.summary?.byMethod ?? {}).length > 0 && (
                  <ul className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    {Object.entries(session.summary.byMethod as Record<string, number>).map(([method, amount]) => (
                      <li key={method} className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold">{paymentMethodLabel(method)}</span>
                        <span className="font-mono font-bold text-white">{formatMoney(amount, config.currency)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="p-4 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                   <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Efectivo Esperado en Caja</p>
                   <p className="text-2xl font-mono font-black text-gold">{formatMoney(session?.summary?.expectedCash ?? session?.openingAmount, config.currency)}</p>
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
        methods={config.paymentMethods ?? ['CASH']}
        country={config.country}
        processing={processing}
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
