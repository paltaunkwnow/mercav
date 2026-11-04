import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Users } from "@/components/icons";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection } from "@/components/site/cartel/primitives";

export const metadata = { title: "Mercav Kosher - Atlas de lugares y comunidad" };

export default function KosherLanding() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      {/* Hero */}
      <section className="relative pt-[calc(var(--c-nav-h)+3rem)] pb-20">
        <div className="c-container">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--c-soft)] hover:text-[var(--c-text)]">
            ← Volver
          </Link>

          <h1 className="c-display text-[clamp(2.8rem,1rem+8vw,7rem)] leading-[0.88] [text-wrap:balance] mb-6">
            Tu comunidad<span className="c-yellow"> conectada,</span>
            <br />
            en todas partes.
          </h1>
          <p className="c-lead max-w-2xl text-lg text-[var(--c-soft)]">
            Encuentra lugares kasher, eventos y comunidad en toda Latinoamérica. Información verificada, por la comunidad.
          </p>

          <div className="mt-10">
            <AuthCTA />
          </div>
        </div>
      </section>

      {/* Features */}
      <CartelSection className="!pb-20">
        <div className="c-container">
          <h2 className="c-h2 text-center mb-12">
            Descubre<span className="c-yellow">.</span>
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Atlas",
                desc: "Mapa interactivo con lugares kasher, sinagogas, mikvaot y kehilot verificadas.",
              },
              {
                icon: Calendar,
                title: "Calendario",
                desc: "Zmanim, jaguim y horarios de velas. Planificá tu Shabat con información exacta.",
              },
              {
                icon: Users,
                title: "Comunidad",
                desc: "Conecta con otros, encuentra eventos, minyan y soporte (chesed) en tu ciudad.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-2xl border-2 border-[var(--c-line)] bg-[var(--c-ground)] p-6 hover:border-[var(--c-yellow)] transition-colors">
                  <Icon className="h-8 w-8 text-[var(--c-yellow)] mb-4" aria-hidden />
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-[var(--c-soft)]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </CartelSection>

      {/* CTA */}
      <section className="relative py-20">
        <div className="c-container">
          <div className="rounded-2xl border-2 border-[var(--c-line)] bg-[var(--c-ground)] px-8 py-16 md:px-16 text-center hover:border-[var(--c-yellow)] transition-all">
            <h2 className="c-display text-[2rem] mb-4">
              Conectate<span className="c-yellow">.</span>
            </h2>
            <p className="text-[var(--c-soft)] mb-8 max-w-xl mx-auto">
              Crea una cuenta y accedé al atlas completo, zmanim personalizados y tu comunidad local.
            </p>
            <AuthCTA className="items-center sm:justify-center" />
          </div>
        </div>
      </section>
    </div>
  );
}
