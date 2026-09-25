"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  ArrowLeft, 
  Loader2, 
  Package, 
  Clock, 
  RotateCcw,
  AlertCircle,
  Zap,
  Info,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Toast } from "@/components/ui/toast";
import StripeWrapper from "@/components/checkout/StripeWrapper";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";

export default function CheckoutPage({ params }: { params: { type: string, id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemData, setItemData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [country, setCountry] = useState("Bolivia");
  const [briefing, setBriefing] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });

  // Universal NIT/CI billing client states
  const [billingNit, setBillingNit] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingCompany, setBillingCompany] = useState("");
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);

  const isAnuncio = params.type === "anuncio" || params.type === "space";
  const typeKey = isAnuncio ? "spaces" : "services";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/${typeKey}/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setItemData(data.data);
        } else {
          setToast({ visible: true, message: "Error al cargar datos", type: "error" });
        }
      } catch (err) {
        setToast({ visible: true, message: "Error de conexión", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, typeKey, params.type]);

  // Debounced search for universal billing client
  useEffect(() => {
    const cleanNit = billingNit.trim();
    if (!cleanNit) {
      setBillingName("");
      setBillingLastName("");
      setBillingCompany("");
      setIsNewClient(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingClient(true);
      try {
        const res = await fetch(`/api/clients/${cleanNit}`);
        const json = await res.json();
        if (json.success && json.data) {
          const fullName = json.data.name;
          const parts = fullName.split(" ");
          if (parts.length > 1) {
            setBillingName(parts[0]);
            setBillingLastName(parts.slice(1).join(" "));
          } else {
            setBillingName(fullName);
            setBillingLastName("");
          }
          setBillingCompany(json.data.name);
          setIsNewClient(false);
        } else {
          setIsNewClient(true);
        }
      } catch (err) {
        setIsNewClient(true);
      } finally {
        setIsSearchingClient(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [billingNit]);

  const [orderId, setOrderId] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    if (!briefing.trim()) {
      setToast({ visible: true, message: "Por favor, completa los detalles del proyecto (briefing)", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      // Register new billing client in unified DB if they don't exist yet
      if (billingNit.trim() && (billingName.trim() || billingCompany.trim()) && isNewClient) {
        const fullName = `${billingName.trim()} ${billingLastName.trim()}`.trim() || billingCompany.trim();
        try {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nit: billingNit.trim(), name: fullName })
          });
        } catch (err) {
          console.error("Error registering client in checkout background:", err);
        }
      }

      const endpoint = isAnuncio 
        ? `/api/spaces/${params.id}/reserve` 
        : `/api/services/${params.id}/order`;
      
      const body = isAnuncio 
        ? { 
            startDate: new Date(), 
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
            basePrice: itemData.pricePerMonth,
            briefing 
          }
        : { 
            packageId: itemData.packages?.[0]?.id, 
            briefing 
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        const newOrderId = data.data.id;
        setOrderId(newOrderId);

        // Now create Stripe Intent with the orderId
        const price = Number(isAnuncio 
          ? itemData?.pricePerMonth 
          : itemData?.packages?.[0]?.price) || 0;

        const stripeRes = await fetch('/api/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(price),
            metadata: { 
              type: params.type, 
              id: params.id,
              title: itemData.title,
              orderId: newOrderId,
              packageId: params.type === "service" ? itemData.packages?.[0]?.id : undefined
            }
          })
        });

        const stripeData = await stripeRes.json();
        if (stripeData.clientSecret) {
          setClientSecret(stripeData.clientSecret);
          setToast({ visible: true, message: "Pedido iniciado. Procede al pago.", type: "success" });
        }
      } else {
        setToast({ visible: true, message: data.error || "Error al crear pedido", type: "error" });
      }
    } catch (err) {
      setToast({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-gold animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Preparando pasarela segura...</p>
      </div>
    );
  }

  const price = Number(isAnuncio 
    ? itemData?.pricePerMonth 
    : itemData?.packages?.[0]?.price) || 0;

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href={`/${isAnuncio ? "anuncios" : "servicios"}/${params.id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.2em] group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al detalle
        </Link>
        
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-6">
            <ShieldCheck className="h-3 w-3" /> Pago Seguro con Escrow
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Completar Solicitud</h1>
          <p className="text-gray-400">Estás a un paso de comenzar tu colaboración profesional.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            {/* Briefing Section - CRITICAL REQUEST */}
            <section className="p-8 rounded-[2.5rem] bg-bg-secondary border border-gold/10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap size={100} className="text-gold" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3 relative z-10">
                <Info className="h-5 w-5 text-gold" /> Briefing del Proyecto
              </h2>
              <p className="text-sm text-gray-400 mb-6 relative z-10">
                {isAnuncio 
                  ? "Describe los detalles de tu campaña publicitaria, fechas preferidas y cualquier instrucción especial."
                  : "Explica detalladamente qué necesitas. Cuanta más información des, mejor será el resultado final."}
              </p>
              
              <textarea
                required
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder={isAnuncio ? "Ej: Necesito publicar mi campaña de verano del 1 al 30 de Junio. El diseño incluye colores vivos..." : "Ej: Necesito un logo moderno para una cafetería que sea minimalista y use tonos tierra..."}
                className="w-full rounded-2xl border border-white/5 bg-bg-primary p-6 text-white outline-none focus:border-gold/30 transition-all min-h-[200px] resize-none relative z-10 text-base"
              />
            </section>

            {/* Billing Details */}
            <section className="p-8 rounded-[2.5rem] bg-bg-secondary border border-white/5 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gold" /> Detalles de Facturación
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">NIT / CI (Opcional - Buscar o Registrar)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={billingNit}
                      onChange={(e) => setBillingNit(e.target.value)}
                      placeholder="Ej: 12345678"
                      className="w-full bg-bg-primary border border-white/5 rounded-2xl h-14 px-5 text-white focus:outline-none focus:border-gold/30 transition-all font-mono" 
                    />
                    {isSearchingClient && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-gold animate-spin" />
                      </div>
                    )}
                  </div>
                  {isNewClient && billingNit && (
                    <p className="text-[10px] text-gold font-bold uppercase tracking-widest mt-2 px-1">
                      ✨ Contribuyente nuevo. Escribe los datos a continuación para registrarlo universalmente.
                    </p>
                  )}
                  {!isNewClient && billingNit && billingName && (
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-2 px-1">
                      ✓ Cliente verificado en el sistema universal.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nombre</label>
                    <input 
                      type="text" 
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="Nombre del titular"
                      className="w-full bg-bg-primary border border-white/5 rounded-2xl h-14 px-5 text-white focus:outline-none focus:border-gold/30 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Apellido</label>
                    <input 
                      type="text" 
                      value={billingLastName}
                      onChange={(e) => setBillingLastName(e.target.value)}
                      placeholder="Apellido del titular"
                      className="w-full bg-bg-primary border border-white/5 rounded-2xl h-14 px-5 text-white focus:outline-none focus:border-gold/30 transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Empresa / Razón Social (Opcional)</label>
                  <input 
                    type="text" 
                    value={billingCompany}
                    onChange={(e) => setBillingCompany(e.target.value)}
                    placeholder="Nombre comercial o razón social"
                    className="w-full bg-bg-primary border border-white/5 rounded-2xl h-14 px-5 text-white focus:outline-none focus:border-gold/30 transition-all" 
                  />
                </div>
                <CustomSelect
                  label="País de Residencia"
                  value={country}
                  onChange={(val) => setCountry(val)}
                  options={[
                    { value: "Bolivia", label: "Bolivia" },
                    { value: "Perú", label: "Perú" },
                    { value: "Colombia", label: "Colombia" },
                    { value: "Argentina", label: "Argentina" },
                    { value: "Chile", label: "Chile" },
                  ]}
                />
              </div>
            </section>

            {/* Payment Method */}
            <section className="p-8 rounded-[2.5rem] bg-bg-secondary border border-white/5 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gold" /> Método de Pago Seguro
              </h2>
              
              {!clientSecret ? (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">Primero confirma los detalles del proyecto arriba para habilitar el pago seguro.</p>
                  <Button 
                    onClick={handleCreateOrder}
                    disabled={submitting || !briefing.trim()}
                    className="w-full h-14 bg-foreground text-background hover:opacity-90 font-bold text-lg rounded-xl transition-all"
                  >
                    {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                    Confirmar y Proceder al Pago
                  </Button>
                </div>
              ) : (
                <StripeWrapper clientSecret={clientSecret} amount={price} />
              )}
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-bg-secondary border border-white/5 p-10 rounded-[3rem] sticky top-24 shadow-2xl shadow-black/40 overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                <Package size={80} className="text-gold" />
              </div>

              <h3 className="font-bold text-white text-xl mb-8 pb-4 border-b border-white/5 relative z-10">Resumen del Pedido</h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-bold text-lg">{itemData?.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
                      {isAnuncio ? "Espacio Publicitario" : (itemData?.packages?.[0]?.name || "Servicio")}
                    </p>
                  </div>
                  <span className="text-white font-mono font-bold text-lg">${price}</span>
                </div>
                
                {itemData?.packages?.[0] && (
                  <div className="flex flex-wrap gap-4 py-4 border-y border-white/5">
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <Clock className="h-3 w-3 mr-2 text-gold" /> {itemData.packages[0].deliveryDays} días
                    </div>
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <RotateCcw className="h-3 w-3 mr-2 text-gold" /> {itemData.packages[0].revisions} rev.
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">${price}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      Tarifa de Servicio
                      <div className="h-4 w-4 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                        <CheckCircle2 size={10} />
                      </div>
                    </span>
                    <span className="font-mono text-green-500">$0.00</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-3xl pt-8 border-t border-white/10 mt-8">
                    <span>Total</span>
                    <span className="font-mono text-gold leading-none">${(price || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-start gap-4 bg-bg-primary p-5 rounded-3xl border border-white/5 text-[10px] text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-bold">
                  <Info className="w-6 h-6 text-gold flex-shrink-0" />
                  <p>Completa el briefing y usa el formulario de la izquierda para procesar tu pago de forma segura.</p>
                </div>

                <div className="mt-8 flex items-start gap-4 bg-bg-primary p-5 rounded-3xl border border-white/5 text-[10px] text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-bold">
                  <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <p>Escrow Protegido: Los fondos se liberan solo al aprobar el trabajo final.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Toast 
          isVisible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
