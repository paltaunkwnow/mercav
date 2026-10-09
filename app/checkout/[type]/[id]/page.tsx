"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight,
  Loader2, 
  Package, 
  Clock, 
  RotateCcw,
  Check,
} from "@/components/icons";
import { Container } from "@/components/site/primitives";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Toast } from "@/components/ui/toast";
import StripeWrapper from "@/components/checkout/StripeWrapper";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import { AppHeading } from "@/components/app-shell/AppPage";

export default function CheckoutPage({ params }: { params: { type: string, id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemData, setItemData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // Monto que devuelve el servidor al crear el pago (incluye comisiones)
  const [chargedAmount, setChargedAmount] = useState<number | null>(null);
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

    let cancelled = false;
    const delayDebounce = setTimeout(async () => {
      setIsSearchingClient(true);
      try {
        const res = await fetch(`/api/clients/${encodeURIComponent(cleanNit)}`);
        const json = await res.json();
        // Una respuesta de un NIT anterior no debe pisar los datos del NIT actual.
        if (cancelled) return;
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
        if (!cancelled) setIsNewClient(true);
      } finally {
        if (!cancelled) setIsSearchingClient(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounce);
      setIsSearchingClient(false);
    };
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
              // Los links usan /checkout/servicio/...; comparar con "service" dejaba packageId vacío.
              packageId: !isAnuncio ? itemData.packages?.[0]?.id : undefined
            }
          })
        });

        const stripeData = await stripeRes.json();
        if (stripeData.clientSecret) {
          setClientSecret(stripeData.clientSecret);
          if (typeof stripeData.amount === "number") setChargedAmount(stripeData.amount);
          setToast({ visible: true, message: "Pedido iniciado. Procede al pago.", type: "success" });
        } else {
          setToast({ visible: true, message: stripeData.error || "No se pudo iniciar el pago. Probá de nuevo.", type: "error" });
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
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-bg-primary" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
        <p className="text-sm text-[var(--text-secondary)]">Preparando el pago…</p>
      </div>
    );
  }

  const price = Number(isAnuncio 
    ? itemData?.pricePerMonth 
    : itemData?.packages?.[0]?.price) || 0;
  const money = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(n || 0);
  const step = clientSecret ? 3 : briefing.trim() ? 2 : 1;
  const steps = ["Detalles", "Facturación", "Pago"];

  return (
    <div className="w-full pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container>
        <div className="mb-8 md:mb-10">
          <AppHeading
            back={{ href: `/${isAnuncio ? "anuncios" : "servicios"}/${params.id}`, label: "Volver al detalle" }}
            title={isAnuncio ? "Reservar el espacio" : "Contratar el servicio"}
            lead="Contanos qué necesitás, confirmá los datos de facturación y pagá con tarjeta."
          />
          <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="Pasos">
            {steps.map((label, idx) => {
              const n = idx + 1;
              const done = step > n;
              const current = step === n;
              return (
                <li key={label} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
                  <span className={`mv-chip h-8 gap-2 px-3 text-[13px] ${current ? "mv-chip-gold" : done ? "text-[var(--text-primary)]" : ""}`}>
                    <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${done ? "bg-gold text-[var(--mv-on-gold)]" : "border border-current"}`}>
                      {done ? <Check className="h-3 w-3" aria-hidden /> : <span className="mv-data">{n}</span>}
                    </span>
                    {label}
                  </span>
                  {n < steps.length && <span aria-hidden className="hidden h-px w-6 bg-[var(--mv-hairline-strong)] sm:block" />}
                </li>
              );
            })}
          </ol>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-6">
            {/* Briefing */}
            <section aria-labelledby="co-briefing" className="mv-panel p-5 sm:p-7">
              <h2 id="co-briefing" className="mv-h3"><span className="mv-data mr-2 text-gold">1</span>{isAnuncio ? "Detalles de la campaña" : "Detalles del proyecto"}</h2>
              <p id="co-briefing-hint" className="mt-1 text-sm text-[var(--text-secondary)]">
                {isAnuncio 
                  ? "Contá los detalles de tu campaña, las fechas preferidas y cualquier instrucción especial."
                  : "Explicá qué necesitás. Cuanta más información des, mejor será el resultado."}
              </p>
              <label htmlFor="co-briefing-text" className="mb-2 mt-5 block text-sm font-medium text-[var(--text-primary)]">
                Descripción <span className="font-normal text-[var(--text-tertiary)]">(obligatoria)</span>
              </label>
              <textarea
                id="co-briefing-text"
                required
                aria-describedby="co-briefing-hint"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder={isAnuncio ? "Ej.: quiero publicar mi campaña de verano del 1 al 30 de junio, con un diseño de colores vivos…" : "Ej.: necesito un logo moderno y minimalista para una cafetería, en tonos tierra…"}
                className="mv-input h-auto min-h-[11rem] resize-y py-3 text-[15px] leading-relaxed"
              />
            </section>

            {/* Billing */}
            <section aria-labelledby="co-billing" className="mv-panel p-5 sm:p-7">
              <h2 id="co-billing" className="mv-h3"><span className="mv-data mr-2 text-gold">2</span>Facturación</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Opcional. Si cargás tu NIT o CI, completamos los datos que ya tengamos.</p>
              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="co-nit" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">NIT o CI</label>
                  <div className="relative">
                    <input 
                      id="co-nit"
                      type="text" 
                      inputMode="numeric"
                      value={billingNit}
                      onChange={(e) => setBillingNit(e.target.value)}
                      placeholder="Ej.: 12345678"
                      aria-describedby="co-nit-status"
                      className="mv-input mv-data pr-11" 
                    />
                    {isSearchingClient && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2" role="status">
                        <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
                        <span className="sr-only">Buscando</span>
                      </span>
                    )}
                  </div>
                  <p id="co-nit-status" className="mt-2 text-xs" aria-live="polite">
                    {isNewClient && billingNit ? (
                      <span className="text-[var(--text-secondary)]">No encontramos este NIT o CI. Completá los datos y lo registramos para la próxima.</span>
                    ) : !isNewClient && billingNit && billingName ? (
                      <span className="inline-flex items-center gap-1.5 text-green-400"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Datos encontrados.</span>
                    ) : null}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="co-name" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Nombre</label>
                    <input 
                      id="co-name"
                      type="text" 
                      autoComplete="given-name"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="Nombre del titular"
                      className="mv-input" 
                    />
                  </div>
                  <div>
                    <label htmlFor="co-lastname" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Apellido</label>
                    <input 
                      id="co-lastname"
                      type="text" 
                      autoComplete="family-name"
                      value={billingLastName}
                      onChange={(e) => setBillingLastName(e.target.value)}
                      placeholder="Apellido del titular"
                      className="mv-input" 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="co-company" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Empresa o razón social <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span></label>
                  <input 
                    id="co-company"
                    type="text" 
                    autoComplete="organization"
                    value={billingCompany}
                    onChange={(e) => setBillingCompany(e.target.value)}
                    placeholder="Nombre comercial o razón social"
                    className="mv-input" 
                  />
                </div>
                <CustomSelect
                  label="País de residencia"
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

            {/* Payment */}
            <section aria-labelledby="co-payment" className={clientSecret ? "" : "mv-panel p-5 sm:p-7"}>
              {!clientSecret ? (
                <>
                  <h2 id="co-payment" className="mv-h3"><span className="mv-data mr-2 text-gold">3</span>Pago</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {briefing.trim()
                      ? "Confirmá la solicitud para habilitar el pago con tarjeta."
                      : "Completá los detalles del paso 1 para habilitar el pago."}
                  </p>
                  <button 
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={submitting || !briefing.trim()}
                    aria-busy={submitting}
                    className="mv-btn mv-btn-primary mv-btn-lg mt-6 w-full"
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                    {submitting ? "Creando solicitud…" : "Confirmar y continuar al pago"}
                    {!submitting && <ArrowRight className="h-4 w-4" aria-hidden />}
                  </button>
                </>
              ) : (
                <>
                  <h2 id="co-payment" className="sr-only">Pago</h2>
                  <StripeWrapper clientSecret={clientSecret} amount={chargedAmount ?? price} />
                </>
              )}
            </section>
          </div>

          <aside aria-labelledby="co-summary" className="lg:sticky lg:top-28">
            <div className="mv-panel p-5 sm:p-6">
              <h2 id="co-summary" className="text-sm font-semibold text-[var(--text-secondary)]">Resumen del pedido</h2>
              <div className="mt-3 flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] text-gold">
                  <Package className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-snug text-[var(--text-primary)]">{itemData?.title || "Publicación"}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    {isAnuncio ? "Espacio publicitario · 30 días" : (itemData?.packages?.[0]?.name || "Servicio")}
                  </p>
                </div>
              </div>

              {itemData?.packages?.[0] && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  <li className="mv-chip"><Clock className="h-3.5 w-3.5" aria-hidden /> <span className="mv-data">{itemData.packages[0].deliveryDays}</span> días</li>
                  <li className="mv-chip"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> <span className="mv-data">{itemData.packages[0].revisions}</span> revisiones</li>
                </ul>
              )}

              <dl className="mt-5 space-y-2.5 border-t border-[var(--mv-hairline)] pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Subtotal</dt>
                  <dd className="mv-data text-[var(--text-primary)]">{money(price)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-secondary)]">Tarifa de servicio</dt>
                  <dd className="mv-data text-green-400">{money(0)}</dd>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-[var(--mv-hairline)] pt-4">
                  <dt className="font-semibold text-[var(--text-primary)]">Total</dt>
                  <dd className="mv-data text-2xl font-medium text-gold">{money(price)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-right text-xs text-[var(--text-tertiary)]">Montos en USD</p>
            </div>

            {!isAnuncio && (
              <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Pago retenido.</span> Los fondos se liberan al proveedor cuando aprobás el trabajo final.
                </p>
              </div>
            )}
            <p className="mt-4 flex items-start gap-2.5 px-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
              Los datos de tu tarjeta van directo a Stripe. Mercav no los almacena.
            </p>
          </aside>
        </div>
        
        <Toast 
          isVisible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
