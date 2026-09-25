"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { LegalDocument } from "@/lib/legal/documents";

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary pb-20 pt-28 text-white light:text-[#1a1714]">
      <div className="pointer-events-none fixed inset-0 opacity-20">
        <div className="absolute right-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-gold/10 blur-[150px]" />
      </div>
      <div className="container relative z-10 mx-auto max-w-3xl px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-14 text-center">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 transition-colors hover:text-gold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
          </Link>
          <h1 className="px-2 font-display text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">{doc.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 light:text-gray-600">{doc.subtitle}</p>
          {doc.badge ? (
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-600">{doc.badge}</p>
          ) : null}
        </motion.div>
        <div className="space-y-8">
          {doc.sections.map((section, i) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-3xl border border-white/10 bg-bg-secondary/40 p-8 light:border-black/10 light:bg-bg-secondary/80"
            >
              <h2 className="font-display text-lg font-bold text-white light:text-[#1a1714]">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-400 light:text-gray-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-gray-600">
          Este texto es informativo. Revisa con asesoría legal antes de operaciones reguladas.{" "}
          <Link href="/contacto" className="text-gold hover:underline">
            Contacto
          </Link>
        </p>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
