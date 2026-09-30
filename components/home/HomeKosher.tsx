"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPinned, MessagesSquare, ShieldCheck, Store } from "lucide-react";
import { KosherAtlasPreview, type KosherPreviewPlace } from "@/components/kosher/KosherHero";

const POINTS = [
  { icon: MapPinned, text: "Mapa de restaurantes, tiendas, sinagogas y kehilot" },
  { icon: Store, text: "Stock kosher por sucursal, con fecha" },
  { icon: MessagesSquare, text: "Un chat propio para cada ciudad y cada lugar" },
  { icon: ShieldCheck, text: "La fuente de cada estado siempre a la vista" },
];

export function HomeKosher({
  places,
  cities,
  preview,
}: {
  places: number;
  cities: number;
  preview: KosherPreviewPlace[];
}) {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="home-kosher" className="relative w-full overflow-hidden bg-bg-primary py-24 md:py-32">
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] border border-border bg-bg-secondary px-6 py-12 md:px-14 md:py-16"
        >
          <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-techelet/15 blur-[140px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[140px]" />

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-techelet/30 bg-techelet-dim px-3.5 py-1.5 text-xs font-medium text-techelet">
                Nuevo · kosher.mercav.lat
              </span>
              <h2 id="home-kosher" className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] md:text-6xl">
                Mercav <span className="gradient-text-gold">Kosher</span>
                <span lang="he" dir="rtl" className="ml-3 align-middle font-display text-2xl text-techelet md:text-3xl">
                  מקום
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
                Un espacio propio para la comunidad judía de Latinoamérica: dónde comer, comprar y rezar, con tu kehilá a un mensaje de
                distancia. Entras con tu cuenta Mercav de siempre.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {POINTS.map(({ icon: Icon, text }, i) => (
                  <motion.li
                    key={text}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.07 }}
                    className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {text}
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kosher"
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gold px-8 text-base font-semibold text-black shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-transform active:scale-[0.98]"
                >
                  Entrar a Mercav Kosher
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link
                  href="/kosher/mapa"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border px-8 text-base font-semibold text-[var(--text-primary)] transition-colors hover:border-gold/50"
                >
                  <MapPinned className="h-5 w-5" aria-hidden />
                  Ver el mapa
                </Link>
              </div>

              {places > 0 && (
                <p className="mt-6 text-xs text-[var(--text-tertiary)]">
                  {places} lugares en {cities} ciudades · Mercav Kosher no emite hechsher.
                </p>
              )}
            </div>

            {preview.length > 0 && (
              <div className="mx-auto w-full max-w-md lg:max-w-none">
                <KosherAtlasPreview preview={preview} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
