import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Calculator,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Plus,
  ShoppingCart,
} from "@/components/icons";
import { ModuleGlyph } from "@/components/icons/ModuleGlyph";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { HostLink } from "@/components/layout/HostContext";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { BUSINESS_TYPES, defaultDesign } from "@/lib/business/loyalty/templates";
import { FOUNDERS } from "@/lib/data/team";
import { cn } from "@/lib/utils";
import { AuthCTA } from "@/components/site/cartel/AuthCTA";
import { CartelSection, FitLines, Starburst } from "@/components/site/cartel/primitives";
import { Mervi, type MerviPose } from "@/components/mervi/Mervi";
import { FlipHint } from "@/components/site/cartel/FlipHint";
import { PillarNav, RegionPicker, ShabbatPicker, type CountryInfo, type ShabbatCity } from "./LandingClient";
import { BookingPicker, KosherPhone, PhoneDemo, type PhoneDemoData } from "./LandingDemos";

export type { PayslipDemo } from "@/lib/business/bolivia/payslip-demo";
import type { PayslipDemo } from "@/lib/business/bolivia/payslip-demo";
export type KevItem = { cveId: string; cvss: number | null; published: string | null; url: string };
export type PlaceItem = { name: string; city: string; type: string; status: string; certified: boolean };

export type LandingData = {
  payslip: PayslipDemo;
  pwnSources: string[];
  kevs: KevItem[];
  places: PlaceItem[];
  shabbat: ShabbatCity[];
  countries: CountryInfo[];
  country: string;
  /** El país salió de la IP (encabezado del hosting); si no, el navegador lo deduce por la zona horaria. */
  detected: boolean;
  phone: PhoneDemoData;
  /** Primer día del selector de fechas de Publicidad (hoy, yyyy-mm-dd). */
  today: string;
};

const cafe = BUSINESS_TYPES.find((t) => t.key === "CAFE") ?? BUSINESS_TYPES[0];
const CAFE_DESIGN = defaultDesign(cafe, "Café La Esquina");

function hourIn(iso: string | null, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
}

/* ------------------------------------------------------------------ */
/* Stickers del hero                                                   */
/* ------------------------------------------------------------------ */

function PayslipSticker({ payslip }: { payslip: PayslipDemo }) {
  return (
    <div className="c-sticker c-inverse w-[15.5rem] p-4 text-left" style={{ "--tilt": "5deg" } as CSSProperties}>
      <p className="c-label text-[0.95rem]">Boleta · octubre 2026</p>
      <dl className="mt-2 grid gap-1 text-[0.85rem]">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--c-soft)]">Total ganado</dt>
          <dd className="c-num">{payslip.gross}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--c-soft)]">Descuentos</dt>
          <dd className="c-num">− {payslip.deductions}</dd>
        </div>
      </dl>
      <p className="mt-2 flex items-end justify-between border-t-2 border-[var(--c-text)] pt-2">
        <span className="c-label text-[0.9rem]">Líquido</span>
        <span className="c-display c-num text-[1.7rem] normal-case leading-none">{payslip.net}</span>
      </p>
    </div>
  );
}

function PwnSticker() {
  return (
    <div className="c-sticker c-pwn w-[15rem] p-4 text-left" style={{ "--tilt": "6deg" } as CSSProperties}>
      <p className="c-label flex items-center gap-2 text-[0.95rem] text-[var(--c-green-text)]">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Pwn · monitoreo
      </p>
      <p className="mt-2 font-mono text-[0.85rem]">tuempresa.com</p>
      <p className="mt-1 text-[0.85rem] text-[var(--c-soft)]">Sin filtraciones nuevas esta semana.</p>
      <p className="mt-2 text-[0.7rem] text-[var(--c-muted)]">Ejemplo</p>
    </div>
  );
}

function KosherSticker({ shabbat }: { shabbat: ShabbatCity | undefined }) {
  if (!shabbat) return null;
  return (
    <div className="c-sticker c-kosher w-[14rem] p-4 text-left" style={{ "--tilt": "-4deg" } as CSSProperties}>
      <p className="c-label flex items-center gap-2 text-[0.95rem] text-[var(--k-ink)]">
        <StarOfDavid className="h-4 w-4" />
        Kosher · {shabbat.city}
      </p>
      <p className="mt-2 text-[0.8rem] text-[var(--c-soft)]">Velas de Shabat</p>
      <p className="c-display c-num text-[2.2rem] leading-none text-[var(--c-yellow-text)]">{hourIn(shabbat.candles, shabbat.timezone)}</p>
      {shabbat.parasha ? <p className="mt-1 text-[0.8rem] text-[var(--c-soft)]">{shabbat.parasha}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function LandingHero({ data }: { data: LandingData }) {
  const laPaz = data.shabbat[0];
  return (
    <section aria-labelledby="hero-title" className="relative pt-[calc(var(--c-nav-h)+2.5rem)] md:pt-[calc(var(--c-nav-h)+4rem)]">
      <div className="c-container flex flex-col items-center text-center">
        <h1 id="hero-title" className="c-display text-[clamp(2.9rem,1rem+8vw,8.6rem)] leading-[0.84] [text-wrap:balance]">
          <span className="block">Tu negocio entero,</span>
          <span className="c-display c-text-yellow inline-block px-2">en una sola cuenta.</span>
        </h1>
        <p className="c-lead mx-auto mt-7 text-center">Elegí cómo querés empezar: operar un negocio, proteger tu información o encontrar tu comunidad Kosher.</p>
        <AuthCTA className="mt-9 items-center sm:justify-center" />
        <nav aria-label="Elegí cómo usar Mercav" className="mt-7 grid w-full max-w-3xl gap-2 text-left sm:grid-cols-3">
          <a href="#pilar-business" className="c-focus rounded-[1rem] border-2 border-[var(--c-line)] bg-[var(--c-ground)] p-3 transition-colors hover:border-[var(--c-yellow)] hover:bg-[var(--c-raised)]">
            <span className="c-label block text-[0.9rem] text-[var(--c-yellow-text)]">Quiero vender</span>
            <span className="mt-1 block text-sm font-semibold">Caja, catálogo y página de mi negocio</span>
          </a>
          <a href="#pilar-pwn" className="c-focus rounded-[1rem] border-2 border-[var(--c-line)] bg-[var(--c-ground)] p-3 transition-colors hover:border-[var(--c-green)] hover:bg-[var(--c-raised)]">
            <span className="c-label block text-[0.9rem] text-[var(--c-green-text)]">Quiero protegerme</span>
            <span className="mt-1 block text-sm font-semibold">Alertas de filtraciones y vulnerabilidades</span>
          </a>
          <a href="#pilar-kosher" className="c-focus rounded-[1rem] border-2 border-[var(--c-line)] bg-[var(--c-ground)] p-3 transition-colors hover:border-[#8db4ec] hover:bg-[var(--c-raised)]">
            <span className="c-label block text-[0.9rem] text-[#8db4ec]">Quiero Kosher</span>
            <span className="mt-1 block text-sm font-semibold">Atlas, horarios y comunidad</span>
          </a>
        </nav>
      </div>

      <div className="relative mx-auto mt-32 flex w-full max-w-[76rem] justify-center pb-6 lg:mt-20">
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <div className="c-drift-l absolute left-[4%] top-[6%]">
            <div className="c-float" style={{ "--float-s": "6.4s", "--float-d": "-1.2s" } as CSSProperties}>
              <div className="c-sticker w-[17rem] overflow-hidden rounded-[1.1rem]" style={{ "--tilt": "-8deg" } as CSSProperties}>
                <LoyaltyCard design={CAFE_DESIGN} type="STAMPS" stampsGoal={10} rewardName={cafe.rewardName} balance={7} customerName="Lucía" side="back" size="sm" className="w-full" />
              </div>
            </div>
          </div>
          <div className="c-drift-l absolute bottom-[14%] left-[9%]">
            <div className="c-float" style={{ "--float-s": "5.6s", "--float-d": "-3s" } as CSSProperties}>
              <PayslipSticker payslip={data.payslip} />
            </div>
          </div>
          <div className="c-drift-r absolute right-[2%] top-[26%]">
            <div className="c-float" style={{ "--float-s": "7s", "--float-d": "-2.2s" } as CSSProperties}>
              <PwnSticker />
            </div>
          </div>
          <div className="c-drift-r absolute bottom-[6%] right-[7%]">
            <div className="c-float" style={{ "--float-s": "6s", "--float-d": "-4.1s" } as CSSProperties}>
              <KosherSticker shabbat={laPaz} />
            </div>
          </div>
        </div>
        <figure className="relative z-10 flex flex-col items-center">
          <Mervi
            pose="saludando"
            scale={1}
            scaleLg={2}
            label="Mervi, la mascota de Mercav, te saluda"
            className="absolute -top-[calc(var(--mervi-unit)*91)] right-3 z-20 lg:-right-[calc(var(--mervi-unit)*84)] lg:top-[calc(var(--mervi-unit)*6)]"
          />
          <div className="c-float" style={{ "--float-s": "6.8s", "--float-amp": "-12px" } as CSSProperties}>
            <PhoneDemo data={data.phone} />
          </div>
          <figcaption className="c-label mt-6 flex items-center gap-2 text-[1rem] text-[var(--c-soft)]">
            <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-[var(--c-yellow)] motion-reduce:animate-none" />
            Probala: tocá cualquier módulo
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/** Una cinta torcida, como la que sostiene un afiche, con los módulos corriendo. */
export function LandingMarquee() {
  const items = ["Mercav Business", "Mercav Pwn", "Mercav Kosher", "Caja", "Planillas", "Fidelización", "Publicidad", "Empleos", "Calendario hebreo", "20 países"];
  const tape = (k: number) => (
    <ul key={k} aria-hidden={k === 1 || undefined} className="flex shrink-0 items-center">
      {items.concat(items).map((t, i) => (
        <li key={`${t}-${i}`} className="c-display flex items-center gap-5 pr-5 text-[clamp(1.35rem,1rem+1.4vw,2.2rem)]">
          {t}
          <Starburst className="h-[0.5em] w-[0.5em]" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative flex h-[7rem] items-center overflow-hidden md:h-[8.5rem]" role="presentation">
      <div className="c-band c-ink-magenta c-marquee c-tape -mx-[5%] w-[110%] -rotate-[2.5deg] py-2.5" style={{ "--marquee-s": "48s" } as CSSProperties}>
        <div className="c-marquee-track">{[0, 1].map((k) => tape(k))}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tres apps, una cuenta                                               */
/* ------------------------------------------------------------------ */

export function LandingPillars({ data }: { data: LandingData }) {
  return (
    <>
      <CartelSection labelledBy="apps-title" className="!pb-20">
        <div className="c-container grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <h2 id="apps-title" className="c-h2 max-w-[34rem]">
            <span className="block">Elegí tu</span>
            <span className="c-text-magenta block">punto de partida.</span>
          </h2>
          <p className="c-lead min-w-0 lg:pb-3">No hace falta usar todo Mercav. Business, Pwn y Kosher resuelven necesidades distintas y se abren con el mismo perfil cuando lo necesités.</p>
        </div>
      </CartelSection>
      <div className="relative">
        <BusinessPillar data={data} />
        <PwnPillar data={data} />
        <KosherPillar data={data} />
        <PillarNav className="-mt-[4.5rem]" />
      </div>
    </>
  );
}

function PillarHead({ app, mark, title, lead, href, cta, button, id }: { app: string; mark: ReactNode; title: ReactNode; lead: string; href: string; cta: string; button: string; id: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
      <h2 id={id} className="c-display text-[clamp(2.8rem,1.4rem+5vw,6.2rem)] [text-wrap:balance]">
        {title}
      </h2>
      <div className="flex flex-col items-start gap-6 lg:pb-3">
        <p className="c-label inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4 text-[1.1rem] shadow-[inset_0_0_0_2px_currentColor]">
          <span className="grid h-7 w-7 place-items-center" aria-hidden>
            {mark}
          </span>
          {app}
        </p>
        <p className="max-w-[34rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">{lead}</p>
        <HostLink href={href} className={cn("c-btn", button)}>
          {cta}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </HostLink>
      </div>
    </div>
  );
}

function BusinessPillar({ data }: { data: LandingData }) {
  const tools = [
    { icon: FileText, name: "Contratos" },
    { icon: Calculator, name: "ROI" },
    { icon: Tag, name: "Precios" },
    { icon: Search, name: "SEO" },
    { icon: Palette, name: "Paletas" },
    { icon: Sparkles, name: "Prompts" },
    { icon: CalendarDays, name: "Feriados" },
  ];
  const roles = [
    { name: "Dueño", initials: "LC", does: "Todo" },
    { name: "Encargado", initials: "JR", does: "Caja, inventario y reportes" },
    { name: "Empleado", initials: "AS", does: "Vende con su cuenta" },
    { name: "Contador", initials: "MV", does: "Planillas y reportes" },
  ];
  // Ejemplo del reporte de la caja: cada uno vende con su cuenta (rotulado como ejemplo).
  const shift = [
    { name: "Lucía", sales: 6, total: "Bs 180,00" },
    { name: "Mateo", sales: 3, total: "Bs 90,00" },
  ];
  return (
    <section id="pilar-business" aria-labelledby="business-title" className="c-band c-ink-yellow scroll-mt-[var(--c-nav-h)]">
      <div className="c-container pb-24 pt-28 md:pb-32 md:pt-36">
        <PillarHead
          id="business-title"
          app="Mercav Business"
          mark={<ModuleGlyph name="business" size={24} />}
          title="Empezá a vender sin empezar por lo complicado."
          lead="Creá tu espacio, cargá lo que ofrecés y elegí si vender en caja o compartir tu página. Equipo, planillas y fidelización llegan cuando los necesités."
          href="/business"
          cta="Abrir Business"
          button="c-btn-ink"
        />
        <ol className="mt-14 grid gap-3 md:grid-cols-3 lg:mt-20">
          {[
            { step: "01", title: "Creá tu negocio", body: "Empezá solo con el nombre y el país. Los datos fiscales y el equipo pueden esperar.", href: "/business", cta: "Preparar mi negocio" },
            { step: "02", title: "Cargá lo que vendés", body: "Agregá nombre y precio. Podés completar costo, foto, stock y códigos después.", href: "/caja", cta: "Conocer la caja" },
            { step: "03", title: "Vendé o compartí", body: "Abrí caja cuando llegue una venta o compartí tu página pública con menú y contacto.", href: "/business", cta: "Empezar a vender" },
          ].map((item) => (
            <li key={item.step} className="c-tile c-night flex min-h-[15rem] flex-col p-6">
              <span className="c-display text-[2.5rem] leading-none text-[var(--c-yellow-text)]">{item.step}</span>
              <h3 className="c-h3 mt-5">{item.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--c-soft)]">{item.body}</p>
              <HostLink href={item.href} className="c-link mt-auto inline-flex w-fit min-h-11 items-center font-semibold">{item.cta}<ArrowRight className="ml-2 h-4 w-4" aria-hidden /></HostLink>
            </li>
          ))}
        </ol>
        <section className="mt-16 border-t-2 border-[var(--c-line)] pt-10 lg:mt-20 lg:pt-14" aria-labelledby="business-grow-title">
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end md:gap-10">
            <div>
              <p className="c-label text-[1rem] text-[var(--c-yellow-text)]">ELEGÍ LO QUE QUERÉS HACER</p>
              <h3 id="business-grow-title" className="c-h2 mt-2">Elegí lo que necesitás hoy.</h3>
            </div>
            <p className="max-w-[42rem] text-[1rem] leading-relaxed text-[var(--c-soft)]">No necesitás usar todo. Elegí una necesidad y Mercav te acompaña con lo justo para resolverla. Podés volver por las demás cuando te sirvan.</p>
          </div>
          <ol className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              { step: "01", title: "Quiero vender hoy", body: "Caja, productos y tu página para compartir.", icon: ShoppingCart },
              { step: "02", title: "Quiero ordenar mi negocio", body: "Planillas y equipo para trabajar sin enredos.", icon: FileText },
              { step: "03", title: "Quiero hacerlo crecer", body: "Clientes que vuelven, publicidad, servicios y empleos.", icon: Sparkles },
            ].map(({ step, title, body, icon: Icon }) => (
              <li key={step} className="c-tile c-night flex min-h-[11rem] flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="c-label text-[0.95rem] text-[var(--c-yellow-text)]">{step}</span>
                  <Icon className="h-6 w-6 text-[var(--c-yellow-text)]" aria-hidden />
                </div>
                <h4 className="mt-5 text-[1.25rem] font-semibold leading-tight text-[var(--c-text)]">{title}</h4>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--c-soft)]">{body}</p>
              </li>
            ))}
          </ol>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:auto-rows-[minmax(15.5rem,auto)] lg:grid-cols-4">
          <article className="c-tile c-night flex flex-col gap-5 p-7 md:col-span-2 lg:row-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="c-label text-[0.9rem] text-[var(--c-yellow-text)]">PARA ORDENAR TU NEGOCIO</p>
                <h3 className="c-h3">
                  <Link href="/planillas" className="underline-offset-[0.2em] hover:underline">
                    Pagá a tu equipo sin cuentas manuales
                  </Link>
                </h3>
                <p className="mt-2 max-w-[24rem] text-[0.98rem] text-[var(--c-soft)]">Aportes, RC-IVA y antigüedad calculados solos. Exportás a Excel y cada trabajador ve su boleta.</p>
              </div>
              <ModuleGlyph name="business" size={48} className="shrink-0 text-[var(--c-yellow-text)]" />
            </div>
            <div className="c-inverse mt-auto rounded-[1.1rem] p-5">
              <div className="flex items-center justify-between">
                <p className="c-label text-[1rem]">Boleta · octubre 2026</p>
                <span className="c-label rounded-full bg-[var(--c-green)] px-2 py-0.5 text-[0.85rem] text-[#0b0a09]">Calculada</span>
              </div>
              <dl className="mt-3 divide-y divide-[var(--c-line)] text-[0.92rem]">
                {data.payslip.rows.map((r) => (
                  <div key={r.label} className={cn("flex justify-between gap-4 py-2", r.strong && "font-semibold")}>
                    <dt className={cn(!r.strong && "text-[var(--c-soft)]")}>{r.label}</dt>
                    <dd className="c-num whitespace-nowrap">{r.minus ? `− ${r.value}` : r.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-1 flex items-end justify-between border-t-2 border-[var(--c-text)] pt-3">
                <span className="c-label text-[1rem]">Líquido pagable</span>
                <span className="c-display c-num text-[2.3rem] normal-case leading-none">{data.payslip.net}</span>
              </p>
            </div>
            <p className="max-w-[34rem] text-[0.85rem] leading-relaxed text-[var(--c-muted)]">{data.payslip.note}</p>
          </article>

          <article className="c-tile c-band c-ink-magenta flex flex-col gap-5 p-7 sm:flex-row sm:items-center md:col-span-2">
            <div className="flex-1">
              <p className="c-label text-[0.9rem]">PARA HACERLO CRECER</p>
              <h3 className="c-h3">
                  <Link href="/fidelizacion" className="underline-offset-[0.2em] hover:underline">
                    Hacé que tus clientes vuelvan
                  </Link>
                </h3>
              <p className="mt-2 text-[0.98rem] text-[var(--c-soft)]">Tarjetas de sellos o puntos con tu logo. Tus clientes se suman con un QR y las guardan en su cuenta.</p>
              <p className="c-label mt-3 text-[1.05rem]">19 rubros listos · MercavClub</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="w-[15rem] rotate-[-4deg] motion-reduce:rotate-0">
                <LoyaltyCard design={CAFE_DESIGN} type="STAMPS" stampsGoal={10} rewardName={cafe.rewardName} balance={7} customerName="Lucía" side="flip" size="sm" className="w-full" />
              </div>
              <FlipHint />
            </div>
          </article>

          <article className="c-tile c-night flex flex-col gap-5 p-7 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="c-label text-[0.9rem] text-[var(--c-yellow-text)]">PARA VENDER HOY</p>
                <h3 className="c-h3">
                  <Link href="/caja" className="underline-offset-[0.2em] hover:underline">
                    Cobrá y registrá tus ventas
                  </Link>
                </h3>
                <p className="mt-2 max-w-[26rem] text-[0.98rem] text-[var(--c-soft)]">Vendé desde el celular o la compu, con o sin conexión. El reporte te dice quién vendió qué.</p>
              </div>
              <ShoppingCart className="h-10 w-10 shrink-0 text-[var(--c-yellow-text)]" aria-hidden />
            </div>
            <div className="c-inverse rounded-[1.1rem] p-5">
              <div className="flex items-center justify-between">
                <p className="c-label text-[1rem]">Turno de hoy · por persona</p>
                <span className="c-label text-[0.85rem] text-[var(--c-muted)]">Ejemplo</span>
              </div>
              <ul className="mt-3 divide-y divide-[var(--c-line)] text-[0.92rem]">
                {shift.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-4 py-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[var(--c-soft)]">{p.sales} ventas</span>
                    <span className="c-num whitespace-nowrap font-semibold">{p.total}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="mt-auto flex flex-wrap gap-2">
              {["Lector de códigos", "Ticket por WhatsApp", "Inventario con alertas"].map((t) => (
                <li key={t} className="rounded-full px-3 py-1.5 text-[0.85rem] font-semibold shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">
                  {t}
                </li>
              ))}
            </ul>
          </article>

          <article className="c-tile c-inverse flex flex-col gap-4 p-6">
            <p className="c-label text-[0.9rem] text-[var(--c-yellow-text)]">PARA ORDENAR TU NEGOCIO</p>
            <h3 className="c-h3">Invitá a tu equipo</h3>
            <ul className="flex flex-col gap-2.5">
              {roles.map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <span className="c-label grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--c-yellow)] text-[0.85rem] text-[#0b0a09]">{r.initials}</span>
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-semibold leading-tight">{r.name}</span>
                    <span className="block text-[0.8rem] leading-tight text-[var(--c-soft)]">{r.does}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-auto text-[0.82rem] text-[var(--c-muted)]">Los sumás con un link de invitación.</p>
          </article>

          <article className="c-tile c-band c-ink-orange flex flex-col gap-4 p-6">
            <div>
              <p className="c-label text-[0.9rem]">PARA HACERLO CRECER</p>
              <h3 className="c-h3">Mostrá tu negocio a más gente</h3>
              <p className="mt-1 text-[0.92rem] text-[var(--c-soft)]">Vallas y pantallas con reserva por fechas. Probá elegir las tuyas.</p>
              <p className="c-label mt-2 text-[0.95rem]">Primer alquiler sin comisión</p>
            </div>
            <BookingPicker start={data.today} />
          </article>

          <article className="c-tile c-band c-ink-green flex flex-col p-6">
            <p className="c-label text-[0.9rem]">PARA HACERLO CRECER</p>
            <h3 className="c-h3">Contratá servicios con pagos protegidos</h3>
            <p className="mt-1 text-[0.92rem] text-[var(--c-soft)]">El pago se libera hito por hito.</p>
            <ol className="mt-auto grid gap-2 text-[0.9rem]">
              {[
                ["Diseño de marca", "Liberado", true],
                ["Sitio web", "En revisión", false],
                ["Campaña", "Retenido", false],
              ].map(([label, state, done]) => (
                <li key={label as string} className="flex items-center gap-2">
                  <span className={cn("grid h-5 w-5 place-items-center rounded-full", done ? "bg-[#0b0a09] text-[var(--c-green)]" : "shadow-[inset_0_0_0_2px_#0b0a09]")}>
                    {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
                  </span>
                  <span className="flex-1 font-semibold">{label}</span>
                  <span className="text-[0.8rem]">{state}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="c-tile c-inverse flex flex-col p-6">
            <p className="c-label text-[0.9rem] text-[var(--c-yellow-text)]">PARA HACERLO CRECER</p>
            <h3 className="c-h3">Publicá una vacante</h3>
            <div className="c-band c-ink-yellow mt-auto -rotate-2 rounded-[0.9rem] p-4 motion-reduce:rotate-0">
              <p className="c-display text-[1.7rem] leading-[0.9]">Se busca encargada de ventas</p>
              <p className="mt-2 text-[0.8rem]">Salario visible · postulaciones a tu panel</p>
            </div>
          </article>

        </div>
        <article className="c-tile c-night mt-4 flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="shrink-0">
            <p className="c-label text-[0.9rem] text-[var(--c-yellow-text)]">PARA TAREAS PUNTUALES</p>
            <h3 className="c-h3">Herramientas útiles cuando las necesitás</h3>
            <p className="mt-1 text-[0.92rem] text-[var(--c-soft)]">Las siete de hoy, incluidas según tu plan.</p>
          </div>
          <ul className="flex flex-wrap gap-2 lg:justify-end">
            {tools.map(({ icon: Icon, name }) => (
              <li key={name} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.9rem] font-semibold shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">
                <Icon className="h-4 w-4 text-[var(--c-yellow-text)]" aria-hidden />
                {name}
              </li>
            ))}
          </ul>
        </article>
        </section>
      </div>
    </section>
  );
}

function PwnPillar({ data }: { data: LandingData }) {
  // Un vistazo da confianza sin convertir la portada en un panel técnico.
  const shown = data.pwnSources.slice(0, 6);
  const PHONE = 6;
  const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso)) : "");
  return (
    <section id="pilar-pwn" aria-labelledby="pwn-title" className="c-pwn scroll-mt-[var(--c-nav-h)]">
      <div className="c-container pb-24 pt-28 md:pb-32 md:pt-36">
        <PillarHead
          id="pwn-title"
          app="Mercav Pwn"
          mark={<ModuleGlyph name="pwn" size={24} className="text-[var(--c-green-text)]" />}
          title={
            <>
              Enterate <span className="c-text-green">antes</span> que nadie.
            </>
          }
          lead="Pwn revisa fuentes públicas y te avisa si los correos o el dominio de tu empresa aparecen en una filtración. También sigue las vulnerabilidades que se están explotando, para que sepas qué parchear primero."
          href="/pwn"
          cta="Abrir Pwn"
          button="[--btn-bg:#2ee06f]"
        />

        <figure className="mt-14 lg:mt-20">
          <div className="overflow-hidden rounded-[1.75rem] bg-[var(--c-raised)] shadow-[inset_0_0_0_1px_var(--c-line-strong),0_40px_80px_-48px_rgba(46,224,111,0.35)]">
            <div className="flex flex-col gap-4 border-b border-[var(--c-line)] p-5 sm:p-6 md:flex-row md:items-center md:gap-8 md:px-8">
              <p className="c-label shrink-0 text-[1.05rem] text-[var(--c-muted)]">Consulta de exposición</p>
              <div className="flex flex-1 items-center gap-3 rounded-full bg-[var(--c-ground)] px-5 py-3 shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">
                <Search className="h-5 w-5 shrink-0 text-[var(--c-green-text)]" aria-hidden />
                <span className="c-typed font-mono text-[1rem]">tuempresa.com</span>
              </div>
            </div>
            <ul className="grid gap-x-8 px-5 pb-2 pt-3 sm:grid-cols-2 sm:px-6 md:px-8 lg:grid-cols-3 lg:gap-x-10">
              {shown.map((s, i) => (
                <li
                  key={s}
                  className={cn("c-scan-row flex min-w-0 items-center justify-between gap-3 border-b border-[var(--c-line)] py-3 text-[0.95rem]", i >= PHONE && "max-sm:hidden")}
                  style={{ "--d": i % 3 } as CSSProperties}
                >
                  <span className="min-w-0 truncate">{s}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[0.85rem] text-[var(--c-green-text)]">
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                    Revisada
                  </span>
                </li>
              ))}
              {data.pwnSources.length > PHONE ? (
                <li
                  className={cn("c-scan-row flex items-center border-b border-[var(--c-line)] py-3 text-[0.95rem] text-[var(--c-muted)]", data.pwnSources.length <= shown.length && "sm:hidden")}
                  style={{ "--d": 2 } as CSSProperties}
                >
                  <span className="sm:hidden">y {data.pwnSources.length - PHONE} fuentes más</span>
                  {data.pwnSources.length > shown.length ? <span className="max-sm:hidden">y {data.pwnSources.length - shown.length} fuentes más</span> : null}
                </li>
              ) : null}
            </ul>
            <div
              className="c-scan-row m-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-[1.1rem] bg-[#2ee06f] px-5 py-4 text-[#0b0a09] sm:m-6 md:mx-8 md:mb-8"
              style={{ "--d": 3 } as CSSProperties}
            >
              <p className="c-label flex items-center gap-3 text-[1.35rem] md:text-[1.7rem]">
                <ShieldCheck className="h-6 w-6 shrink-0" aria-hidden />
                Sin filtraciones nuevas
              </p>
              <p className="c-label text-[1rem]">{data.pwnSources.length} fuentes revisadas</p>
            </div>
          </div>
          <figcaption className="mt-3 text-[0.8rem] text-[var(--c-muted)]">
            Ejemplo de una consulta con las fuentes que Pwn revisa de verdad. El detalle solo lo ve quien verificó que el correo o el dominio es suyo.
          </figcaption>
        </figure>

        {data.kevs.length > 0 ? (
          <details className="group mt-10">
            <summary className="c-focus flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-[1rem] border border-[var(--c-line-strong)] px-5 py-3 font-semibold marker:content-none">
              <span>Ver vulnerabilidades explotadas ahora</span>
              <Plus className="h-5 w-5 shrink-0 text-[var(--c-green-text)] transition-transform group-open:rotate-45" aria-hidden />
            </summary>
          <div className="mt-6">
            <p className="c-label text-[1.05rem] text-[var(--c-magenta-text)]">Explotadas ahora, según CISA KEV</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.kevs.map((k) => (
                <li key={k.cveId}>
                  <a
                    href={k.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col gap-4 rounded-[1.1rem] p-5 shadow-[inset_0_0_0_1px_var(--c-line-strong)] transition-[box-shadow,color] duration-200 hover:text-[var(--c-green-text)] hover:shadow-[inset_0_0_0_1.5px_var(--c-green-text)]"
                  >
                    <span className="font-mono text-[1rem]">{k.cveId}</span>
                    <span className="mt-auto flex items-center gap-3 text-[0.85rem] text-[var(--c-soft)]">
                      {k.cvss != null ? <span className="c-num rounded-full px-2 py-0.5 shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">CVSS {k.cvss.toFixed(1)}</span> : null}
                      {date(k.published)}
                      <ArrowRight className="ml-auto h-4 w-4" aria-hidden />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.8rem] text-[var(--c-muted)]">Datos públicos del catálogo de vulnerabilidades explotadas de CISA, tal como los guarda Pwn.</p>
          </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}

function KosherPillar({ data }: { data: LandingData }) {
  return (
    <section id="pilar-kosher" aria-labelledby="kosher-title" className="c-kosher scroll-mt-[var(--c-nav-h)]">
      <div className="c-container pb-24 pt-28 md:pb-32 md:pt-36">
        <PillarHead
          id="kosher-title"
          app="Mercav Kosher"
          mark={<StarOfDavid className="h-5 w-5 text-[var(--k-ink)]" />}
          title={
            <>
              Dónde comer, comprar y rezar <span className="text-[var(--k-ink)]">en cada ciudad.</span>
            </>
          }
          lead="Un atlas de lugares kosher, sinagogas y kehilot de Latinoamérica, con el estado de cada lugar y quién lo respalda. Mercav no emite hejsher: muestra la fuente."
          href="/kosher"
          cta="Abrir el atlas"
          button="[--btn-bg:#8db4ec] [--btn-fg:#0a1626]"
        />
        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <figure className="relative mx-auto">
            <Mervi pose="libro" scale={1} scaleLg={2} className="absolute -left-10 bottom-10 z-20 lg:-left-40" />
            <KosherPhone places={data.places} />
            <figcaption className="mt-4 text-center text-[0.8rem] text-[var(--c-muted)]">Lugares publicados hoy en el atlas. Tocá una ciudad, un punto o un lugar.</figcaption>
          </figure>
          <div className="flex flex-col gap-5">
            <ShabbatPicker cities={data.shabbat} />
            <p className="max-w-[34rem] text-[0.98rem] leading-relaxed text-[var(--c-soft)]">
              También trae el calendario hebreo, un modo Shabat que deja la app en solo lectura y chat por ciudad con las kehilot de la región.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 20 países                                                           */
/* ------------------------------------------------------------------ */

export function LandingRegion({ data }: { data: LandingData }) {
  return (
    <section aria-labelledby="region-title" className="c-inverse py-20 md:py-28 lg:py-32">
      <div className="c-container">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-end md:gap-14">
          <h2 id="region-title" className="c-h2">
            Hecho para 20 países.
          </h2>
          <p className="c-lead md:pb-2">Feriados, monedas y normas de cada país. Las planillas ya siguen las reglas de Bolivia; los demás países llegan de a uno.</p>
        </div>
        <div className="mt-14 md:mt-20">
          <RegionPicker countries={data.countries} initial={data.country} detected={data.detected} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mervi                                                               */
/* ------------------------------------------------------------------ */

export function LandingMervi() {
  const poses: { pose: MerviPose; label: string }[] = [
    { pose: "saludando", label: "Bienvenida" },
    { pose: "programador", label: "Tecnología" },
    { pose: "comunidad", label: "Comunidad" },
    { pose: "pensativo", label: "Ideas" },
    { pose: "cool", label: "Cool" },
    { pose: "durmiendo", label: "Descanso" },
  ];
  return (
    <section aria-labelledby="mervi-title" className="c-band c-ink-orange overflow-hidden py-20 md:py-28">
      <div className="c-container">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end md:gap-14">
          <h2 id="mervi-title" className="c-h2">
            Conocé a Mervi.
          </h2>
          <p className="max-w-[34rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)] md:pb-2">
            El compañero de Mercav: te recibe en la app, festeja cuando cerrás una planilla y te ayuda cuando buscás algo. Curioso, simpático y bastante tecnológico.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-3 gap-y-8 md:mt-16 lg:grid-cols-6">
          {poses.map((p) => (
            <li key={p.pose} className="flex flex-col items-center gap-2">
              <Mervi pose={p.pose} scale={1} scaleLg={2} label={`Mervi: ${p.label.toLowerCase()}`} />
              <span className="c-label text-[1rem]">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Confianza                                                           */
/* ------------------------------------------------------------------ */

export function LandingTrust() {
  return (
    <CartelSection labelledBy="trust-title">
      <div className="c-container grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h2 id="trust-title" className="c-h2">
            Hay personas detrás.
          </h2>
          <p className="c-body max-w-[30rem]">Vinicius Salazar fundó Mercav en Santa Cruz de la Sierra y lo construye con su equipo. Podés leer quiénes son y escribirles.</p>
          <HostLink href="/nosotros" className="c-link inline-flex w-fit items-center gap-2 font-semibold">
            Conocer al equipo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </HostLink>
        </div>
        <ul className="border-t-2 border-[var(--c-line)]">
          {FOUNDERS.map((f) => (
            <li key={f.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-[var(--c-line)] py-4">
              <span className={cn("c-display text-[1.9rem] leading-none md:text-[2.4rem]", f.lead && "c-text-yellow")}>{f.name}</span>
              <span className="c-label text-[1rem] text-[var(--c-muted)]">{f.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </CartelSection>
  );
}

/** Servicios profesionales de seguridad, contratados y autorizados por cada empresa. */
export function LandingSecurityServices() {
  return (
    <CartelSection labelledBy="security-services-title" className="border-t-2 border-[var(--c-line)]">
      <div className="c-container grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
        <div className="max-w-3xl">
          <p className="c-label text-[var(--c-green-text)]">Mercav · Seguridad para empresas</p>
          <h2 id="security-services-title" className="c-h2 mt-3">Probá tus defensas con un equipo autorizado.</h2>
          <p className="c-body mt-5 max-w-2xl">Pentesting ético, auditorías de seguridad y respuesta a incidentes, con alcance acordado y trabajo bajo contrato de confidencialidad.</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--c-muted)]">El alcance, los datos, las evidencias y los contratos se tratan de forma confidencial y con acceso limitado al equipo asignado. No envíes información técnica sensible por canales públicos.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/ciberseguridad" className="c-btn">Conocer los servicios <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href="/nosotros#jaider" className="c-btn c-btn-ghost">Conocer al equipo</Link>
          </div>
        </div>
        <img src="/mervi/pentester-duo.webp" alt="Mervi y el gato tuxedo de Jaider colaboran en una prueba de penetración autorizada" width={704} height={587} loading="lazy" decoding="async" className="mx-auto w-[min(22rem,76vw)] drop-shadow-[0_1rem_2rem_rgba(0,0,0,0.28)]" />
      </div>
    </CartelSection>
  );
}

/** Canal de consultas comerciales sobre auditorías y servicios de ciberseguridad. */
export function LandingSecurityInquiry() {
  return (
    <CartelSection id="security-inquiry" labelledBy="security-inquiry-title" className="c-band c-ink-green scroll-mt-[var(--c-nav-h)]">
      <div className="c-container grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="max-w-3xl">
          <p className="c-label">Servicios para empresas · Consultas de trabajo</p>
          <h2 id="security-inquiry-title" className="c-h2 mt-3">¿Necesitás evaluar o fortalecer la seguridad de tu empresa?</h2>
          <p className="c-body mt-4">Contanos a nivel general qué servicio estás buscando. Coordinaremos una conversación inicial para entender la necesidad y, antes de intercambiar información técnica, acordaremos confidencialidad y alcance.</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--c-muted)]">Este canal es para consultas comerciales de pentesting autorizado, auditorías y respuesta a incidentes. No incluyas dominios, direcciones IP, credenciales, evidencias ni detalles sensibles en el primer mensaje.</p>
        </div>
        <Link href="/contacto" className="c-btn c-btn-ghost w-fit">Ir a contacto <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </div>
    </CartelSection>
  );
}

/* ------------------------------------------------------------------ */
/* Preguntas frecuentes                                                */
/* ------------------------------------------------------------------ */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "¿Crear la cuenta cuesta algo?",
    a: (
      <>
        No. La cuenta es gratis y te da acceso a todos los módulos con el mismo perfil, con algunos límites. Mercav Pro (9,99 USD por mes) los quita;
        el detalle está en{" "}
        <HostLink href="/precios" className="c-link font-semibold">
          la página de precios
        </HostLink>
        .
      </>
    ),
  },
  {
    q: "¿Mis datos están seguros?",
    a: (
      <>
        Los datos personales de tu equipo, como el carnet y la cuenta bancaria, se guardan cifrados, y cada acción importante queda registrada. Podés leer cómo los
        tratamos en la{" "}
        <HostLink href="/privacidad" className="c-link font-semibold">
          política de privacidad
        </HostLink>
        .
      </>
    ),
  },
  {
    q: "¿Mi equipo puede usar la caja?",
    a: "Sí. Cada empresa tiene su caja dentro de Mercav Business. Invitás a tu equipo con un link: quien entra como trabajador vende con su propia cuenta, los encargados manejan el inventario y las anulaciones, y el contador ve los reportes. El reporte te muestra quién vendió qué.",
  },
  {
    q: "¿Qué es MercavClub?",
    a: "Es el código de tu cuenta Mercav para las tarjetas de fidelización. Lo dictás en caja y el negocio te encuentra o te crea la tarjeta, que queda guardada en Mis tarjetas junto con las de los demás negocios. Para validar que sos el titular, el negocio te pide tu documento una vez.",
  },
  {
    q: "¿Puedo tener los feriados en mi calendario?",
    a: "Sí. Desde Calendario creás un link de suscripción para Google Calendar, Apple u Outlook. Se actualiza solo, también cuando un decreto mueve un feriado.",
  },
  { q: "¿Tengo que instalar algo?", a: "No. Mercav funciona en el navegador, desde el celular o la compu, en app.mercav.lat." },
  { q: "¿Las tarjetas de fidelización van a Apple Wallet?", a: "Hoy funcionan en el navegador, sin bajar nada. Apple Wallet y Google Wallet están en camino." },
];

export function LandingFAQ() {
  return (
    <CartelSection labelledBy="faq-title" className="!pt-8 md:!pt-12">
      <div className="c-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <h2 id="faq-title" className="c-h2">
          Preguntas frecuentes.
        </h2>
        <div className="border-t-2 border-[var(--c-line)]">
          {FAQ.map((f) => (
            <details key={f.q} className="c-faq group border-b-2 border-[var(--c-line)]">
              <summary className="flex items-center justify-between gap-6 py-5">
                <span className="text-[1.125rem] font-semibold leading-snug">{f.q}</span>
                <Plus className="c-faq-icon h-6 w-6 shrink-0 text-[var(--c-magenta-text)]" aria-hidden />
              </summary>
              <p className="c-body pb-6">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </CartelSection>
  );
}

/* ------------------------------------------------------------------ */
/* Cierre                                                              */
/* ------------------------------------------------------------------ */

export function LandingCTA() {
  return (
    <section aria-labelledby="home-cta" className="c-band c-ink-yellow">
      <div className="c-container grid gap-10 py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
        <FitLines
          as="h2"
          id="home-cta"
          lines={[
            { text: "Abrí tu", fit: 37.793 },
            { text: "cuenta hoy.", fit: 22.926 },
          ]}
          className="max-w-[44rem]"
        />
        <div className="flex flex-col gap-6 lg:pb-3">
          <Mervi pose="celebrando" scale={1} scaleLg={2} label="Mervi festeja" />
          <p className="max-w-[30rem] text-[1.125rem] leading-relaxed text-[var(--c-soft)]">
            Crear la cuenta es gratis. Empezá por lo que necesitás hoy: Business, Pwn o Kosher. Lo demás te espera con el mismo perfil.
          </p>
          <AuthCTA tone="ink" />
        </div>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
