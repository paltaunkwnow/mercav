"use client";

import { Store, Printer, ShoppingBag, CheckCircle2, X, CloudOff, Ban, MessageCircle, Mail, Share2 } from '@/components/icons';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { formatQuantity, getUnit, orderTypeLabel, paymentMethodLabel } from '@/lib/pos/business';
import { formatMoney } from '@/lib/pos/money';
import { countryFiscal } from '@/lib/pos/fiscal';
import { mailtoUrl, ticketText, whatsappUrl } from '@/lib/pos/ticket';

interface InvoiceProps {
  sale: any;
  config: any;
  onClose: () => void;
  /** Shows "Anular venta" for a saved, non-voided sale. */
  onVoid?: () => void;
}

export default function POSInvoice({ sale, config, onClose, onVoid }: InvoiceProps) {
  const [mounted, setMounted] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setMounted(true);
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  // Escape closes the receipt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || typeof document === 'undefined') return null;

  const money = (v: unknown) => formatMoney(Number(v ?? 0), config.currency);
  const subtotal = Number(sale.subtotalAmount) > 0 ? Number(sale.subtotalAmount) : Number(sale.totalAmount) + Number(sale.discountAmount);
  const tax = Number(sale.taxAmount || 0);
  const taxIncluded = Math.abs(subtotal - Number(sale.discountAmount) - Number(sale.totalAmount)) < 0.01;
  const payments: { id: string; method: string; amount: unknown; reference?: string | null }[] = sale.payments ?? [];
  const change = Number(sale.changeAmount || 0);
  const pending = Boolean(sale.pending);
  const voided = sale.status === 'VOIDED';
  const text = ticketText(sale, config);
  const subject = `Ticket ${config.shopName || 'Mercav POS'} #${String(sale.transactionId).slice(-8)}`;
  const shareTicket = async () => {
    try {
      await navigator.share({ title: subject, text });
    } catch {
      // The person closed the share sheet.
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4 invoice-modal-root" role="dialog" aria-labelledby="invoice-status">
      <div className="mv-fade absolute inset-0 bg-black/50 no-print" onClick={onClose} aria-hidden />
      
      <div
        className="mv-pop mv-menu relative flex w-full max-w-md flex-col gap-3 rounded-[1.75rem] p-3 max-h-[calc(100dvh-1.5rem)] overflow-hidden no-print-scrollbar print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:bg-none print:bg-transparent print:p-0 print:shadow-none print:backdrop-blur-none"
      >
        <div className="no-print flex items-center justify-between gap-3 pl-2">
          <p id="invoice-status" role="status" className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            {voided ? (
              <><Ban size={20} className="text-red-400" aria-hidden />Venta anulada</>
            ) : pending ? (
              <><CloudOff size={20} className="text-amber-500" aria-hidden />Guardada sin conexión</>
            ) : (
              <><CheckCircle2 size={20} className="text-green-400" aria-hidden />Venta registrada</>
            )}
          </p>
          <button onClick={onClose} aria-label="Cerrar ticket" className="mv-focus grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <X size={20} aria-hidden />
          </button>
        </div>
        {/* Printable Area */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { 
              margin: 0; 
              size: 80mm auto; 
            }
            /* Hide everything at root except this portal */
            body > *:not(.invoice-modal-root) { 
              display: none !important; 
            }
            .invoice-modal-root {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 80mm !important;
              height: auto !important;
              background: white !important;
              visibility: visible !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print, .invoice-modal-root > div:first-child { 
              display: none !important; 
            }
            #printable-invoice-container {
              display: block !important;
              width: 80mm !important;
              padding: 6mm !important;
              margin: 0 !important;
              border: none !important;
              background: white !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            #printable-invoice-container * {
              visibility: visible !important;
            }
          }
        `}} />

        <div id="printable-invoice-container" className="min-h-0 w-full flex-1 overflow-y-auto rounded-[1.25rem] bg-[#fff] p-6 text-[#111] sm:p-8 print:max-h-none print:overflow-visible">
          <div className="mb-6 text-center">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="mx-auto mb-3 h-16 w-16 object-contain" />
            ) : (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#111] text-[#fff]" aria-hidden>
                <Store size={24} />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight">{config.shopName || 'Mercav POS'}</h1>
            <p className="mt-1 text-xs text-[#555]">{config.address || 'Ubicación no configurada'}</p>
            <p className="text-xs text-[#555]">{config.city}, {config.department}</p>
          </div>

          {pending && (
            <p className="mb-4 rounded-lg border border-dashed border-[#b45309] px-3 py-2 text-center text-xs font-semibold text-[#92400e]">
              Pendiente de sincronizar. Se registra apenas vuelva la conexión.
            </p>
          )}
          {voided && (
            <div className="mb-4 rounded-lg border-2 border-[#b91c1c] px-3 py-2 text-center text-[#b91c1c]">
              <p className="text-sm font-bold">VENTA ANULADA</p>
              {sale.voidReason && <p className="mt-0.5 text-xs">Motivo: {sale.voidReason}</p>}
            </div>
          )}

          <dl className="mb-5 space-y-1 border-y border-dashed border-[#bbb] py-3 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-[#555]">Transacción</dt>
              <dd className="mv-data">#{sale.transactionId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#555]">Fecha</dt>
              <dd className="mv-data">{new Date(sale.createdAt).toLocaleDateString('es-419')}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#555]">Hora</dt>
              <dd className="mv-data">{new Date(sale.createdAt).toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' })}</dd>
            </div>
            {sale.clientNit && (
              <div className="mt-1 flex justify-between gap-4 border-t border-dashed border-[#ddd] pt-2">
                <dt className="text-[#555]">{countryFiscal(config.country).taxIdLabel}</dt>
                <dd className="mv-data">{sale.clientNit}</dd>
              </div>
            )}
            {sale.clientName && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#555]">Cliente</dt>
                <dd className="max-w-[180px] truncate">{sale.clientName}</dd>
              </div>
            )}
          </dl>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between border-b border-[#ddd] pb-2 text-xs font-semibold text-[#555]">
              <span>Descripción</span>
              <div className="flex gap-6">
                <span>Cant.</span>
                <span>Subtotal</span>
              </div>
            </div>
            {sale.items.map((item: any) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                   <p className="text-sm font-semibold leading-tight">{item.productName || item.product?.name}</p>
                   <p className="mv-data mt-0.5 text-[11px] text-[#555]">{money(item.unitPrice)}{item.unit && item.unit !== 'UNIT' ? ` / ${getUnit(item.unit).short}` : ''}</p>
                </div>
                <div className="mv-data flex gap-6 text-sm">
                   <span>x{formatQuantity(item.quantity, item.unit)}</span>
                   <span className="font-semibold">{money(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t-2 border-[#111] pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="mv-data">{money(subtotal)}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between text-[#b91c1c]">
                <span>Descuento</span>
                <span className="mv-data">- {money(sale.discountAmount)}</span>
              </div>
            )}
            {tax > 0 && !taxIncluded && (
              <div className="flex justify-between">
                <span>{config.taxName || 'IVA'}</span>
                <span className="mv-data">+ {money(tax)}</span>
              </div>
            )}
            <div className="flex justify-between border-b-2 border-[#111] pb-2 pt-1 text-xl font-bold">
              <span>Total</span>
              <span className="mv-data">{money(sale.totalAmount)}</span>
            </div>
            {tax > 0 && taxIncluded && (
              <div className="flex justify-between text-xs text-[#555]">
                <span>{config.taxName || 'IVA'} incluido</span>
                <span className="mv-data">{money(tax)}</span>
              </div>
            )}

            {/* Payment Details */}
            <div className="space-y-1 pt-3 text-xs text-[#555]">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between gap-4">
                  <span>{paymentMethodLabel(p.method)}{p.reference ? ` · ${p.reference}` : ''}</span>
                  <span className="mv-data">{money(p.method === 'CASH' ? Number(p.amount) + change : p.amount)}</span>
                </div>
              ))}
              {change > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Cambio entregado</span>
                  <span className="mv-data">{money(change)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-dashed border-[#bbb] pt-5 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#111] px-3 py-1 text-[11px] font-semibold">
              <ShoppingBag size={11} aria-hidden /> {orderTypeLabel(sale.orderType)} {sale.deliveryChannel && `— ${sale.deliveryChannel}`}
            </div>
            <p className="text-xs text-[#555]">¡Gracias por tu compra!</p>
            <p className="mt-4 text-[10px] text-[#777]">mercav.lat</p>
          </div>
        </div>

        {/* Actions (no-print) */}
        <div className="no-print grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            onClick={handlePrint}
            className="mv-btn mv-btn-primary mv-btn-lg w-full px-4"
          >
            <Printer size={18} aria-hidden /> Imprimir ticket
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mv-btn mv-btn-lg w-full border border-[var(--mv-hairline-strong)] px-4 text-[var(--text-primary)]"
          >
            Nueva venta
          </button>
        </div>

        <details className="no-print group rounded-2xl border border-[var(--mv-hairline)] px-3">
          <summary className="mv-focus flex min-h-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden items-center justify-between gap-2 rounded-xl text-sm font-semibold text-[var(--text-primary)]">
            Enviar ticket digital
            <span className="text-xs font-normal text-[var(--text-secondary)]">No guardamos datos del cliente</span>
          </summary>
          <div className="space-y-2 pb-3">
            <label htmlFor="ticket-phone" className="block text-sm font-medium text-[var(--text-secondary)]">WhatsApp del cliente <span className="text-[var(--text-tertiary)]">(opcional)</span></label>
            <input
              id="ticket-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Con código de país, ej: 5491112345678"
              className="mv-input mv-data h-11 text-sm placeholder:font-sans"
            />
            <div className={`grid gap-2 ${canShare ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <a href={whatsappUrl(text, phone)} target="_blank" rel="noopener noreferrer" className="mv-btn mv-btn-sm w-full border border-[var(--mv-hairline-strong)] px-2 text-[var(--text-primary)]">
                <MessageCircle size={16} aria-hidden /> WhatsApp
              </a>
              <a href={mailtoUrl(text, subject)} className="mv-btn mv-btn-sm w-full border border-[var(--mv-hairline-strong)] px-2 text-[var(--text-primary)]">
                <Mail size={16} aria-hidden /> Correo
              </a>
              {canShare && (
                <button type="button" onClick={shareTicket} className="mv-btn mv-btn-sm w-full border border-[var(--mv-hairline-strong)] px-2 text-[var(--text-primary)]">
                  <Share2 size={16} aria-hidden /> Compartir
                </button>
              )}
            </div>
          </div>
        </details>

        {onVoid && !pending && !voided && (
          <button type="button" onClick={onVoid} className="no-print mv-focus mx-auto inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-red-400 hover:bg-red-500/10">
            <Ban size={16} aria-hidden /> Anular venta
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
// creado por pato dev y askforvini
