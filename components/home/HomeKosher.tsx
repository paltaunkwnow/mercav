"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPinned, MessagesSquare, ShieldCheck, Store } from "@/components/icons";
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
    <section aria-labelledby="home-kosher" className="mv-section relative w-full overflow-hidden bg-bg-primary">
      <div className="mv-container relative z-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mv-panel relative overflow-hidden rounded-[2rem] px-6 py-12 md:rounded-[2.5rem] md:px-14 md:py-16"
        >
          <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-techelet/15 blur-[140px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[140px]" />

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mv-kicker !text-techelet">Mercav Kosher · kosher.mercav.lat</p>
              <h2 id="home-kosher" className="mv-h2 mt-5">
                Dónde comer, comprar y rezar, en cualquier ciudad.
                <span lang="he" dir="rtl" className="ml-3 align-middle font-display text-2xl text-techelet md:text-3xl">
                  מקום
                </span>
              </h2>
              <p className="mv-lead mt-5">
                El atlas comunitario de lugares kosher, sinagogas y kehilot de Latinoamérica, con tu kehilá a un mensaje de distancia. Entrás con
                tu cuenta Mercav de siempre.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {POINTS.map(({ icon: Icon, text }, i) => (
                  <motion.li
                    key={text}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.1 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
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
                <Link href="/kosher" className="mv-btn mv-btn-primary mv-btn-lg group">
                  Entrar a Mercav Kosher
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link href="/kosher/mapa" className="mv-btn mv-btn-secondary mv-btn-lg">
                  <MapPinned className="h-5 w-5" aria-hidden />
                  Ver el mapa
                </Link>
              </div>

              {places > 0 && (
                <p className="mt-6 text-sm text-[var(--text-tertiary)]">
                  {places} lugares en {cities} ciudades. Mercav Kosher no emite hechsher.
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
