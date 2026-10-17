"use client";

import { useMemo, useState } from "react";
import { Mervi, type MerviPose } from "@/components/mervi/Mervi";
import { PLink } from "@/components/privacy/blocks";
import { X } from "@/components/icons";
import { PRODUCTS, type PrivacyProduct } from "@/lib/privacy/catalog";

type Need = "wallet" | "phone" | "install";
type Priority = "mobile" | "open" | "premium" | "long" | "balance" | "budget";

const WALLET_OPTIONS = [
  ["mobile", "Usarla con el celular", "Quiero firmar o consultar sin depender de una computadora."],
  ["open", "Código abierto", "Priorizo firmware verificable y uso simple por cable."],
  ["premium", "Pantalla y comodidad", "Quiero una experiencia más completa para usarla seguido."],
] as const;
const PHONE_OPTIONS = [
  ["long", "Máximos años de soporte", "Quiero que el teléfono me acompañe muchos años."],
  ["balance", "Equilibrio", "Busco buena seguridad y precio sin ir al más caro."],
  ["budget", "Empezar con menos", "Quiero una opción más accesible y conocer sus límites."],
] as const;

function products(slugs: string[]) {
  return slugs.map((slug) => PRODUCTS.find((product) => product.slug === slug)).filter(Boolean) as PrivacyProduct[];
}

function recommendation(need: Need | null, priority: Priority | null) {
  if (need === "wallet" && priority === "mobile") return { pose: "smartphone" as MerviPose, title: "Para usar desde el celular", lead: "Estas opciones priorizan una conexión cotidiana sin dejar las claves en internet.", products: products(["tangem-wallet-pack-2", "ledger-nano-x"]) };
  if (need === "wallet" && priority === "open") return { pose: "libro" as MerviPose, title: "Para priorizar firmware abierto", lead: "Trezor publica su firmware y ambos modelos incluyen chip de seguridad.", products: products(["trezor-safe-3", "trezor-safe-5"]) };
  if (need === "wallet" && priority === "premium") return { pose: "celebrando" as MerviPose, title: "Para una experiencia más cómoda", lead: "Pantalla táctil y controles más completos para quien la va a usar seguido.", products: products(["trezor-safe-5", "ledger-nano-gen5"]) };
  if (need === "phone" && priority === "long") return { pose: "smartphone" as MerviPose, title: "Para conservarlo muchos años", lead: "Los Pixel 10 reciben actualizaciones de seguridad de Google hasta agosto de 2032.", products: products(["pixel-10", "pixel-10-pro"]) };
  if (need === "phone" && priority === "balance") return { pose: "pensativo" as MerviPose, title: "Para equilibrar soporte y precio", lead: "Pixel 8 y Pixel 9 Pro XL incluyen Titan M2 y Memory Tagging Extension.", products: products(["pixel-8", "pixel-9-pro-xl"]) };
  if (need === "phone" && priority === "budget") return { pose: "pensativo" as MerviPose, title: "Para empezar con un presupuesto menor", lead: "Pixel 7 es más accesible; revisá las actualizaciones de cada ficha antes de elegir.", products: products(["pixel-7", "pixel-6"]) };
  if (need === "install") return { pose: "programador" as MerviPose, title: "Aprovechá tu Pixel compatible", lead: "Si ya tenés un Pixel 6 o posterior, podemos instalar el sistema reforzado en tu equipo.", products: [] };
  return null;
}

function Choice({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`c-focus min-h-12 border-2 p-3 text-left transition-colors ${active ? "border-[var(--c-text)] bg-[var(--c-text)] text-[var(--c-bg)]" : "border-[var(--c-line)] bg-[var(--c-bg)] hover:border-[var(--c-text)]"}`}><strong className="block text-[0.95rem]">{label}</strong><span className={`mt-1 block text-[0.82rem] leading-snug ${active ? "text-[var(--c-bg)]/80" : "text-[var(--c-soft)]"}`}>{detail}</span></button>;
}

export function PrivacyMerviGuide() {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState<Need | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const result = useMemo(() => recommendation(need, priority), [need, priority]);
  const options = need === "wallet" ? WALLET_OPTIONS : need === "phone" ? PHONE_OPTIONS : [];
  const chooseNeed = (value: Need) => { setNeed(value); setPriority(null); };

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="c-link inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-semibold"><Mervi pose="saludando" scale={1} still /> Elegí con Mervi</button>;

  return <aside aria-label="Recomendador de Mervi" className="relative mt-8 max-w-3xl border-2 border-[var(--c-line)] bg-[var(--c-surface)] p-4 sm:p-6"><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar recomendador de Mervi" className="c-focus absolute right-1 top-1 grid h-11 w-11 place-items-center"><X className="h-4 w-4" aria-hidden /></button><div className="flex items-start gap-4 pr-8"><Mervi pose={result?.pose ?? "saludando"} scale={1} still label="Mervi te ayuda a elegir" /><div><p className="c-label">Mervi te orienta</p><h2 className="mt-1 text-[1.35rem] font-semibold">{result?.title ?? "Contame qué estás buscando"}</h2><p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-[var(--c-soft)]">{result?.lead ?? "Elegí una opción y te muestro productos que encajan. Esta guía no guarda tus respuestas."}</p></div></div>{!result ? <><fieldset className="mt-5"><legend className="text-sm font-semibold">¿Qué querés proteger primero?</legend><div className="mt-3 grid gap-2 sm:grid-cols-3"><Choice active={need === "wallet"} label="Mis claves" detail="Una billetera fría para cripto." onClick={() => chooseNeed("wallet")} /><Choice active={need === "phone"} label="Mi teléfono" detail="Un Pixel con sistema reforzado." onClick={() => chooseNeed("phone")} /><Choice active={need === "install"} label="Ya tengo un Pixel" detail="Instalar el sistema en mi equipo." onClick={() => chooseNeed("install")} /></div></fieldset>{options.length ? <fieldset className="mt-5"><legend className="text-sm font-semibold">¿Qué priorizás?</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{options.map(([id, label, detail]) => <Choice key={id} active={priority === id} label={label} detail={detail} onClick={() => setPriority(id)} />)}</div></fieldset> : null}</> : <div className="mt-5"><ul className="grid gap-3 sm:grid-cols-2">{result.products.map((product) => <li key={product.slug} className="border-2 border-[var(--c-line)] bg-[var(--c-bg)] p-4"><p className="c-label">{product.brand}</p><h3 className="mt-1 font-semibold">{product.name}</h3><p className="mt-1 text-sm leading-relaxed text-[var(--c-soft)]">{product.tagline}</p><p className="mt-3 text-sm font-semibold">Desde {product.priceUsdt.toLocaleString("es-BO")} USDT</p><PLink to={`/producto/${product.slug}`} className="c-link mt-3 inline-flex min-h-11 items-center font-semibold">Ver ficha</PLink></li>)}{need === "install" ? <li className="border-2 border-[var(--c-line)] bg-[var(--c-bg)] p-4 sm:col-span-2"><h3 className="font-semibold">Instalación en tu Pixel</h3><p className="mt-1 text-sm leading-relaxed text-[var(--c-soft)]">Revisamos compatibilidad y coordinamos la instalación antes de confirmar el pedido.</p><PLink to="/instalacion" className="c-link mt-3 inline-flex min-h-11 items-center font-semibold">Ver instalación</PLink></li> : null}</ul><button type="button" onClick={() => { setNeed(null); setPriority(null); }} className="c-link mt-5 inline-flex min-h-11 items-center font-semibold">Cambiar mi elección</button><p className="mt-3 text-xs leading-relaxed text-[var(--c-soft)]">Verificá especificaciones, disponibilidad y actualizaciones en cada ficha antes de pedir. Nunca compartas tu frase semilla ni tu PIN.</p></div>}</aside>;
}
