"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import POSHeader from '@/components/pos/POSHeader';
import POSProductGrid from '@/components/pos/POSProductGrid';
import POSCart, { type CartItem, type CheckoutData } from '@/components/pos/POSCart';
import POSInvoice from '@/components/pos/POSInvoice';
import POSPaymentModal, { type PaymentConfirmation } from '@/components/pos/POSPaymentModal';
import type { POSGridProduct } from '@/components/pos/POSProductGrid';
import VoidSaleDialog from '@/components/pos/VoidSaleDialog';
import ShortcutsSheet from '@/components/pos/ShortcutsSheet';
import { getBusinessType, getUnit, paymentMethodLabel } from '@/lib/pos/business';
import { currencyDecimals, formatMoney, roundMoney } from '@/lib/pos/money';
import { computeSale } from '@/lib/pos/pricing';
import { SYNCED_EVENT, enqueueSale, isNetworkError, newClientRef, setActivePosConfig } from '@/lib/pos/offline';
import { keyTiming } from '@/lib/pos/stock';
import { Loader2, LogOut, Wallet, CheckCircle2, X, ShoppingBag, LayoutDashboard, ArrowLeft, Settings2, Keyboard, UserRound } from '@/components/icons';
import { buttonClass } from '@/components/site/primitives';
import { Toast } from '@/components/ui/toast';
import { posFetch, usePos } from '@/lib/pos/client';

type TerminalCartItem = CartItem & { stock: number; trackStock: boolean };

export default function POSTerminalPage() {
  const pos = usePos();
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
  const [staff, setStaff] = useState<{ id: string; name: string; role: string; isActive: boolean }[]>([]);
  const [openStaffId, setOpenStaffId] = useState('');
  const [openPin, setOpenPin] = useState('');
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentSessionSalesTotal = Number(session?.summary?.total ?? 0);
  const business = getBusinessType(config?.businessType);
  const showError = (message: string) => setToast({ visible: true, message, type: 'error' });

  const refreshProducts = async () => {
    const res = await posFetch('/api/pos/products');
    const data = await res.json();
    if (data.success) setProducts(data.data);
  };

  const refreshSession = async () => {
    const res = await posFetch('/api/pos/sessions');
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
    if (!showCloseModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCloseModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCloseModal]);

  useEffect(() => {
    const init = async () => {
      try {
        const [configRes, productsRes, catsRes, sessionRes, staffRes] = await Promise.all([
          posFetch('/api/pos/config'),
          posFetch('/api/pos/products'),
          posFetch('/api/pos/categories'),
          posFetch('/api/pos/sessions'),
          posFetch('/api/pos/staff')
        ]);

        const [configData, productsData, catsData, sessionData, staffData] = await Promise.all([
          configRes.json(),
          productsRes.json(),
          catsRes.json(),
          sessionRes.json(),
          staffRes.json().catch(() => null)
        ]);

        if (configData.success) setConfig(configData.data);
        if (configData.success && configData.data?.id) setActivePosConfig(configData.data.id);
        if (staffData?.success) setStaff(staffData.data.filter((p: { isActive: boolean }) => p.isActive));
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

  // Sales queued offline were just sent: refresh totals and stock.
  useEffect(() => {
    const onSynced = () => {
      refreshSession().catch(() => {});
      refreshProducts().catch(() => {});
      setToast({ visible: true, message: 'Ventas sin conexión sincronizadas', type: 'success' });
    };
    window.addEventListener(SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(SYNCED_EVENT, onSynced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts. Nothing animates; F keys work while typing, the rest don't.
  const shortcutRef = useRef<(e: KeyboardEvent) => void>(() => {});
  shortcutRef.current = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('[aria-modal="true"]')) return;
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
    const focusSearch = () => {
      setMobileView('products');
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[data-pos-search]')?.focus());
    };
    if (e.key === 'F2') { e.preventDefault(); focusSearch(); return; }
    if (typing) return;
    // A scanner burst can contain "-" or "+": only react to keys typed by hand.
    if (keyTiming.last - keyTiming.previous < 45) return;
    if (e.key === '/') { e.preventDefault(); focusSearch(); return; }
    if (e.key === '?') { e.preventDefault(); setShowShortcuts(true); return; }
    if (e.key === '+' || e.key === '-') {
      const last = cartRef.current[cartRef.current.length - 1];
      if (!last || getUnit(last.unit).step < 1) return;
      e.preventDefault();
      const step = last.unit === 'G' ? 100 : 1;
      handleUpdateQuantity(last.id, e.key === '+' ? step : -step);
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcutRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
      const res = await posFetch('/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN', amount: Number(openingAmount), staffId: openStaffId || undefined, pin: openStaffId ? openPin : undefined })
      });
      const data = await res.json();
      if (data.success) {
        await refreshSession();
        setShowCajaModal(false);
        setOpenPin('');
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
      const res = await posFetch('/api/pos/sessions', {
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

  // No network: keep the sale in the local queue, show its ticket as pending and discount stock on screen.
  const queueOffline = (payload: Record<string, unknown>, clientRef: string, payment: PaymentConfirmation) => {
    if (!pendingCheckoutData) return;
    const items = cartRef.current;
    const decimals = currencyDecimals(config.currency);
    const pricing = computeSale({
      lines: items.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
        unitPrice: Number(i.price),
        taxRate: i.taxRate === null || i.taxRate === undefined ? Number(config.taxRate || 0) : Number(i.taxRate),
      })),
      discountType: pendingCheckoutData.discountType,
      discountValue: pendingCheckoutData.discountValue,
      pricesIncludeTax: config.pricesIncludeTax !== false,
      decimals,
    });
    const paid = payment.payments.reduce((sum, p) => sum + p.amount, 0);
    const change = roundMoney(Math.max(0, paid - pricing.total), decimals);
    const byId = new Map(items.map((i) => [i.id, i]));
    const preview = {
      pending: true,
      transactionId: clientRef,
      createdAt: new Date().toISOString(),
      subtotalAmount: pricing.subtotal,
      taxAmount: pricing.tax,
      discountAmount: pricing.discount,
      totalAmount: pricing.total,
      changeAmount: change,
      orderType: pendingCheckoutData.orderType,
      deliveryChannel: pendingCheckoutData.deliveryChannel,
      clientNit: payment.clientNit,
      clientName: payment.clientName,
      payments: payment.payments.map((p, idx) => ({
        id: `${clientRef}-${idx}`,
        method: p.method,
        amount: p.method === 'CASH' ? roundMoney(p.amount - change, decimals) : p.amount,
        reference: p.reference,
      })),
      items: pricing.lines.map((l) => ({
        id: l.productId,
        productName: byId.get(l.productId)?.name,
        unit: byId.get(l.productId)?.unit,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        subtotal: l.gross,
      })),
    };
    const stored = enqueueSale(config.id, { clientRef, payload, preview, createdAt: preview.createdAt });
    if (!stored) {
      showError('Sin conexión y el navegador no permite guardar la venta. No se registró.');
      return;
    }
    setProducts((prev) => prev.map((p) => {
      const sold = items.find((i) => i.id === p.id);
      return sold && p.trackStock !== false ? { ...p, stock: Number(p.stock) - sold.quantity } : p;
    }));
    setLastSale(preview);
    setCartItems([]);
    setCartKey((k) => k + 1);
    setShowPaymentModal(false);
    setToast({ visible: true, message: 'Sin conexión: la venta quedó guardada y se envía sola cuando vuelva internet', type: 'info' });
  };

  const handleConfirmPayment = async (payment: PaymentConfirmation) => {
    if (!pendingCheckoutData) return;
    setProcessing(true);
    const { totalAmount, ...checkout } = pendingCheckoutData;
    const clientRef = newClientRef();
    const finalPayload = { ...checkout, ...payment, clientRef };
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      queueOffline(finalPayload, clientRef, payment);
      setProcessing(false);
      return;
    }
    try {

      const res = await posFetch('/api/pos/sales', {
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
      if (isNetworkError(err)) queueOffline(finalPayload, clientRef, payment);
      else setToast({ visible: true, message: 'Error de conexión', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const onTill = session?.staff as { name: string; role: string } | null | undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-3" role="status">
        <Loader2 className="w-8 h-8 text-gold animate-spin" aria-hidden />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Abriendo la caja…</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="no-print"><POSHeader /></div>
        <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--mv-gold-wash)] text-gold">
            <Settings2 size={26} aria-hidden />
          </span>
          <h1 className="mv-h3 mt-6">Configurá tu caja para empezar</h1>
          <p className="mv-body mt-3">Antes de vender necesitamos el nombre de tu negocio y la moneda con la que cobrás. Te lleva un minuto.</p>
          <Link href={pos.href('config')} className={buttonClass('primary', 'lg', 'mt-8 w-full sm:w-auto')}>
            Ir a configuración
          </Link>
        </main>
      </div>
    );
  }

  const fieldLabel = 'block text-sm font-semibold text-[var(--text-secondary)]';
  const amountInput = 'mv-input mv-data h-16 text-center text-3xl font-semibold';

  return (
    <div className="min-h-screen lg:h-screen bg-bg-primary flex flex-col lg:overflow-hidden relative">
      <div className="no-print">
        <POSHeader />
      </div>

      {/* Shift bar */}
      <div className="no-print flex items-center justify-between gap-3 border-b border-[var(--mv-hairline)] px-4 py-2 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
          <p className="min-w-0 truncate text-sm text-[var(--text-secondary)]">
            <span className="hidden sm:inline">Turno abierto · </span>Ventas del turno{' '}
            <span className="mv-data font-semibold text-[var(--text-primary)]">{formatMoney(currentSessionSalesTotal, config.currency)}</span>
            {onTill && <span className="hidden md:inline"> · Atiende {onTill.name}{onTill.role === 'MANAGER' ? ' (encargado)' : ''}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setShowShortcuts(true)}
          aria-label="Ver atajos de teclado"
          aria-keyshortcuts="?"
          className="mv-focus hidden h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:grid"
        >
          <Keyboard size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setShowCloseModal(true)}
          className="mv-focus inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-red-500/30 px-4 text-sm font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/10"
        >
          <LogOut size={16} aria-hidden />
          Cerrar caja
        </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">
        {/* Left: product selection */}
        <div className={`flex-1 lg:overflow-hidden no-print pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0 ${mobileView === 'cart' ? 'hidden lg:block' : 'block'}`}>
          <POSProductGrid 
            products={products}
            categories={categories}
            onAdd={handleAddToCart}
            onNotFound={(code) => showError(`No hay ningún producto con el código ${code}`)}
            currency={config.currency}
            business={business}
          />
        </div>

        {/* Right: cart and checkout */}
        <div className={`w-full lg:w-[400px] xl:w-[440px] lg:h-full flex-shrink-0 no-print ${mobileView === 'products' ? 'hidden lg:block' : 'block'}`}>
          {mobileView === 'cart' && (
            <div className="lg:hidden border-b border-[var(--mv-hairline)] px-2 py-1.5">
              <button 
                type="button"
                onClick={() => setMobileView('products')}
                className="mv-focus inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--text-primary)]"
              >
                <ArrowLeft size={18} aria-hidden />
                Seguir agregando productos
              </button>
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

      {/* Phone and tablet: cart bar */}
      {cartItems.length > 0 && mobileView === 'products' && (
        <div className="no-print fixed inset-x-0 bottom-0 z-[60] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className="mv-focus liquid-glass flex h-14 w-full items-center justify-between gap-3 rounded-full pl-5 pr-2 text-[var(--text-primary)] transition-transform duration-150 active:scale-[0.97]"
          >
            <span className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-gold" aria-hidden />
              <span className="text-sm font-semibold">
                <span className="mv-data">{cartItems.length}</span> {cartItems.length === 1 ? 'producto' : 'productos'} en el carrito
              </span>
            </span>
            <span className="inline-flex h-10 items-center rounded-full bg-gold px-4 text-sm font-semibold text-[var(--mv-on-gold)]">Ver y cobrar</span>
          </button>
        </div>
      )}

      {/* Open shift */}
      {showCajaModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="open-shift-title">
          <div className="mv-fade absolute inset-0 bg-black/50" aria-hidden />
          <form
            onSubmit={(e) => { e.preventDefault(); handleOpenCaja(); }}
            className="mv-pop mv-menu relative w-full max-w-md rounded-[1.75rem] p-6 sm:p-8"
          >
            <Link
              href={pos.exitHref}
              aria-label="Volver al panel sin abrir la caja"
              className="mv-focus absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <X size={20} aria-hidden />
            </Link>

            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-gold">
              <Wallet size={22} aria-hidden />
            </span>
            <h2 id="open-shift-title" className="mv-h3 mt-5">Abrir caja</h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Contá el efectivo con el que arrancás el turno. Lo usamos para el arqueo del cierre.</p>

            {staff.length > 0 && (
              <fieldset className="mt-6 space-y-2">
                <legend className={`${fieldLabel} mb-2`}>Quién atiende</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[{ id: '', name: 'Dueño de la cuenta', role: 'OWNER' }, ...staff].map((p) => {
                    const active = openStaffId === p.id;
                    return (
                      <button
                        key={p.id || 'owner'}
                        type="button"
                        aria-pressed={active}
                        onClick={() => { setOpenStaffId(p.id); setOpenPin(''); }}
                        className={`mv-focus flex min-h-12 items-center gap-2 rounded-[0.875rem] border px-3 text-left text-sm font-semibold transition-colors duration-150 ${active ? 'border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold' : 'border-[var(--mv-hairline-strong)] text-[var(--text-primary)]'}`}
                      >
                        <UserRound size={16} aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">{p.role === 'MANAGER' ? 'Encargado' : p.role === 'CASHIER' ? 'Cajero' : 'Sin PIN'}</span>
                      </button>
                    );
                  })}
                </div>
                {openStaffId && (
                  <div className="space-y-2 pt-2">
                    <label htmlFor="open-pin" className={fieldLabel}>PIN de {staff.find((p) => p.id === openStaffId)?.name}</label>
                    <input
                      id="open-pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={6}
                      value={openPin}
                      onChange={(e) => setOpenPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="mv-input mv-data text-center text-xl tracking-[0.4em]"
                    />
                  </div>
                )}
              </fieldset>
            )}

            <div className="mt-6 space-y-2">
              <label htmlFor="opening-amount" className={fieldLabel}>Efectivo inicial ({config.currency})</label>
              <input
                id="opening-amount"
                type="number"
                inputMode="decimal"
                min={0}
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className={amountInput}
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="submit"
                disabled={!openingAmount || processing || (!!openStaffId && !/^\d{4,6}$/.test(openPin))}
                className="mv-btn mv-btn-primary mv-btn-lg w-full"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}
                {processing ? 'Abriendo…' : 'Abrir caja'}
              </button>
              <Link href={pos.exitHref} className="mv-btn mv-btn-ghost w-full">
                <LayoutDashboard size={18} aria-hidden />
                Volver al panel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Close shift */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="close-shift-title">
          <div className="mv-fade absolute inset-0 bg-black/50" onClick={() => setShowCloseModal(false)} aria-hidden />
          <form
            onSubmit={(e) => { e.preventDefault(); handleCloseCaja(); }}
            className="mv-pop mv-menu custom-scrollbar relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] p-6 sm:p-8"
          >
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              aria-label="Cancelar el cierre de caja"
              className="mv-focus absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <X size={20} aria-hidden />
            </button>

            <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-500/10 text-red-400">
              <LogOut size={22} aria-hidden />
            </span>
            <h2 id="close-shift-title" className="mv-h3 mt-5">Cerrar caja</h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Resumen del turno y arqueo final.</p>

            <dl className="mt-6 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4">
                <dt className="text-xs font-medium text-[var(--text-secondary)]">Apertura</dt>
                <dd className="mv-data mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatMoney(session?.openingAmount, config.currency)}</dd>
              </div>
              <div className="rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4">
                <dt className="text-xs font-medium text-[var(--text-secondary)]">Ventas del turno</dt>
                <dd className="mv-data mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatMoney(currentSessionSalesTotal, config.currency)}</dd>
              </div>
            </dl>

            {Object.keys(session?.summary?.byMethod ?? {}).length > 0 && (
              <dl className="mt-2 space-y-2 rounded-2xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4 text-sm">
                {Object.entries(session.summary.byMethod as Record<string, number>).map(([method, amount]) => (
                  <div key={method} className="flex justify-between gap-4">
                    <dt className="text-[var(--text-secondary)]">{paymentMethodLabel(method)}</dt>
                    <dd className="mv-data text-[var(--text-primary)]">{formatMoney(amount, config.currency)}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-2 flex items-baseline justify-between gap-4 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4">
              <p className="text-sm font-semibold text-gold">Efectivo esperado en caja</p>
              <p className="mv-data text-xl font-semibold text-gold">{formatMoney(session?.summary?.expectedCash ?? session?.openingAmount, config.currency)}</p>
            </div>

            <div className="mt-6 space-y-2">
              <label htmlFor="closing-amount" className={fieldLabel}>Efectivo contado ({config.currency})</label>
              <input
                id="closing-amount"
                autoFocus
                type="number"
                inputMode="decimal"
                min={0}
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                className={amountInput}
              />
            </div>

            <button
              type="submit"
              disabled={!closingAmount || processing}
              className="mv-btn mv-btn-lg mt-6 w-full bg-red-600 text-[#fff] hover:bg-red-700"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <LogOut size={18} aria-hidden />}
              {processing ? 'Cerrando…' : 'Cerrar caja y turno'}
            </button>
          </form>
        </div>
      )}

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
          onVoid={() => setVoidTarget(lastSale)}
        />
      )}

      {voidTarget && (
        <VoidSaleDialog
          sale={voidTarget}
          currency={config.currency}
          onClose={() => setVoidTarget(null)}
          onVoided={(updated) => {
            setVoidTarget(null);
            setLastSale(updated);
            setToast({ visible: true, message: 'Venta anulada. El stock volvió al inventario.', type: 'success' });
            refreshSession().catch(() => {});
            refreshProducts().catch(() => {});
          }}
        />
      )}

      {showShortcuts && <ShortcutsSheet onClose={() => setShowShortcuts(false)} />}

      <Toast 
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}
// creado por pato dev y askforvini
