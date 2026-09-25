"use client";

import { Store, Printer, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface InvoiceProps {
  sale: any;
  config: any;
  onClose: () => void;
}

export default function POSInvoice({ sale, config, onClose }: InvoiceProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 invoice-modal-root">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md no-print" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-white text-black p-0 rounded-[3rem] shadow-2xl max-h-[90vh] overflow-hidden no-print-scrollbar"
      >
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

        <div id="printable-invoice-container" className="w-full bg-white text-black p-10 rounded-[3rem] shadow-2xl overflow-y-auto max-h-[85vh]">
          <div className="text-center mb-10">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4">
                <Store size={32} />
              </div>
            )}
            <h1 className="text-2xl font-black uppercase tracking-tighter">{config.shopName || 'Mercav POS'}</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{config.address || 'Ubicación no configurada'}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{config.city}, {config.department}</p>
          </div>

          <div className="border-y-2 border-black/5 py-4 mb-6 space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Transacción:</span>
              <span>#{sale.transactionId}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Fecha:</span>
              <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>Hora:</span>
              <span>{new Date(sale.createdAt).toLocaleTimeString()}</span>
            </div>
            {sale.clientNit && (
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-t border-black/5 pt-2 mt-1">
                <span>NIT / CI:</span>
                <span>{sale.clientNit}</span>
              </div>
            )}
            {sale.clientName && (
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>Cliente:</span>
                <span className="truncate max-w-[180px]">{sale.clientName}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-b border-black/5 pb-2">
              <span>Descripción</span>
              <div className="flex gap-8">
                <span>Cant</span>
                <span>Subtotal</span>
              </div>
            </div>
            {sale.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start group">
                <div className="flex-1">
                   <p className="text-xs font-bold uppercase leading-none">{item.product.name}</p>
                   <p className="text-[9px] text-gray-400 mt-1">{config.currency} {Number(item.unitPrice).toFixed(2)}</p>
                </div>
                <div className="flex gap-8">
                   <span className="text-xs font-bold">x{item.quantity}</span>
                   <span className="text-xs font-bold">{config.currency} {Number(item.subtotal).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t-2 border-black pt-4">
            <div className="flex justify-between text-xs font-bold">
              <span>SUBTOTAL</span>
              <span>{config.currency} {(Number(sale.totalAmount) + Number(sale.discountAmount)).toFixed(2)}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between text-xs font-bold text-red-500">
                <span>DESCUENTO</span>
                <span>- {config.currency} {Number(sale.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black pt-2 border-b-2 border-black pb-2">
              <span>TOTAL</span>
              <span>{config.currency} {Number(sale.totalAmount).toFixed(2)}</span>
            </div>

            {/* Payment Details */}
            <div className="pt-4 space-y-1">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Efectivo Recibido:</span>
                <span>{config.currency} {Number(sale.receivedAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Cambio Entregado:</span>
                <span>{config.currency} {Number(sale.changeAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-widest mb-4">
              <ShoppingBag size={10} /> {sale.orderType} {sale.deliveryChannel && `— ${sale.deliveryChannel}`}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">¡Gracias por su compra!</p>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-6">powered by mercav.lat</p>
          </div>

          {/* Action Buttons (no-print) - Integrated inside the card */}
          <div className="mt-10 flex gap-4 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 h-14 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-gray-900 transition-all active:scale-95"
            >
              <Printer size={16} /> Imprimir Ticket
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
// creado por pato dev y askforvini
