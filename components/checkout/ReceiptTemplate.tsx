"use client";

import React from 'react';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface ReceiptTemplateProps {
  data: {
    id: string;
    date: string;
    title: string;
    amount: number;
    currency: string;
    method: string;
    clientName: string;
    clientEmail: string;
    providerName: string;
  };
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(({ data }, ref) => {
  return (
    <div 
      ref={ref}
      className="w-[800px] p-12 bg-white text-black font-sans relative overflow-hidden"
      style={{ minHeight: '1000px' }}
    >
      {/* Premium Watermark */}
      <div className="absolute top-[-100px] right-[-100px] opacity-[0.03] rotate-12 pointer-events-none">
        <Zap size={600} />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-16 border-b-2 border-gray-100 pb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-black mb-2">MERCAV</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Protocolo de Transacción v1.0</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <CheckCircle2 size={14} /> Transacción Exitosa
          </div>
          <p className="text-sm text-gray-500 font-mono">ID: {data.id}</p>
          <p className="text-sm text-gray-500 font-mono">Fecha: {data.date}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Emisor (Mercav Escrow)</h3>
          <p className="font-bold">Mercav Digital Services S.R.L.</p>
          <p className="text-sm text-gray-500">Santa Cruz de la Sierra, Bolivia</p>
          <p className="text-sm text-gray-500">soporte@mercav.com</p>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Cliente</h3>
          <p className="font-bold">{data.clientName}</p>
          <p className="text-sm text-gray-500">{data.clientEmail}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-16">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">Detalles del Servicio</h3>
        <div className="flex justify-between items-center py-6">
          <div>
            <p className="text-lg font-bold text-black">{data.title}</p>
            <p className="text-sm text-gray-500">Proporcionado por {data.providerName}</p>
          </div>
          <p className="text-2xl font-mono font-black text-black">
            {data.amount.toLocaleString('en-US', { style: 'currency', currency: data.currency })}
          </p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-gray-50 rounded-3xl p-10 mb-16">
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-mono">{data.amount.toLocaleString('en-US', { style: 'currency', currency: data.currency })}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Comisión de Servicio (Mercav Protection)</span>
            <span className="font-mono text-green-600">$0.00</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Método de Pago</span>
            <span className="font-bold">{data.method}</span>
          </div>
          <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold">Total Pagado</span>
            <span className="text-4xl font-mono font-black text-black">
              {data.amount.toLocaleString('en-US', { style: 'currency', currency: data.currency })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Protection */}
      <div className="mt-auto pt-12 border-t border-gray-100">
        <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl">
          <ShieldCheck className="text-green-600 w-8 h-8" />
          <div className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-wider font-bold">
            Este recibo es un comprobante oficial de pago protegido por el sistema de Escrow de Mercav. 
            Los fondos están retenidos de forma segura y se liberarán al proveedor una vez el cliente apruebe el trabajo final.
          </div>
        </div>
        <p className="text-center text-[9px] text-gray-400 mt-8 font-mono">
          Documento generado electrónicamente por el Protocolo Mercav. No requiere firma física.
        </p>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
// creado por Patodev y Invertilo
