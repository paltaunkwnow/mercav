"use client";

import React from 'react';
import { CheckCircle2, ShieldCheck, Zap } from '@/components/icons';

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
          <h1 className="text-4xl font-semibold tracking-tight text-black mb-2" style={{ fontFamily: "var(--font-display)" }}>Mercav</h1>
          <p className="text-sm font-medium text-gray-500">Comprobante de pago</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4">
            <CheckCircle2 size={14} /> Pago acreditado
          </div>
          <p className="text-sm text-gray-500 font-mono">ID: {data.id}</p>
          <p className="text-sm text-gray-500 font-mono">Fecha: {data.date}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Emisor</h3>
          <p className="font-bold">Mercav Digital Services S.R.L.</p>
          <p className="text-sm text-gray-500">Santa Cruz de la Sierra, Bolivia</p>
          <p className="text-sm text-gray-500">soporte@mercav.com</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Cliente</h3>
          <p className="font-bold">{data.clientName}</p>
          <p className="text-sm text-gray-500">{data.clientEmail}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-16">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 pb-3 border-b border-gray-200">Detalle</h3>
        <div className="flex justify-between items-center py-6">
          <div>
            <p className="text-lg font-bold text-black">{data.title}</p>
            <p className="text-sm text-gray-500">Proporcionado por {data.providerName}</p>
          </div>
          <p className="text-2xl font-mono font-semibold text-black tabular-nums">
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
            <span>Comisión de servicio</span>
            <span className="font-mono text-green-600">$0.00</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Método de pago</span>
            <span className="font-semibold">{data.method}</span>
          </div>
          <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-semibold">Total pagado</span>
            <span className="text-4xl font-mono font-semibold text-black tabular-nums">
              {data.amount.toLocaleString('en-US', { style: 'currency', currency: data.currency })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Protection */}
      <div className="mt-auto pt-12 border-t border-gray-100">
        <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl">
          <ShieldCheck className="text-green-600 w-8 h-8" />
          <div className="text-xs text-gray-600 leading-relaxed">
            Este recibo es un comprobante oficial de pago protegido por el sistema de Escrow de Mercav. 
            Los fondos están retenidos de forma segura y se liberarán al proveedor una vez el cliente apruebe el trabajo final.
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-500 mt-8">
          Documento generado electrónicamente por Mercav. No requiere firma física.
        </p>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
// creado por pato dev y askforvini
