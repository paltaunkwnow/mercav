import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Calculator,
  MapPinned,
  MessagesSquare,
  Moon,
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
import { PillarNav, RegionPicker, ShabbatPicker, type CountryInfo, type ShabbatCity } from "./LandingClient";
import { BookingPicker, KosherPhone, PhoneDemo, type PhoneDemoData } from "./LandingDemos";

export type PayslipDemo = {
  rows: { label: string; short?: string; value: string; minus?: boolean; strong?: boolean }[];
  net: string;
  gross: string;
  deductions: string;
  note: string;
};
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

/** "25 dic." para una fecha yyyy-mm-dd (sin correr el día por la zona horaria). */
function shortDate(date: string) {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

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
        <p className="c-lead mx-auto mt-7 text-center">
          Equipo y planillas, fidelización, publicidad, empleo, herramientas, ciberseguridad con Pwn y el atlas Kosher. En español, con los precios y
          las normas de tu país.
        </p>
        <AuthCTA className="mt-9 items-center sm:justify-center" />
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

/** Dos cintas cruzadas, como las que sostienen un afiche, con los módulos corriendo en sentidos opuestos. */
export function LandingMarquee() {
  const a = ["Mercav Business", "Mercav Pwn", "Mercav Kosher", "Caja", "Planillas", "Fidelización", "Calendario hebreo"];
  const b = ["20 países", "MercavClub", "Publicidad", "Empleo", "Talento", "Herramientas", "Una sola cuenta"];
  const tape = (items: string[], k: number) => (
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
    <div className="relative h-[11rem] overflow-hidden md:h-[13rem]" role="presentation">
      <div className="c-band c-ink-magenta c-marquee c-tape absolute -left-[5%] -right-[5%] top-[22%] -rotate-[3.5deg] py-2.5" style={{ "--marquee-s": "42s" } as CSSProperties}>
        <div className="c-marquee-track">{[0, 1].map((k) => tape(a, k))}</div>
      </div>
      <div className="c-band c-ink-yellow c-marquee c-marquee-reverse c-tape absolute -left-[5%] -right-[5%] top-[46%] rotate-[2.5deg] py-2.5" style={{ "--marquee-s": "48s" } as CSSProperties}>
        <div className="c-marquee-track">{[0, 1].map((k) => tape(b, k))}</div>
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
      <CartelSection labelledBy="apps-title" className="!pb-12 md:!pb-16">
        <div className="c-container grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-end md:gap-14">
          <FitLines
            as="h2"
            id="apps-title"
            lines={[
              { text: "Tres apps.", fit: 25.408 },
              { text: "Una cuenta.", fit: 22.01, className: "c-text-magenta" },
            ]}
            className="max-w-[34rem]"
          />
          <p className="c-lead md:pb-3">
            Mercav Business para operar tu negocio, Mercav Pwn para protegerlo y Mercav Kosher para la comunidad. Las tres se abren con el mismo perfil,
            desde la app de Mercav.
          </p>
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
          title="Tu caja, tu equipo y tus clientes."
          lead="La caja con inventario y reportes, legajos y planillas con los descuentos de ley, tarjetas de fidelización con tu marca, empleo, talento por hitos, publicidad y herramientas. Tu equipo entra con su propia cuenta."
          href="/business"
          cta="Abrir Business"
          button="c-btn-ink"
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:mt-20 lg:auto-rows-[minmax(15.5rem,auto)] lg:grid-cols-4">
          <article className="c-tile c-night flex flex-col gap-5 p-7 md:col-span-2 lg:row-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="c-h3">Planillas de sueldo</h3>
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
              <h3 className="c-h3">Fidelización</h3>
              <p className="mt-2 text-[0.98rem] text-[var(--c-soft)]">
                Tarjetas de sellos o puntos con tu logo. Tus clientes se suman con un QR y las guardan en su cuenta; los encontrás por número de cliente o por su código
                MercavClub.
              </p>
              <p className="c-label mt-3 text-[1.05rem]">19 rubros listos · MercavClub</p>
            </div>
            <div className="w-[15rem] shrink-0 rotate-[-4deg] motion-reduce:rotate-0">
              <LoyaltyCard design={CAFE_DESIGN} type="STAMPS" stampsGoal={10} rewardName={cafe.rewardName} balance={7} customerName="Lucía" side="flip" size="sm" className="w-full" />
            </div>
          </article>

          <article className="c-tile c-night flex flex-col gap-5 p-7 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="c-h3">Caja</h3>
                <p className="mt-2 max-w-[26rem] text-[0.98rem] text-[var(--c-soft)]">
                  Vendé desde el celular o la compu, con o sin conexión. Cada uno vende con su cuenta y el reporte te dice quién vendió qué.
                </p>
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
              {["Lector de códigos", "Pagos divididos", "Ticket por WhatsApp", "Inventario con alertas", "Anulaciones con motivo"].map((t) => (
                <li key={t} className="rounded-full px-3 py-1.5 text-[0.85rem] font-semibold shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">
                  {t}
                </li>
              ))}
            </ul>
          </article>

          <article className="c-tile c-inverse flex flex-col gap-4 p-6">
            <h3 className="c-h3">Tu equipo, con su cuenta</h3>
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
              <h3 className="c-h3">Publicidad</h3>
              <p className="mt-1 text-[0.92rem] text-[var(--c-soft)]">Vallas y pantallas con reserva por fechas. Probá elegir las tuyas.</p>
              <p className="c-label mt-2 text-[0.95rem]">Primer alquiler sin comisión</p>
            </div>
            <BookingPicker start={data.today} />
          </article>

          <article className="c-tile c-band c-ink-green flex flex-col p-6">
            <h3 className="c-h3">Talento</h3>
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
            <h3 className="c-h3">Empleo</h3>
            <div className="c-band c-ink-yellow mt-auto -rotate-2 rounded-[0.9rem] p-4 motion-reduce:rotate-0">
              <p className="c-display text-[1.7rem] leading-[0.9]">Se busca encargada de ventas</p>
              <p className="mt-2 text-[0.8rem]">Salario visible · postulaciones a tu panel</p>
            </div>
          </article>

          <article className="c-tile c-night relative flex flex-col p-6 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="c-h3">Herramientas</h3>
                <p className="mt-1 text-[0.92rem] text-[var(--c-soft)]">Las siete de hoy, incluidas según tu plan.</p>
              </div>
            </div>
            <ul className="mt-auto flex flex-wrap gap-2 pr-24 sm:pr-28">
              {tools.map(({ icon: Icon, name }) => (
                <li key={name} className="group flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.9rem] font-semibold shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">
                  <Icon className="h-4 w-4 text-[var(--c-yellow-text)]" aria-hidden />
                  {name}
                </li>
              ))}
            </ul>
            <Mervi pose="programador" scale={1} className="absolute -bottom-1 right-3" />
          </article>

          <article className="c-tile c-band c-ink-yellow flex flex-col gap-4 p-6 shadow-[inset_0_0_0_2px_#0b0a09] md:col-span-2">
            <div>
              <h3 className="c-h3">Calendario</h3>
              <p className="mt-1 max-w-[30rem] text-[0.92rem] text-[var(--c-soft)]">
                Feriados de tu país y calendario hebreo. Suscribilo a Google, Apple u Outlook: si un decreto mueve un feriado, te llega solo.
              </p>
            </div>
            {data.phone.holidays.length ? (
              <ul className="grid gap-1.5 text-[0.9rem]">
                {data.phone.holidays.slice(0, 3).map((h) => (
                  <li key={h.date + h.title} className="flex items-center justify-between gap-3 rounded-[0.8rem] bg-[#0b0a09] px-3 py-2 text-[#fffdf8]">
                    <span className="min-w-0 truncate font-semibold">{h.title}</span>
                    <span className="c-num shrink-0 text-[0.82rem] text-[#d2cbc0]">{shortDate(h.date)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="c-label mt-auto text-[0.95rem]">Días hábiles y fines de semana largos</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function PwnPillar({ data }: { data: LandingData }) {
  const sources = data.pwnSources.slice(0, 6);
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
        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative rounded-[1.5rem] bg-[var(--c-raised)] p-6 shadow-[inset_0_0_0_1px_var(--c-line-strong)] md:p-8">
            <Mervi pose="pensativo" scale={1} className="absolute -top-[calc(var(--mervi-unit)*88)] right-4" />
            <p className="c-label text-[1.05rem] text-[var(--c-muted)]">Consulta de exposición</p>
            <div className="mt-4 flex items-center gap-3 rounded-full bg-[var(--c-ground)] px-5 py-3 shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">
              <Search className="h-5 w-5 text-[var(--c-green-text)]" aria-hidden />
              <span className="c-typed font-mono text-[1rem]">tuempresa.com</span>
            </div>
            <ul className="mt-5 grid gap-2.5">
              {sources.map((s, i) => (
                <li key={s} className="c-scan-row flex items-center justify-between gap-3 border-b border-[var(--c-line)] pb-2.5 text-[0.95rem]" style={{ "--d": i } as CSSProperties}>
                  <span>{s}</span>
                  <span className="flex items-center gap-1.5 text-[0.85rem] text-[var(--c-green-text)]">
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                    Revisada
                  </span>
                </li>
              ))}
            </ul>
            <div className="c-scan-row mt-5 flex items-center justify-between gap-3 rounded-[1rem] bg-[#2ee06f] px-4 py-3 text-[#0b0a09]" style={{ "--d": sources.length } as CSSProperties}>
              <span className="c-label text-[1.1rem]">Sin filtraciones nuevas</span>
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-3 text-[0.8rem] text-[var(--c-muted)]">Ejemplo de una consulta. Las fuentes son las que Pwn revisa de verdad.</p>
          </div>
          <div className="flex flex-col gap-6">
            {data.kevs.length > 0 ? (
              <div className="rounded-[1.5rem] p-6 shadow-[inset_0_0_0_1px_var(--c-line-strong)] md:p-8">
                <p className="c-label text-[1.05rem] text-[var(--c-magenta-text)]">Explotadas ahora, según CISA KEV</p>
                <ul className="mt-4 divide-y divide-[var(--c-line)]">
                  {data.kevs.map((k) => (
                    <li key={k.cveId}>
                      <a href={k.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-[var(--c-green-text)]">
                        <span className="font-mono text-[0.98rem]">{k.cveId}</span>
                        <span className="flex items-center gap-3 text-[0.85rem] text-[var(--c-soft)]">
                          {k.cvss != null ? <span className="c-num rounded-full px-2 py-0.5 shadow-[inset_0_0_0_1.5px_var(--c-line-strong)]">CVSS {k.cvss.toFixed(1)}</span> : null}
                          {date(k.published)}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[0.8rem] text-[var(--c-muted)]">Datos públicos del catálogo de vulnerabilidades explotadas de CISA, tal como los guarda Pwn.</p>
              </div>
            ) : null}
            <ul className="grid gap-px overflow-hidden rounded-[1.25rem] bg-[var(--c-line)]">
              {[
                "Consulta abierta: si un correo o un dominio aparece, y en cuántas filtraciones",
                "El detalle, solo para quien verificó que es suyo",
                "Dominios verificados por DNS, con alertas",
                "Cada hallazgo cita su fuente",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 bg-[var(--c-ground)] px-5 py-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--c-green-text)]" aria-hidden />
                  <span className="text-[0.95rem] font-semibold leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="c-marquee border-y border-[var(--c-line)] py-3 text-[var(--c-green-text)]" style={{ "--marquee-s": "60s" } as CSSProperties}>
        <div className="c-marquee-track">
          {[0, 1].map((k) => (
            <ul key={k} aria-hidden={k === 1 || undefined} className="flex shrink-0 items-center">
              {data.pwnSources.map((s) => (
                <li key={s} className="c-label flex items-center gap-5 pr-5 text-[1.05rem]">
                  {s}
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

function KosherPillar({ data }: { data: LandingData }) {
  const features = [
    { icon: MapPinned, text: "Mapa con el estado de cada lugar y la fuente que lo respalda" },
    { icon: Moon, text: "Modo Shabat: la app queda en solo lectura" },
    { icon: CalendarDays, text: "Calendario hebreo con las fechas que elijas" },
    { icon: MessagesSquare, text: "Chat por ciudad y kehilot de la región" },
  ];
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
          <div className="flex flex-col gap-8">
            <ul className="grid gap-px overflow-hidden rounded-[1.5rem] bg-[var(--c-line)] sm:grid-cols-2">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="group flex items-start gap-3 bg-[var(--c-ground)] p-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--k-ink)]" aria-hidden />
                  <span className="text-[0.98rem] font-semibold leading-snug">{text}</span>
                </li>
              ))}
            </ul>
            <ShabbatPicker cities={data.shabbat} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cómo empezar                                                        */
/* ------------------------------------------------------------------ */

export function LandingSteps() {
  const steps: { pose: MerviPose; title: string; body: string }[] = [
    { pose: "normal", title: "Creá tu cuenta", body: "Es gratis y te pide lo justo: tu correo o tu cuenta de Google." },
    { pose: "smartphone", title: "Abrí lo que necesitás hoy", body: "Planillas, fidelización, Pwn, Kosher o herramientas: todo vive en app.mercav.lat, desde el celular o la compu." },
    { pose: "celebrando", title: "Sumá a tu equipo y a tus clientes", body: "Invitá a tu equipo con roles. Tus clientes se suman a tu tarjeta con un QR en el mostrador." },
  ];
  return (
    <CartelSection labelledBy="steps-title">
      <div className="c-container">
        <h2 id="steps-title" className="c-h2 max-w-[14ch]">
          Empezá en tres pasos.
        </h2>
        <ol className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className={cn("c-tile flex flex-col gap-4 p-7", i === 1 ? "c-band c-ink-yellow" : "c-tile-line")}>
              <div className="flex items-end justify-between gap-4">
                <span className="c-display text-[5rem] leading-[0.8]" aria-hidden>
                  {i + 1}
                </span>
                <Mervi pose={s.pose} scale={1} />
              </div>
              <h3 className="c-h3">
                <span className="sr-only">Paso {i + 1}: </span>
                {s.title}
              </h3>
              <p className="c-body">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </CartelSection>
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
  const principles = [
    { title: "Cada dato cita su fuente", body: "Pwn y Kosher muestran de dónde salió cada hallazgo o cada estado. Una afirmación sin verificar no se presenta como hecho." },
    { title: "Tus datos, cifrados", body: "El carnet y la cuenta bancaria de tu equipo se guardan cifrados, y cada acción importante queda registrada." },
    { title: "Hay personas detrás", body: "Vinicius Salazar fundó Mercav en Santa Cruz de la Sierra y lo construye con su equipo. Podés leer quiénes son y escribirles." },
  ];
  return (
    <CartelSection labelledBy="trust-title">
      <div className="c-container">
        <h2 id="trust-title" className="c-h2 max-w-[16ch]">
          Lo que podés comprobar por tu cuenta.
        </h2>
        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          <ul className="grid border-t-2 border-[var(--c-line)]">
            {principles.map((p) => (
              <li key={p.title} className="grid gap-3 border-b-2 border-[var(--c-line)] py-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
                <h3 className="c-h3">{p.title}</h3>
                <p className="c-body">{p.body}</p>
              </li>
            ))}
          </ul>
          <div className="c-tile c-tile-line flex flex-col gap-5 p-7">
            <p className="c-label text-[1.25rem]">Lo firma su equipo</p>
            <ul className="flex flex-col">
              {FOUNDERS.map((f) => (
                <li key={f.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-[var(--c-line)] py-3">
                  <span className={cn("c-display text-[1.7rem] leading-none md:text-[2rem]", f.lead && "c-text-yellow")}>{f.name}</span>
                  <span className="c-label text-[1rem] text-[var(--c-muted)]">{f.role}</span>
                </li>
              ))}
            </ul>
            <HostLink href="/nosotros" className="c-link inline-flex w-fit items-center gap-2 font-semibold">
              Conocer al equipo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </HostLink>
          </div>
        </div>
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
        No. Crear la cuenta es gratis y te da acceso a todos los módulos con el mismo perfil. Algunas herramientas y funciones avanzadas dependen de tu plan;
        los precios están en{" "}
        <HostLink href="/precios" className="c-link font-semibold">
          la página de precios
        </HostLink>
        .
      </>
    ),
  },
  { q: "¿En qué países funciona?", a: "En toda Latinoamérica: 20 países con sus feriados y su moneda. Las planillas de sueldo ya siguen las reglas de Bolivia y los demás países llegan de a uno." },
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
    q: "¿Qué hace Mercav Pwn?",
    a: "Es ciberinteligencia defensiva: revisa fuentes públicas, como Have I Been Pwned, NVD y CISA KEV, para avisarte si los correos o el dominio de tu empresa aparecen en filtraciones, y te muestra las vulnerabilidades que conviene parchear. Cada hallazgo cita su fuente.",
  },
  {
    q: "¿Qué es Mercav Kosher?",
    a: "Un atlas de lugares kosher, sinagogas y kehilot de la región, con el estado de cada lugar y su fuente, los horarios de Shabat por ciudad y el calendario hebreo. Mercav no emite certificaciones: muestra quién certifica.",
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
