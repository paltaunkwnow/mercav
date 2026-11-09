import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { Mervi } from "@/components/mervi/Mervi";
import { CartelSection } from "@/components/site/cartel/primitives";

export default function NewsPage() {
  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <section className="border-b-2 border-[var(--c-line)] pt-[calc(var(--c-nav-h)+3rem)] pb-16 md:pb-20">
        <div className="c-container">
          <p className="c-label text-[var(--c-yellow-text)]">Mercav · News</p>
          <h1 className="c-display mt-4 text-[clamp(3rem,1.4rem+6vw,6.5rem)] leading-[0.95]">Lo que estamos construyendo.</h1>
          <p className="c-lead mt-6 max-w-3xl">Proyectos, hitos y noticias de nuestro equipo.</p>
        </div>
      </section>
      <CartelSection labelledBy="news-sweetberry">
        <article className="c-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)] lg:items-start lg:gap-16">
          <div>
            <p className="c-label text-[var(--c-yellow-text)]">31 de octubre de 2026 · Santa Cruz de la Sierra</p>
            <h2 id="news-sweetberry" className="c-h2 mt-3">SweetBerry gana el primer lugar en Cursor AI Security.</h2>
            <p className="c-body mt-6">En la AI Security Hackathon — Halloween Edition de Grok Bot Santa Cruz, nuestro equipo obtuvo el primer lugar y USD 240 en premios. Éramos tres personas presentando, aunque el mínimo anunciado para los equipos era cuatro. Construimos SweetBerry desde cero durante las seis horas del evento.</p>
            <p className="c-body mt-4"><span className="font-semibold text-[var(--c-text)]">Proyecto presentado por el equipo de Mercav:</span> Jaider Alejandro Pinto Ribera, Vinicius Salazar y Sebastian Rojas.</p>
            <h3 className="c-h3 mt-8">Un proyecto para los dos tracks</h3>
            <p className="c-body mt-3">Aplicamos IA ofensiva e IA defensiva en una infraestructura de laboratorio aislada, construida con contenedores y servicios que funcionan de verdad. Representamos una empresa ficticia —Northstar Systems— con identidades y datos sintéticos, una aplicación vulnerable y servicios expuestos. Sobre ese entorno ejecutamos un ataque realista y controlado; no fue un ataque contra una empresa o sistema externo.</p>
            <p className="c-body mt-4">SweetBerry observa cómo una persona, un script o un agente ofensivo recorre esa infraestructura y correlaciona señales de red, sesiones, procesos y archivos. A medida que avanza la interacción, adapta señuelos —como documentos, shares y objetos— para que el recorrido continúe y deje más evidencia que el SOC pueda investigar. Por eso describirlo solo como un “honeypot” se queda corto: es una plataforma de deception adaptativa con telemetría y análisis SOC asistido por IA.</p>
            <p className="c-body mt-4">El prototipo reúne servicios funcionales como Samba AD, OpenSSH y Gitea, junto a componentes emulados o fachadas como el cloud local y protocolos adicionales. Las reglas deterministas controlan los cambios; el modelo ayuda a investigar y redactar informes, sin administrar el laboratorio.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://github.com/Suredials/SWEET-BERRY" target="_blank" rel="noopener noreferrer" className="c-btn">Ver proyecto en GitHub <ArrowUpRight className="h-4 w-4" aria-hidden /></a>
              <a href="#tracks" className="c-btn c-btn-ghost">Conocer los tracks <ArrowRight className="h-4 w-4" aria-hidden /></a>
            </div>
          </div>
          <aside className="c-paste c-news-award p-5 sm:p-7" aria-label="SweetBerry obtuvo el primer lugar">
            <div className="c-news-award-top">
              <div className="c-news-brand"><span className="c-news-brand-dot" /> MERCAV PRESENTA <span className="c-news-brand-sep">/</span> SWEETBERRY</div>
              <Mervi pose="celebrando" scale={1} label="Mervi celebra el primer lugar" className="c-news-mervi" />
            </div>
            <div className="c-news-award-main">
              <div className="c-news-logo-stage"><img src="/images/news/sweetberry-logo.webp" alt="Logo de SweetBerry" width={384} height={384} decoding="async" className="c-news-logo h-24 w-24 object-contain sm:h-28 sm:w-28" /></div>
              <div className="c-news-award-copy"><p className="c-label">Cursor AI Security · Halloween Edition</p><p className="c-news-award-rank">#1 <span>PRIMER LUGAR</span></p><p className="c-news-award-title">SweetBerry</p><p className="c-news-award-subtitle">De cero a ganador en seis horas.</p></div>
            </div>
            <dl className="c-news-award-stats"><div><dd>$240</dd><dt>premio</dt></div><div><dd>3</dd><dt>personas</dt></div><div><dd>6 h</dd><dt>desde cero</dt></div></dl>
            <p className="c-news-award-team">Equipo Mercav <span>·</span> Jaider Alejandro, Vinicius Salazar y Sebastian Rojas</p>
          </aside>
        </article>
      </CartelSection>
      <CartelSection labelledBy="news-photo-title" className="!pt-0 !pb-14 md:!pb-20">
        <div className="c-container">
          <h2 id="news-photo-title" className="sr-only">El equipo SweetBerry en la hackathon</h2>
          <figure className="c-poster c-paste c-inverse mx-auto max-w-5xl p-2 sm:p-3" style={{ "--tilt": "-0.4deg" } as CSSProperties}>
            <div className="c-news-photo-stage">
              <img src="/images/news/sweetberry-hackathon.webp" alt="Las tres personas del equipo #EraConTUTO en la hackathon de seguridad de IA en UTEPSA, junto al letrero del equipo y una broma sobre los tokens agotados" width={1200} height={900} loading="lazy" decoding="async" className="aspect-[2/1] max-h-[28rem] w-full object-cover object-center" />
              <div className="c-news-starfield" aria-hidden="true">
                <span className="c-news-shooting-star c-news-shooting-star-one" />
                <span className="c-news-shooting-star c-news-shooting-star-two" />
                <span className="c-news-shooting-star c-news-shooting-star-three" />
                <span className="c-news-shooting-star c-news-shooting-star-four" />
              </div>
              <div className="c-news-huddle" aria-hidden="true">
                <img src="/images/news/sweetberry-team-mascots.webp" alt="" width={640} height={427} loading="lazy" decoding="async" />
              </div>
            </div>
            <figcaption className="c-label px-3 py-2.5 text-sm text-[var(--c-soft)]">#EraConTUTO en UTEPSA: el equipo que construyó SweetBerry.</figcaption>
          </figure>
        </div>
      </CartelSection>
      <CartelSection id="tracks" labelledBy="news-tracks-title" className="border-t-2 border-[var(--c-line)]">
        <div className="c-container">
          <p className="c-label text-[var(--c-yellow-text)]">Los dos tracks, en un solo proyecto</p>
          <h2 id="news-tracks-title" className="c-h2 mt-3 max-w-4xl">Un ataque realista en laboratorio. Evidencia para defender.</h2>
          <p className="c-body mt-5 max-w-4xl">La hackathon planteó dos retos complementarios. SweetBerry los conectó en un entorno aislado que representa una empresa completa: infraestructura en contenedores, servicios funcionales, superficies vulnerables intencionales y datos corporativos sintéticos.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="c-poster c-paste border-2 border-[var(--c-line)] p-6 sm:p-8">
              <p className="c-label text-[var(--c-orange-text)]">Track 01 · IA ofensiva</p>
              <h3 className="c-h3 mt-3">Simular el recorrido de un atacante.</h3>
              <p className="c-body mt-4">Probamos interacciones ofensivas contra objetivos diseñados para el laboratorio: consulta de identidades, búsqueda de documentos, acceso a servicios, repositorios y una aplicación vulnerable. Los pasos ocurren sobre contenedores y servicios operativos dentro de una red controlada; el objetivo es observar cómo progresa el ataque y qué señales deja.</p>
              <p className="c-body mt-4">La empresa representada es ficticia y usa datos sintéticos. La simulación no toca sistemas de terceros ni infraestructura productiva.</p>
            </article>
            <article className="c-poster c-paste border-2 border-[var(--c-line)] p-6 sm:p-8">
              <p className="c-label text-[var(--c-green-text)]">Track 02 · IA defensiva</p>
              <h3 className="c-h3 mt-3">Investigar el incidente con evidencia correlacionada.</h3>
              <p className="c-body mt-4">SweetBerry reúne telemetría de red, sesiones, procesos y aplicaciones para vincular solicitudes con acciones posteriores. El SOC asistido por IA resume evidencia y redacta investigaciones; las reglas del sistema controlan la respuesta y las adaptaciones permitidas.</p>
              <p className="c-body mt-4">Cuando el recorrido avanza, el laboratorio adapta documentos, shares y otros señuelos para mantener contexto y capturar más señales. El modelo no recibe control de shell, Docker ni firewall.</p>
            </article>
          </div>
          <p className="c-body mt-8 max-w-4xl">Por eso SweetBerry va más allá de un honeypot tradicional: es una plataforma de deception adaptativa con objetivos funcionales, observación independiente, correlación de evidencia y análisis SOC. Algunos componentes son servicios reales; otros son emuladores o fachadas, tal como documenta el README.</p>
        </div>
      </CartelSection>
      <section className="c-band c-ink-green py-12">
        <div className="c-container flex flex-wrap items-center justify-between gap-6"><p className="c-body">¿Querés conocer al equipo detrás de SweetBerry?</p><Link href="/nosotros" className="c-btn c-btn-ghost">Quiénes somos <ArrowRight className="h-4 w-4" aria-hidden /></Link></div>
      </section>
    </div>
  );
}
