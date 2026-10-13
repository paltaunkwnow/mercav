import type { ReactNode } from "react";
import type { PrivacyProduct } from "@/lib/privacy/catalog";
import { cn } from "@/lib/utils";

/*
 * Dibujos de línea de los equipos, en la tinta del cartel: trazo de 2px, sin logos ni marcas. Cada modelo tiene su
 * dibujo, con sus proporciones y lo que lo distingue (la franja de cámaras de cada Pixel, la tapa giratoria y los
 * botones de cada Ledger, la pantalla de cada Trezor). Son ilustraciones, no fotos.
 */

export type DeviceKind = "phone" | "stick" | "slate" | "card";

/** Qué silueta genérica lleva cada producto (para la portada y la instalación, donde no hay un modelo). */
export function deviceKind(product: Pick<PrivacyProduct, "category" | "slug" | "brand">): DeviceKind {
  if (product.category === "celulares" || product.category === "instalacion") return "phone";
  if (product.brand === "Tangem") return "card";
  if (product.slug === "ledger-nano-x" || product.slug === "ledger-nano-s-plus") return "stick";
  return "slate";
}

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

type Art = { w: number; h: number; body: ReactNode };

function Svg({ art }: { art: Art }) {
  return (
    <svg viewBox={`0 0 ${art.w} ${art.h}`} {...STROKE}>
      {art.body}
    </svg>
  );
}

/** Lente: aro y vidrio. */
const Lens = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <>
    <circle cx={cx} cy={cy} r={r} />
    <circle cx={cx} cy={cy} r={r * 0.42} fill="currentColor" />
  </>
);
const Dot = ({ cx, cy, r = 2.6 }: { cx: number; cy: number; r?: number }) => <circle cx={cx} cy={cy} r={r} />;

/** Botones de volumen y encendido, en el canto derecho. */
const SideKeys = ({ x, y }: { x: number; y: number }) => (
  <>
    <line x1={x} y1={y} x2={x} y2={y + 16} strokeWidth={3} />
    <line x1={x} y1={y + 26} x2={x} y2={y + 62} strokeWidth={3} />
  </>
);

/* ── Pixel (de espaldas, a escala: 1 mm ≈ 1,55 unidades) ─────────────────────────────── */

// Pixel 6: dos tonos y la franja negra de cámaras de borde a borde.
const PIXEL_6: Art = {
  w: 124,
  h: 254,
  body: (
    <>
      <rect x="4" y="4" width="116" height="246" rx="15" />
      <line x1="4" y1="30" x2="120" y2="30" strokeDasharray="3 4" />
      <rect x="4" y="38" width="116" height="30" />
      <rect x="4" y="38" width="116" height="30" strokeWidth={4} strokeOpacity={0.35} />
      <Lens cx={24} cy={53} r={9} />
      <Lens cx={46} cy={53} r={6.5} />
      <Dot cx={98} cy={53} />
      <SideKeys x={122} y={84} />
    </>
  ),
};

// Pixel 7: franja de aluminio de borde a borde con una cápsula para dos lentes; el flash, afuera.
const PIXEL_7: Art = {
  w: 122,
  h: 250,
  body: (
    <>
      <rect x="4" y="4" width="114" height="242" rx="18" />
      <path d="M4 38h114M4 70h114" />
      <rect x="14" y="44" width="58" height="20" rx="10" />
      <Lens cx={28} cy={54} r={7} />
      <Lens cx={56} cy={54} r={7} />
      <Dot cx={96} cy={54} />
      <SideKeys x={120} y={86} />
    </>
  ),
};

// Pixel 7 Pro: la misma franja, con la cápsula de dos lentes y el teleobjetivo aparte.
const PIXEL_7_PRO: Art = {
  w: 127,
  h: 260,
  body: (
    <>
      <rect x="4" y="4" width="119" height="252" rx="18" />
      <path d="M4 38h119M4 72h119" />
      <rect x="12" y="45" width="54" height="20" rx="10" />
      <Lens cx={25} cy={55} r={7} />
      <Lens cx={52} cy={55} r={7} />
      <rect x="74" y="44" width="22" height="22" rx="6" />
      <Lens cx={85} cy={55} r={7.5} />
      <Dot cx={108} cy={55} />
      <SideKeys x={125} y={90} />
    </>
  ),
};

// Pixel 8: más chico y redondeado; franja angosta con la cápsula de dos lentes y el flash adentro.
const PIXEL_8: Art = {
  w: 118,
  h: 241,
  body: (
    <>
      <rect x="4" y="4" width="110" height="233" rx="22" />
      <path d="M4 40h110M4 66h110" />
      <rect x="12" y="44" width="80" height="18" rx="9" />
      <Lens cx={26} cy={53} r={6.5} />
      <Lens cx={50} cy={53} r={6.5} />
      <Dot cx={78} cy={53} r={2.2} />
      <SideKeys x={116} y={82} />
    </>
  ),
};

// Pixel 9 Pro XL: bordes planos y una isla de cámaras flotante, con tres lentes, flash y sensor.
const PIXEL_9_PRO_XL: Art = {
  w: 127,
  h: 260,
  body: (
    <>
      <rect x="4" y="4" width="119" height="252" rx="20" />
      <rect x="9" y="9" width="109" height="242" rx="16" strokeOpacity={0.35} />
      <rect x="16" y="26" width="95" height="32" rx="16" />
      <Lens cx={32} cy={42} r={8} />
      <Lens cx={54} cy={42} r={8} />
      <Lens cx={76} cy={42} r={6.5} />
      <Dot cx={93} cy={36} r={2.2} />
      <Dot cx={93} cy={48} r={2.2} />
      <SideKeys x={125} y={80} />
    </>
  ),
};

// Pixel 10: isla flotante con tres lentes y el flash.
const PIXEL_10: Art = {
  w: 120,
  h: 245,
  body: (
    <>
      <rect x="4" y="4" width="112" height="237" rx="22" />
      <rect x="14" y="24" width="92" height="30" rx="15" />
      <Lens cx={30} cy={39} r={7.5} />
      <Lens cx={51} cy={39} r={7.5} />
      <Lens cx={72} cy={39} r={6} />
      <Dot cx={90} cy={39} />
      <SideKeys x={118} y={76} />
    </>
  ),
};

// Pixel 10 Pro: la misma isla con flash y sensor de temperatura, y el marco pulido.
const PIXEL_10_PRO: Art = {
  w: 120,
  h: 245,
  body: (
    <>
      <rect x="4" y="4" width="112" height="237" rx="22" />
      <rect x="9" y="9" width="102" height="227" rx="18" strokeOpacity={0.35} />
      <rect x="14" y="24" width="92" height="30" rx="15" />
      <Lens cx={30} cy={39} r={7.5} />
      <Lens cx={51} cy={39} r={7.5} />
      <Lens cx={72} cy={39} r={6} />
      <Dot cx={90} cy={33} r={2.2} />
      <Dot cx={90} cy={45} r={2.2} />
      <SideKeys x={118} y={76} />
    </>
  ),
};

/* ── Billeteras ─────────────────────────────────────────────────────────────────────── */

// Ledger Nano X: llave larga con tapa giratoria, pantalla grande y los dos botones al frente.
const NANO_X: Art = {
  w: 264,
  h: 84,
  body: (
    <>
      <rect x="10" y="18" width="222" height="48" rx="12" />
      <rect x="4" y="34" width="6" height="16" rx="2" />
      <path d="M58 16h180a14 14 0 0 1 14 14v24a14 14 0 0 1-14 14H58" strokeOpacity={0.45} />
      <rect x="44" y="28" width="92" height="28" rx="3" />
      <circle cx="160" cy="42" r="8" />
      <circle cx="186" cy="42" r="8" />
      <circle cx="232" cy="42" r="12" />
      <circle cx="232" cy="42" r="4.5" />
    </>
  ),
};

// Ledger Nano S Plus: más corta, pantalla chica y los dos botones en el canto superior.
const NANO_S_PLUS: Art = {
  w: 232,
  h: 80,
  body: (
    <>
      <rect x="10" y="20" width="192" height="42" rx="10" />
      <rect x="4" y="33" width="6" height="16" rx="2" />
      <path d="M52 17h152a13 13 0 0 1 13 13v22a13 13 0 0 1-13 13H52" strokeOpacity={0.45} />
      <rect x="62" y="30" width="62" height="22" rx="3" />
      <line x1="76" y1="20" x2="92" y2="20" strokeWidth={5} />
      <line x1="104" y1="20" x2="120" y2="20" strokeWidth={5} />
      <circle cx="202" cy="41" r="11" />
      <circle cx="202" cy="41" r="4" />
    </>
  ),
};

// Ledger Nano Gen5: compacta, casi toda pantalla táctil.
const NANO_GEN5: Art = {
  w: 140,
  h: 176,
  body: (
    <>
      <rect x="6" y="6" width="128" height="164" rx="18" />
      <rect x="16" y="16" width="108" height="122" rx="8" />
      <path d="M40 66h60M40 82h44" strokeOpacity={0.6} />
      <rect x="54" y="148" width="32" height="10" rx="5" />
    </>
  ),
};

// Tangem: dos tarjetas NFC, la de uso adelante y la de respaldo detrás.
const TANGEM: Art = {
  w: 204,
  h: 146,
  body: (
    <>
      <path d="M34 30V20a10 10 0 0 1 10-10h140a10 10 0 0 1 10 10v84a10 10 0 0 1-10 10h-10" />
      <rect x="10" y="32" width="164" height="104" rx="10" />
      <rect x="26" y="52" width="26" height="20" rx="4" />
      <path d="M128 70a14 14 0 0 1 0 28M138 62a26 26 0 0 1 0 44M148 54a38 38 0 0 1 0 60" />
      <path d="M28 112h44" />
    </>
  ),
};

// Trezor Safe 3: llavero chico, pantalla monocromática arriba y dos botones abajo.
const SAFE_3: Art = {
  w: 112,
  h: 196,
  body: (
    <>
      <path d="M14 10h84a8 8 0 0 1 8 8v140a28 28 0 0 1-28 28H34a28 28 0 0 1-28-28V18a8 8 0 0 1 8-8z" />
      <rect x="20" y="26" width="72" height="62" rx="4" />
      <rect x="20" y="132" width="32" height="26" rx="8" />
      <rect x="60" y="132" width="32" height="26" rx="8" />
      <circle cx="56" cy="110" r="3" />
    </>
  ),
};

// Trezor Safe 5: pantalla táctil a color en casi todo el frente y la zona háptica abajo.
const SAFE_5: Art = {
  w: 116,
  h: 186,
  body: (
    <>
      <rect x="6" y="6" width="104" height="174" rx="22" />
      <rect x="14" y="16" width="88" height="126" rx="10" />
      <path d="M30 60h56M30 76h40" strokeOpacity={0.6} />
      <circle cx="58" cy="160" r="7" />
    </>
  ),
};

// Trezor Safe 7: más grande, pantalla de borde a borde y el emblema abajo.
const SAFE_7: Art = {
  w: 130,
  h: 214,
  body: (
    <>
      <rect x="6" y="6" width="118" height="202" rx="26" />
      <rect x="12" y="14" width="106" height="152" rx="16" />
      <path d="M28 44h40M28 70h74M28 86h60M44 140h42" strokeOpacity={0.6} />
      <path d="M58 182l7-6 7 6v8l-7 5-7-5z" />
    </>
  ),
};

const MODELS: Record<string, Art> = {
  "pixel-6": PIXEL_6,
  "pixel-7": PIXEL_7,
  "pixel-7-pro": PIXEL_7_PRO,
  "pixel-8": PIXEL_8,
  "pixel-9-pro-xl": PIXEL_9_PRO_XL,
  "pixel-10": PIXEL_10,
  "pixel-10-pro": PIXEL_10_PRO,
  "ledger-nano-x": NANO_X,
  "ledger-nano-s-plus": NANO_S_PLUS,
  "ledger-nano-gen5": NANO_GEN5,
  "tangem-wallet-pack-2": TANGEM,
  "trezor-safe-3": SAFE_3,
  "trezor-safe-5": SAFE_5,
  "trezor-safe-7": SAFE_7,
};

/** La silueta genérica de cada tipo, para la portada y la instalación. */
const GENERIC: Record<DeviceKind, Art> = { phone: PIXEL_10_PRO, stick: NANO_S_PLUS, slate: SAFE_5, card: TANGEM };

/** La silueta de un tipo de equipo, sin producto (la portada y la instalación). */
export function DeviceSilhouette({ kind, className }: { kind: DeviceKind; className?: string }) {
  const art = GENERIC[kind];
  return (
    <span aria-hidden className={cn("c-device block [&>svg]:h-full [&>svg]:w-full", className)} style={{ aspectRatio: `${art.w} / ${art.h}` }}>
      <Svg art={art} />
    </span>
  );
}

/**
 * La imagen de un producto, en las tarjetas y en las fichas: el único lugar donde se dibuja un producto, así se puede
 * cambiar sin tocar las páginas. `className` da la caja; el dibujo se centra adentro, a lo alto o a lo ancho según su
 * proporción. `color` todavía no cambia el dibujo.
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
  const art = MODELS[product.slug] ?? GENERIC[deviceKind(product)];
  const tall = art.h >= art.w;
  return (
    <div className={cn("flex items-center justify-center", className)} data-product={product.slug} data-color={color}>
      <span
        aria-hidden
        className={cn("c-device block [&>svg]:h-full [&>svg]:w-full", tall ? "h-full max-w-full" : "max-h-full w-full")}
        style={{ aspectRatio: `${art.w} / ${art.h}` }}
      >
        <Svg art={art} />
      </span>
    </div>
  );
}
// creado por pato dev y askforvini
