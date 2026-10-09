import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { MessageCircle } from "@/components/icons";
import { FeatureGrid, MoreProducts, PricingBand, ProductFAQ, ProductHero } from "@/components/site/product/ProductBlocks";
import { FREE_LIMITS } from "@/lib/checkPlanLimit";
import { formatMoney } from "@/lib/geo/latam";

export const metadata: Metadata = {
  title: "Caja para tu negocio: ventas, inventario y reportes",
  description:
    "La caja de tu negocio en el celular o la compu: vendé con o sin conexión, con lector de códigos, pagos divididos y ticket por WhatsApp. Inventario con alertas y reportes por persona.",
};

const bs = (n: number) => formatMoney(n, "BO");

// Ejemplo rotulado: un ticket y el turno del día, con los mismos campos que muestra la caja.
const TICKET = [
  { qty: 2, name: "Café americano", price: 15 },
  { qty: 1, name: "Medialuna", price: 8 },
  { qty: 1, name: "Jugo de naranja", price: 15 },
];
const TOTAL = TICKET.reduce((sum, item) => sum + item.qty * item.price, 0);
const SHIFT = [
  { name: "Lucía", sales: 6, total: 180 },
  { name: "Mateo", sales: 3, total: 90 },
];

function CajaDemo() {
  return (
    <figure className="relative w-full max-w-[22rem] pb-24">
      <div className="c-sticker c-inverse w-[19rem] p-5 text-left sm:w-[20rem]" style={{ "--tilt": "-3deg" } as CSSProperties}>
        <p className="c-label text-[0.95rem]">Café La Esquina · Ticket 0142</p>
        <ul className="mt-3 grid gap-1.5 text-[0.92rem]">
          {TICKET.map((item) => (
            <li key={item.name} className="flex justify-between gap-3">
              <span>
                {item.qty} × {item.name}
              </span>
              <span className="c-num whitespace-nowrap">{bs(item.qty * item.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-end justify-between border-t-2 border-[var(--c-text)] pt-2">
          <span className="c-label text-[0.95rem]">Total</span>
          <span className="c-display c-num text-[1.9rem] normal-case leading-none">{bs(TOTAL)}</span>
        </p>
        <p className="mt-2 text-[0.85rem] text-[var(--c-soft)]">
          Efectivo {bs(30)} · QR {bs(TOTAL - 30)} · Vendió Lucía
        </p>
        <p className="c-label mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.9rem] shadow-[inset_0_0_0_2px_currentColor]">
          <MessageCircle className="h-4 w-4" aria-hidden />
          Enviar por WhatsApp
        </p>
      </div>
      <div className="c-sticker c-night absolute bottom-0 right-0 w-[15rem] p-4 text-left sm:-right-6" style={{ "--tilt": "4deg" } as CSSProperties}>
        <p className="c-label text-[0.9rem]">Turno de hoy · por persona</p>
        <ul className="mt-2 grid gap-1 text-[0.85rem]">
          {SHIFT.map((p) => (
            <li key={p.name} className="flex justify-between gap-3">
              <span className="font-semibold">{p.name}</span>
              <span className="text-[var(--c-soft)]">{p.sales} ventas</span>
              <span className="c-num font-semibold">{bs(p.total)}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="sr-only">Ejemplo de un ticket y del reporte del turno por persona.</figcaption>
    </figure>
  );
}

export default function CajaPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <ProductHero
        id="caja-title"
        title={
          <>
            La caja de tu negocio, <span className="c-text-yellow">en el celular.</span>
          </>
        }
        lead="Vendé desde el celular, la tablet o la compu, con o sin conexión. Cada uno vende con su cuenta y el reporte te dice quién vendió qué."
        demo={<CajaDemo />}
      />
      <FeatureGrid
        id="caja-funciones"
        title="Todo lo que pasa en el mostrador."
        items={[
          { title: "Con o sin conexión", body: "Si se corta internet seguís vendiendo: las ventas se guardan en el equipo y se suben solas cuando vuelve la señal." },
          { title: "Lector de códigos", body: "Escaneá con la cámara del celular, o tipeá el número en los navegadores que no la permiten, como Safari en iPhone." },
          { title: "Pagos divididos y ticket por WhatsApp", body: "Una venta se puede pagar con más de un medio, y el ticket le llega al cliente por WhatsApp." },
          { title: "Inventario con alertas", body: "El stock baja con cada venta y la caja te avisa cuando un producto se está por acabar." },
          { title: "Anulaciones con motivo y cierre de caja", body: "Cada anulación queda con quién la hizo y por qué. Al cerrar, ves lo vendido por medio de pago." },
          { title: "Reportes con costo y ganancia", body: "Ventas por persona y por producto, con el costo y la ganancia de lo que vendiste." },
        ]}
      />
      <FeatureGrid
        id="caja-equipo"
        title="Tu equipo, cada uno con su cuenta."
        items={[
          { title: "Trabajadores", body: "Venden y cierran la caja con su propia cuenta. Los sumás con un link de invitación." },
          { title: "Encargados", body: "Manejan el inventario, las anulaciones y los reportes." },
          { title: "Contador", body: "Ve los reportes con costos y ganancia, sin tocar las ventas." },
          { title: "Dueño", body: "Ve todo y decide quién hace qué en Ajustes." },
        ]}
      />
      <PricingBand free={`En el plan Gratis la caja viene con tu empresa y hasta ${FREE_LIMITS.employeesPerWorkspace} trabajadores activos.`} />
      <ProductFAQ
        items={[
          { q: "¿Funciona sin internet?", a: "Sí. Si se corta la conexión seguís vendiendo: las ventas quedan guardadas en el equipo y se suben solas cuando vuelve la señal." },
          { q: "¿Tengo que comprar un equipo?", a: "No. Funciona en el navegador del celular, la tablet o la compu. El lector de códigos usa la cámara del celular." },
          { q: "¿Mi equipo puede vender con su cuenta?", a: "Sí. Los invitás con un link: quien entra como trabajador vende, los encargados manejan el inventario y las anulaciones, y el contador ve los reportes." },
          { q: "¿Cuánto cuesta?", a: `Crear la cuenta y usar la caja es gratis con hasta ${FREE_LIMITS.employeesPerWorkspace} trabajadores activos. Mercav Pro saca los límites por 9,99 USD por mes.` },
        ]}
      />
      <MoreProducts current="/caja" />
    </div>
  );
}
// creado por pato dev y askforvini
