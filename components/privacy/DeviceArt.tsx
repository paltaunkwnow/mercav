import type { PrivacyProduct } from "@/lib/privacy/catalog";
import { cn } from "@/lib/utils";

/*
 * Dibujos de línea de los equipos, en la tinta del cartel: trazo de 2px, sin logos ni marcas. Son siluetas
 * genéricas por tipo (tarjeta, llave, pantalla, teléfono), no fotos del modelo.
 */

export type DeviceKind = "phone" | "stick" | "slate" | "card";

/** Qué silueta lleva cada producto. */
export function deviceKind(product: Pick<PrivacyProduct, "category" | "slug" | "brand">): DeviceKind {
  if (product.category === "celulares" || product.category === "instalacion") return "phone";
  if (product.brand === "Tangem") return "card";
  if (product.slug === "ledger-nano-x" || product.slug === "ledger-nano-s-plus") return "stick";
  return "slate";
}

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Teléfono de espaldas, con la franja de cámaras horizontal. */
function Phone() {
  return (
    <svg viewBox="0 0 124 252" {...STROKE}>
      <rect x="6" y="4" width="112" height="244" rx="20" />
      <rect x="15" y="36" width="94" height="34" rx="17" />
      <circle cx="36" cy="53" r="9" />
      <circle cx="36" cy="53" r="3.5" fill="currentColor" />
      <circle cx="62" cy="53" r="9" />
      <circle cx="62" cy="53" r="3.5" fill="currentColor" />
      <circle cx="90" cy="53" r="3" />
      <line x1="120" y1="78" x2="120" y2="96" strokeWidth={3} />
      <line x1="120" y1="108" x2="120" y2="146" strokeWidth={3} />
    </svg>
  );
}

/** Llave alargada: pantalla, dos botones en el canto y el aro del giro. */
function Stick() {
  return (
    <svg viewBox="0 0 252 84" {...STROKE}>
      <rect x="12" y="20" width="230" height="46" rx="10" />
      <rect x="4" y="36" width="8" height="14" rx="2" />
      <rect x="110" y="30" width="74" height="26" rx="3" />
      <line x1="126" y1="20" x2="140" y2="20" strokeWidth={4} />
      <line x1="156" y1="20" x2="170" y2="20" strokeWidth={4} />
      <circle cx="216" cy="43" r="11" />
      <circle cx="216" cy="43" r="4" />
    </svg>
  );
}

/** Equipo de bolsillo con pantalla y candado. */
function Slate() {
  return (
    <svg viewBox="0 0 128 168" {...STROKE}>
      <rect x="8" y="6" width="112" height="156" rx="16" />
      <rect x="22" y="20" width="84" height="84" rx="5" />
      <rect x="50" y="62" width="28" height="22" rx="3" />
      <path d="M55 62v-7a9 9 0 0 1 18 0v7" />
      <circle cx="64" cy="73" r="2" fill="currentColor" />
      <line x1="44" y1="128" x2="84" y2="128" />
      <line x1="52" y1="162" x2="76" y2="162" strokeWidth={4} />
    </svg>
  );
}

/** Dos tarjetas NFC: la de uso y, detrás, la de respaldo. */
function Card() {
  return (
    <svg viewBox="0 0 204 146" {...STROKE}>
      <path d="M34 30V20a10 10 0 0 1 10-10h140a10 10 0 0 1 10 10v84a10 10 0 0 1-10 10h-10" />
      <rect x="10" y="32" width="164" height="104" rx="10" />
      <path d="M128 70a14 14 0 0 1 0 28M138 62a26 26 0 0 1 0 44M148 54a38 38 0 0 1 0 60" />
      <path d="M28 112h44" />
    </svg>
  );
}

const ART: Record<DeviceKind, () => JSX.Element> = { phone: Phone, stick: Stick, slate: Slate, card: Card };

/** Proporción de cada dibujo, para reservar el lugar antes de que cargue. */
const RATIO: Record<DeviceKind, string> = { phone: "124 / 252", stick: "252 / 84", slate: "128 / 168", card: "204 / 146" };

/** La silueta de un tipo de equipo, sin producto (la portada y la instalación). */
export function DeviceSilhouette({ kind, className }: { kind: DeviceKind; className?: string }) {
  const Art = ART[kind];
  return (
    <span aria-hidden className={cn("c-device block [&>svg]:h-full [&>svg]:w-full", className)} style={{ aspectRatio: RATIO[kind] }}>
      <Art />
    </span>
  );
}

const TALL: Record<DeviceKind, boolean> = { phone: true, slate: true, stick: false, card: false };

/**
 * La imagen de un producto, en las tarjetas y en las fichas: el único lugar donde se dibuja un producto, para poder
 * cambiarla por otra (por ejemplo, un render por modelo y color) sin tocar las páginas. `className` da la caja; el
 * dibujo se centra adentro, a lo alto o a lo ancho según el equipo. `color` todavía no cambia la silueta.
 */
export function DeviceArt({
  product,
  color,
  className,
}: {
  product: Pick<PrivacyProduct, "category" | "slug" | "brand" | "name">;
  color?: string;
  className?: string;
}) {
  const kind = deviceKind(product);
  return (
    <div className={cn("flex items-center justify-center", className)} data-product={product.slug} data-color={color}>
      <DeviceSilhouette kind={kind} className={TALL[kind] ? "h-full max-w-full" : "max-h-full w-full"} />
    </div>
  );
}
// creado por pato dev y askforvini
