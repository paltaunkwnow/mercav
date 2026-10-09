"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Calculator,
  Check,
  ChevronLeft,
  FileDown,
  FileText,
  Home,
  MapPin,
  Moon,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
} from "@/components/icons";
import { ModuleGlyph, type ModuleGlyphKey } from "@/components/icons/ModuleGlyph";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { BUSINESS_TYPES, defaultDesign } from "@/lib/business/loyalty/templates";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "./PhoneFrame";
import { PixelMap, cityCell } from "./PixelMap";

const cafe = BUSINESS_TYPES.find((t) => t.key === "CAFE") ?? BUSINESS_TYPES[0];
const CAFE_DESIGN = defaultDesign(cafe, "Café La Esquina");
/** Empujar y volver, como en iOS: resorte sin rebote. */
const PUSH = { type: "spring", bounce: 0, duration: 0.38 } as const;

function hourIn(iso: string | null, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date(iso));
}
function dayLabel(date: string) {
  return new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

/* ------------------------------------------------------------------ */
/* El celular del hero: se toca, pero no sale de la página              */
/* ------------------------------------------------------------------ */

export type PhoneDemoData = {
  payslip: { rows: { label: string; short?: string; value: string; minus?: boolean; strong?: boolean }[]; net: string };
  shabbat: { city: string; timezone: string; candles: string | null; havdalah: string | null; parasha: string | null } | null;
  holidays: { date: string; title: string }[];
  countryName: string;
  sources: string[];
};

type ScreenKey = "home" | "business" | "fidelizacion" | "pwn" | "kosher" | "calendario" | "herramientas";

export function PhoneDemo({ data }: { data: PhoneDemoData }) {
  const [screen, setScreen] = useState<ScreenKey>("home");
  const reduce = useReducedMotion();
  const tiles: { key: Exclude<ScreenKey, "home">; glyph?: ModuleGlyphKey; star?: boolean; name: string; sub: string }[] = [
    { key: "business", glyph: "business", name: "Business", sub: "Planilla de octubre" },
    { key: "fidelizacion", glyph: "fidelizacion", name: "Fidelización", sub: "Club del café" },
    { key: "pwn", glyph: "pwn", name: "Pwn", sub: "Monitoreo activo" },
    { key: "kosher", star: true, name: "Kosher", sub: data.shabbat?.candles ? `Velas ${hourIn(data.shabbat.candles, data.shabbat.timezone)}` : "Atlas" },
    { key: "calendario", glyph: "calendario", name: "Calendario", sub: "Feriados y hebreo" },
    { key: "herramientas", glyph: "herramientas", name: "Herramientas", sub: "7 herramientas" },
  ];
  const titles: Record<ScreenKey, string> = {
    home: "Inicio",
    business: "Planilla de octubre",
    fidelizacion: "Club del café",
    pwn: "Pwn",
    kosher: "Shabat",
    calendario: "Calendario",
    herramientas: "Herramientas",
  };

  return (
    <PhoneFrame>
      <div role="group" aria-label="Demostración de la app de Mercav: tocá los módulos para verlos" className="relative mt-5 flex flex-1 flex-col overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {screen === "home" ? (
            <motion.div
              key="home"
              className="flex flex-1 flex-col gap-3"
              initial={reduce ? { opacity: 0 } : { x: "-30%", opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { x: "-30%", opacity: 0 }}
              transition={reduce ? { duration: 0.15 } : PUSH}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/images/logo.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                  <div className="text-left">
                    <p className="text-[0.65rem] text-[#a0a0a0]">Hola,</p>
                    <p className="text-[0.9rem] font-semibold leading-tight">Lucía</p>
                  </div>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1d1f27]">
                  <Bell className="h-3.5 w-3.5 text-[#d4af37]" aria-hidden />
                </span>
              </div>
              <div className="rounded-2xl border border-[#d4af37]/40 bg-[#17181d] p-3 text-left">
                <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[#d4af37]">Tu negocio</p>
                <p className="mt-0.5 text-[0.95rem] font-semibold">Café La Esquina</p>
                <p className="text-[0.65rem] text-[#a0a0a0]">Bolivia · Bs</p>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {tiles.map((t) => (
                  <li key={t.key}>
                    <button
                      type="button"
                      onClick={() => setScreen(t.key)}
                      className="mv-icon-host group w-full rounded-2xl bg-[#1b1d24] p-2.5 text-left transition-[background-color,scale] duration-150 hover:bg-[#23252e] active:scale-[0.96]"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#d4af37]/12 text-[#e0bd4f]">
                        {t.star ? <StarOfDavid className="h-4 w-4" /> : <ModuleGlyph name={t.glyph!} size={18} />}
                      </span>
                      <span className="mt-1.5 block text-[0.72rem] font-semibold leading-tight">{t.name}</span>
                      <span className="block truncate text-[0.6rem] text-[#9a9a9a]">{t.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key={screen}
              className="absolute inset-0 flex flex-col gap-3 bg-[#111216]"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={reduce ? { duration: 0.15 } : PUSH}
            >
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setScreen("home")} aria-label="Volver al inicio" className="grid h-8 w-8 place-items-center rounded-full text-[#d4af37] hover:bg-[#1d1f27]">
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <p className="text-[0.95rem] font-semibold">{titles[screen]}</p>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-1 text-left">{renderScreen(screen, data)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <nav aria-label="Barra de la app (demostración)" className="mt-2 flex items-center justify-around rounded-2xl bg-[#1b1d24] py-1.5 text-[#8a8a8a]">
        {(
          [
            { key: "home", label: "Inicio", node: <Home className="h-4 w-4" aria-hidden /> },
            { key: "business", label: "Business", node: <ModuleGlyph name="business" size={16} /> },
            { key: "plus", label: "Crear", node: <Plus className="h-4 w-4" aria-hidden /> },
            { key: "calendario", label: "Calendario", node: <ModuleGlyph name="calendario" size={16} /> },
            { key: "perfil", label: "Perfil", node: <User className="h-4 w-4" aria-hidden /> },
          ] as const
        ).map((b) =>
          b.key === "plus" ? (
            <button key={b.key} type="button" aria-label={b.label} onClick={() => setScreen("fidelizacion")} className="grid h-7 w-7 place-items-center rounded-full bg-[#d4af37] text-[#111216] transition-[scale] active:scale-90">
              {b.node}
            </button>
          ) : (
            <button
              key={b.key}
              type="button"
              aria-label={b.label}
              aria-current={screen === b.key ? "page" : undefined}
              onClick={() => setScreen(b.key === "perfil" ? "home" : (b.key as ScreenKey))}
              className={cn("grid h-8 w-8 place-items-center rounded-full transition-colors active:scale-90", screen === b.key ? "text-[#d4af37]" : "hover:text-[#d0d0d0]")}
            >
              {b.node}
            </button>
          ),
        )}
      </nav>
    </PhoneFrame>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-[#1b1d24] p-3", className)}>{children}</div>;
}

function renderScreen(screen: ScreenKey, data: PhoneDemoData): ReactNode {
  switch (screen) {
    case "business":
      return (
        <>
          <Card>
            <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[#d4af37]">Boleta de Lucía</p>
            {/* flex y min-w-0: con grid la columna crecía hasta el concepto más largo y los montos se salían de la tarjeta. */}
            <dl className="mt-2.5 flex min-w-0 flex-col gap-1.5 text-[0.68rem] leading-tight">
              {data.payslip.rows.map((r) => (
                <div key={r.label} className={cn("flex min-w-0 items-baseline justify-between gap-3", r.strong && "border-t border-[#2a2c35] pt-1.5 font-semibold")}>
                  <dt className={cn("min-w-0 truncate", !r.strong && "text-[#a0a0a0]")}>{r.short ?? r.label}</dt>
                  <dd className={cn("shrink-0 tabular-nums", r.minus && "text-[#e8a0a0]")}>{r.minus ? `− ${r.value}` : r.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2.5 flex min-w-0 items-baseline justify-between gap-3 border-t border-[#2a2c35] pt-2">
              <span className="text-[0.65rem] text-[#a0a0a0]">Líquido pagable</span>
              <span className="shrink-0 text-[1.05rem] font-bold tabular-nums text-[#e0bd4f]">{data.payslip.net}</span>
            </p>
          </Card>
          <span className="flex items-center justify-center gap-1.5 rounded-xl bg-[#d4af37] py-2 text-[0.7rem] font-semibold text-[#111216]">
            <FileDown className="h-3.5 w-3.5" aria-hidden />
            Exportar a Excel
          </span>
          <p className="text-center text-[0.58rem] text-[#7a7a7a]">Cálculo real con las reglas de 2026 · datos de ejemplo</p>
        </>
      );
    case "fidelizacion":
      return (
        <>
          <LoyaltyCard design={CAFE_DESIGN} type="STAMPS" stampsGoal={10} rewardName={cafe.rewardName} balance={7} customerName="Lucía" side="flip" size="sm" className="w-full !min-w-0" />
          <Card>
            <p className="text-[0.72rem] font-semibold">7 de 10 sellos</p>
            <p className="text-[0.62rem] text-[#a0a0a0]">Te faltan 3 para {cafe.rewardName.toLowerCase()}. Tocá la tarjeta para darla vuelta.</p>
          </Card>
        </>
      );
    case "pwn":
      return (
        <>
          <div className="flex items-center gap-2 rounded-full bg-[#1b1d24] px-3 py-2">
            <Search className="h-3.5 w-3.5 text-[#3be57a]" aria-hidden />
            <span className="font-mono text-[0.68rem]">tuempresa.com</span>
          </div>
          <ul className="grid gap-1">
            {data.sources.slice(0, 5).map((s, i) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.12, duration: 0.25 }}
                className="flex items-center justify-between rounded-lg bg-[#1b1d24] px-2.5 py-1.5 text-[0.65rem]"
              >
                {s}
                <Check className="h-3 w-3 text-[#3be57a]" strokeWidth={3} aria-hidden />
              </motion.li>
            ))}
          </ul>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, ...PUSH }} className="flex items-center justify-between rounded-xl bg-[#2ee06f] px-3 py-2 text-[#0b0a09]">
            <span className="text-[0.72rem] font-bold">Sin filtraciones nuevas</span>
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </motion.div>
          <p className="text-center text-[0.58rem] text-[#7a7a7a]">Consulta de ejemplo · fuentes reales</p>
        </>
      );
    case "kosher":
      return data.shabbat ? (
        <>
          <Card>
            <p className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[#8db4ec]">
              <StarOfDavid className="h-3.5 w-3.5" />
              {data.shabbat.city}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[0.6rem] text-[#a0a0a0]">Velas</p>
                <p className="text-[1.35rem] font-bold tabular-nums text-[#e0bd4f]">{hourIn(data.shabbat.candles, data.shabbat.timezone)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[0.6rem] text-[#a0a0a0]">
                  <Moon className="h-3 w-3" aria-hidden />
                  Havdalá
                </p>
                <p className="text-[1.35rem] font-bold tabular-nums">{hourIn(data.shabbat.havdalah, data.shabbat.timezone)}</p>
              </div>
            </div>
            {data.shabbat.parasha ? <p className="mt-1 text-[0.65rem] text-[#a0a0a0]">{data.shabbat.parasha}</p> : null}
          </Card>
          <Card className="flex items-center justify-between">
            <span className="text-[0.7rem] font-semibold">Modo Shabat</span>
            <span className="relative h-4 w-7 rounded-full bg-[#8db4ec]">
              <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" />
            </span>
          </Card>
          <p className="text-center text-[0.58rem] text-[#7a7a7a]">Horarios calculados ahora para {data.shabbat.city}</p>
        </>
      ) : null;
    case "calendario":
      return (
        <>
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[#d4af37]">Próximos feriados · {data.countryName}</p>
          <ul className="grid gap-1.5">
            {data.holidays.map((h) => (
              <li key={h.date + h.title} className="flex items-center gap-2.5 rounded-xl bg-[#1b1d24] px-2.5 py-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-[#e0bd4f]" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-[0.7rem] font-semibold">{h.title}</span>
                  <span className="block text-[0.6rem] capitalize text-[#a0a0a0]">{dayLabel(h.date)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-center text-[0.58rem] text-[#7a7a7a]">Y el calendario hebreo, si lo activás</p>
        </>
      );
    case "herramientas":
      return (
        <ul className="grid grid-cols-2 gap-2">
          {[
            { icon: FileText, name: "Contratos" },
            { icon: Calculator, name: "ROI" },
            { icon: Tag, name: "Precios" },
            { icon: Search, name: "SEO" },
            { icon: Palette, name: "Paletas" },
            { icon: Sparkles, name: "Prompts" },
            { icon: CalendarDays, name: "Feriados" },
          ].map(({ icon: Icon, name }) => (
            <li key={name} className="flex items-center gap-2 rounded-xl bg-[#1b1d24] px-2.5 py-2.5 text-[0.7rem] font-semibold">
              <Icon className="h-4 w-4 text-[#e0bd4f]" aria-hidden />
              {name}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Publicidad: elegir fechas de verdad                                 */
/* ------------------------------------------------------------------ */

export function BookingPicker({ start }: { start: string }) {
  const days = useMemo(() => {
    const base = new Date(`${start}T12:00:00Z`);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base.getTime() + i * 86_400_000);
      return { iso: d.toISOString().slice(0, 10), day: d.getUTCDate(), wd: new Intl.DateTimeFormat("es", { weekday: "narrow", timeZone: "UTC" }).format(d) };
    });
  }, [start]);
  const [from, setFrom] = useState<number | null>(3);
  const [to, setTo] = useState<number | null>(8);
  const [hover, setHover] = useState<number | null>(null);

  function pick(i: number) {
    if (from === null || to !== null) {
      setFrom(i);
      setTo(null);
    } else if (i < from) {
      setFrom(i);
    } else {
      setTo(i);
    }
  }
  const end = to ?? (from !== null && hover !== null && hover >= from ? hover : null);
  const inRange = (i: number) => from !== null && (i === from || (end !== null && i >= from && i <= end));
  const fmt = (i: number) => new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${days[i].iso}T12:00:00Z`));
  const summary =
    from === null ? "Elegí el primer día." : to === null ? `Desde el ${fmt(from)}. Ahora elegí el último día.` : `Del ${fmt(from)} al ${fmt(to)} · ${to - from + 1} días`;

  return (
    <div className="mt-auto">
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Elegí las fechas de la reserva">
        {days.slice(0, 7).map((d) => (
          <span key={`wd-${d.iso}`} aria-hidden className="text-center text-[0.62rem] font-bold uppercase opacity-70">
            {d.wd}
          </span>
        ))}
        {days.map((d, i) => {
          const on = inRange(i);
          const edge = i === from || i === end;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => pick(i)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              aria-pressed={on}
              aria-label={fmt(i)}
              className={cn(
                "c-num grid aspect-square place-items-center rounded-[6px] text-[0.75rem] font-bold transition-[background-color,color,scale,box-shadow] duration-200 [transition-timing-function:var(--mv-spring-bounce)] active:scale-90",
                on ? "bg-[#0b0a09] text-[var(--c-orange)]" : "shadow-[inset_0_0_0_1.5px_rgba(11,10,9,0.35)] hover:shadow-[inset_0_0_0_2px_#0b0a09]",
                edge && "scale-[1.08] rounded-[8px]",
              )}
            >
              {d.day}
            </button>
          );
        })}
      </div>
      <p className="c-label mt-3 min-h-[2.4em] text-[0.95rem] leading-tight" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Atlas Kosher: el celular se toca                                    */
/* ------------------------------------------------------------------ */

export type AtlasPlace = { name: string; city: string; type: string; status: string; certified: boolean };

export function KosherPhone({ places }: { places: AtlasPlace[] }) {
  const cities = useMemo(() => Array.from(new Set(places.map((p) => p.city))).filter((c) => cityCell(c)), [places]);
  const [city, setCity] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(places[0]?.name ?? null);
  const list = places.filter((p) => !city || p.city === city);
  const current = places.find((p) => p.name === selected) ?? null;

  // Ciudades muy cercanas en el mapa (Buenos Aires y Montevideo) comparten un punto; tocarlo de nuevo pasa a la siguiente.
  const pins = useMemo(() => {
    const groups: { cities: string[]; x: number; y: number }[] = [];
    for (const c of cities) {
      const [x, y] = cityCell(c)!;
      const near = groups.find((g) => Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) <= 2);
      if (near) near.cities.push(c);
      else groups.push({ cities: [c], x, y });
    }
    return groups;
  }, [cities]);

  return (
    <PhoneFrame screen="#0d1b2e">
      <div className="mt-5 flex flex-1 flex-col gap-2.5 text-left">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[0.95rem] font-semibold">
            <StarOfDavid className="h-4 w-4 text-[#8db4ec]" />
            Atlas Kosher
          </p>
          <span className="rounded-full bg-[#8db4ec]/15 px-2 py-0.5 text-[0.6rem] text-[#8db4ec]">{city ?? "Latinoamérica"}</span>
        </div>
        <div className="relative rounded-2xl bg-[#122440] p-2">
          <PixelMap
            land="#8db4ec"
            shade="#3d6fb3"
            ocean="#1c3150"
            pins={pins.map((p) => {
              const on = !!current && p.cities.includes(current.city);
              return { x: p.x, y: p.y, active: on, color: on ? "#ff3d8b" : "#e6bd55" };
            })}
            className="w-full"
          />
          {pins.map((p) => (
            <button
              key={p.cities.join("|")}
              type="button"
              aria-label={`Ver lugares en ${p.cities.join(" y ")}`}
              onClick={() => {
                const i = city ? p.cities.indexOf(city) : -1;
                const next = p.cities[(i + 1) % p.cities.length];
                setCity(next);
                setSelected(places.find((x) => x.city === next)?.name ?? null);
              }}
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${(p.x + 0.5) / 60})`, top: `calc(0.5rem + (100% - 1rem) * ${(p.y + 0.5) / 50})` }}
            />
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 pr-6 [mask-image:linear-gradient(to_right,#000_80%,transparent)] [scrollbar-width:none]">
          {[null, ...cities].map((c) => (
            <button
              key={c ?? "todas"}
              type="button"
              onClick={() => setCity(c)}
              aria-pressed={city === c}
              className={cn("shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] font-semibold transition-colors", city === c ? "bg-[#8db4ec] text-[#0a1626]" : "bg-[#122440] text-[#bccbe0] hover:text-white")}
            >
              {c ?? "Todas"}
            </button>
          ))}
        </div>
        <ul className="flex flex-col gap-1.5 overflow-y-auto">
          {list.slice(0, 4).map((p) => (
            <li key={p.name}>
              <button
                type="button"
                onClick={() => setSelected(p.name)}
                aria-pressed={selected === p.name}
                className={cn("w-full rounded-xl px-3 py-2 text-left transition-[background-color,box-shadow] duration-150", selected === p.name ? "bg-[#1c3150] shadow-[inset_0_0_0_1.5px_#8db4ec]" : "bg-[#122440] hover:bg-[#16294a]")}
              >
                <span className="block truncate text-[0.72rem] font-semibold">{p.name}</span>
                <span className="flex items-center justify-between gap-2 text-[0.6rem] text-[#a8b8d0]">
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    {p.type} · {p.city}
                  </span>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-px", p.certified ? "bg-[#2ee06f]/15 text-[#5ff09a]" : "bg-white/10 text-[#c9d4e4]")}>{p.status}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PhoneFrame>
  );
}
// creado por pato dev y askforvini
