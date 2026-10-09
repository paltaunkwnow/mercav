import Holidays, { type HolidaysTypes } from "date-holidays";
import { DEPARTMENTS } from "./sources";
import { addDays, boliviaCivicDays, boliviaDepartmental, boliviaNational, sortEntries } from "./bolivia";
import { lru } from "./cache";
import type { BoliviaDepartment, CalendarEntry, CalendarRegion } from "./types";
import { LATAM_COUNTRIES } from "../geo/latam";

/*
 * Feriados por país. Solo servidor.
 * - Bolivia: reglas propias con decretos (bolivia.ts), porque es donde más cuidamos el detalle.
 * - Resto de Latinoamérica: date-holidays (datos CC-BY 3.0, https://github.com/commenthol/date-holidays).
 */

const cache = new Map<string, Holidays>();

function holidaysFor(country: string, region?: string | null) {
  const id = `${country}:${region ?? ""}`;
  let hd = cache.get(id);
  if (!hd) {
    hd = region ? new Holidays(country, region, { languages: ["es"] }) : new Holidays(country, { languages: ["es"] });
    cache.set(id, hd);
  }
  return hd;
}

function slug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const TYPE_NOTE: Partial<Record<HolidaysTypes.HolidayType, string>> = {
  optional: "Día no laborable optativo: cada empleador decide.",
  bank: "Feriado bancario.",
  school: "Feriado escolar.",
};

/*
 * date-holidays trae algunos nombres en portugués, en inglés o sin tildes aunque se pida "es".
 * Acá van como se escriben en español. Solo cambia el título: la clave sigue saliendo del nombre
 * original para que las fechas ocultas de cada persona no se pierdan.
 */
const SPANISH_NAMES: Record<string, string> = {
  // Brasil, nacionales
  "Dia de Tiradentes": "Día de Tiradentes",
  "Dia dos Namorados": "Día de los Enamorados",
  "Dia de Eleição": "Día de elecciones",
  "Nossa Senhora Aparecida": "Nuestra Señora Aparecida",
  "Proclamação da República": "Proclamación de la República",
  "Dia da Consciência Negra": "Día de la Conciencia Negra",
  // Brasil, estados
  "Dia do evangélico": "Día del Evangélico",
  "Dia do Evangélico": "Día del Evangélico",
  "Alusivo ao Dia Internacional da Mulher": "Día Internacional de la Mujer",
  "Dia da Amazônia": "Día de la Amazonia",
  "São João": "San Juan",
  "São Pedro": "San Pedro",
  "Emancipação política": "Emancipación política",
  "Morte de Zumbi dos Palmares": "Muerte de Zumbi dos Palmares",
  "Elevação do Amazonas à categoria de província": "Elevación de Amazonas a provincia",
  "Dia de São José": "Día de San José",
  "Criação do Território Federal": "Creación del Territorio Federal",
  "Independência da Bahia": "Independencia de Bahía",
  "Data magna do estado": "Fecha magna del estado",
  "Fundação de Brasília": "Fundación de Brasilia",
  "Dia de Nossa Senhora da Penha": "Día de Nuestra Señora de la Peña",
  "Fundação da Cidade de Goiás": "Fundación de la ciudad de Goiás",
  "Lançamento da pedra fundamental de Goiânia": "Piedra fundamental de Goiânia",
  "Adesão do Maranhão à independência do Brasil": "Adhesión de Maranhão a la independencia de Brasil",
  "Criação do estado": "Creación del estado",
  "Adesão do Grão-Pará à independência do Brasil": "Adhesión de Grão-Pará a la independencia de Brasil",
  "Homenagem à memória do ex-presidente João Pessoa": "Homenaje al expresidente João Pessoa",
  "Nossa Senhora das Neves": "Nuestra Señora de las Nieves",
  "Revolução Pernambucana de 1817": "Revolución Pernambucana de 1817",
  "Dia do Piauí": "Día de Piauí",
  "Emancipação política do estado do Paraná": "Emancipación política de Paraná",
  "Dia de São Jorge": "Día de San Jorge",
  "Dia do Comércio": "Día del Comercio",
  "Mártires de Cunhaú e Uruaçu": "Mártires de Cunhaú y Uruaçu",
  "Proclamação da República Rio-Grandense": "Proclamación de la República Riograndense",
  "Dia de Santa Catarina": "Día de Santa Catarina",
  "Dia de Santa Catarina de Alexandria": "Día de Santa Catalina de Alejandría",
  "Emancipação política de Sergipe": "Emancipación política de Sergipe",
  "Revolução Constitucionalista": "Revolución Constitucionalista",
  "Autonomia do Estado": "Autonomía del estado",
  "Nossa Senhora da Natividade": "Nuestra Señora de la Natividad",
  // Puerto Rico
  "Valentine's Day": "Día de San Valentín",
  "Tax Day": "Vencimiento de la declaración de impuestos",
  "Administrative Professionals Day": "Día de los Profesionales Administrativos",
  "Dia despues Acción de Gracias": "Día después de Acción de Gracias",
  "Election Day": "Día de elecciones",
  // Tildes y mayúsculas
  "Sabado Santo": "Sábado Santo",
  "Dia de La Bandera": "Día de la Bandera",
  "Dia de los héroes": "Día de los Héroes",
  "La inmaculada concepción": "Inmaculada Concepción",
  "La virgen de Chiquinquirá": "Virgen de Chiquinquirá",
  "Día de la resistencia indígena": "Día de la Resistencia Indígena",
  "Día del niño": "Día del Niño",
  "Día de la madre nicaragüense": "Día de la Madre nicaragüense",
  "Día del padre nicaragüense": "Día del Padre nicaragüense",
  "Fin del Año": "Fin de Año",
};

/** Título en español. Respeta el "(día sustituto)" que agrega date-holidays. */
export function spanishHolidayName(name: string) {
  const m = /^(.*?)( \((?:día sustituto|substituto)\))?$/.exec(name);
  const base = m?.[1] ?? name;
  const fixed = SPANISH_NAMES[base];
  if (!fixed) return name;
  return m?.[2] ? `${fixed} (día sustituto)` : fixed;
}

const DAY_MS = 86_400_000;

/**
 * Una entrada por día. date-holidays devuelve feriados de varios días como uno solo con `end`
 * (Semana de Turismo en Uruguay, Semana Santa en Venezuela, Carnaval en Brasil).
 */
function toEntries(country: string, h: HolidaysTypes.Holiday, source: CalendarEntry["source"], dayOff: boolean): CalendarEntry[] {
  const key = `${country}:${slug(h.name)}`;
  const first = h.date.slice(0, 10);
  // Los de medio día (Nochebuena desde las 14 h) duran menos de 24 h: igual cuentan como uno.
  const days = Math.max(1, Math.round((new Date(h.end).getTime() - new Date(h.start).getTime()) / DAY_MS));
  const notes = [h.substitute ? "Feriado trasladado." : null, dayOff ? null : TYPE_NOTE[h.type] ?? null].filter(Boolean);
  const title = spanishHolidayName(h.name);
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(first, i);
    return { id: `${key}@${date}`, key, date, title, source, dayOff, ...(notes.length ? { note: notes.join(" ") } : {}) };
  });
}

/** Un feriado de varios días puede pisar a otro con el mismo nombre: una sola entrada por id. */
function uniqueById(entries: CalendarEntry[]) {
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

function sameDay(a: HolidaysTypes.Holiday, b: HolidaysTypes.Holiday) {
  return a.date.slice(0, 10) === b.date.slice(0, 10) && a.name === b.name;
}

export type CountryEntries = { national: CalendarEntry[]; regional: CalendarEntry[]; festive: CalendarEntry[] };

const yearCache = lru<CountryEntries>(256);

/** Feriados del año para un país y región. Cacheado: el resultado no se muta. */
export function countryEntries(year: number, country: string, region?: string | null): CountryEntries {
  return yearCache.get(`${country}:${region ?? ""}:${year}`, () => computeCountryEntries(year, country, region));
}

function computeCountryEntries(year: number, country: string, region?: string | null): CountryEntries {
  if (country === "BO") {
    const dep = DEPARTMENTS.some((d) => d.key === region) ? (region as BoliviaDepartment) : null;
    return { national: boliviaNational(year), regional: dep ? boliviaDepartmental(year, dep) : [], festive: boliviaCivicDays(year) };
  }
  let base: HolidaysTypes.Holiday[] = [];
  try {
    base = holidaysFor(country).getHolidays(year, "es");
  } catch {
    return { national: [], regional: [], festive: [] };
  }
  const national = base.filter((h) => h.type === "public").flatMap((h) => toEntries(country, h, "FERIADOS_NACIONALES", true));
  const festive = base.filter((h) => h.type !== "public").flatMap((h) => toEntries(country, h, "FECHAS_FESTIVAS", false));
  let regional: CalendarEntry[] = [];
  if (region && regionsFor(country).some((r) => r.code === region)) {
    try {
      regional = holidaysFor(country, region)
        .getHolidays(year, "es")
        .filter((h) => h.type === "public" && !base.some((b) => sameDay(b, h)))
        .flatMap((h) => toEntries(country, h, "FERIADOS_REGIONALES", true));
    } catch {
      regional = [];
    }
  }
  return { national: sortEntries(uniqueById(national)), regional: sortEntries(uniqueById(regional)), festive: sortEntries(uniqueById(festive)) };
}

/** Días de descanso nacionales y regionales del año, para Business. */
export function dayOffEntries(year: number, country: string, region?: string | null) {
  const { national, regional } = countryEntries(year, country, region);
  return sortEntries([...national, ...regional].filter((e) => e.dayOff));
}

/** Regiones con feriados propios. En Bolivia, los nueve departamentos. */
export function regionsFor(country: string): CalendarRegion[] {
  if (country === "BO") return DEPARTMENTS.map((d) => ({ code: d.key, name: d.label }));
  try {
    const states = new Holidays().getStates(country, "es") ?? {};
    return Object.entries(states)
      .map(([code, name]) => ({ code, name: String(name) }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  } catch {
    return [];
  }
}

let regionsByCountry: Record<string, CalendarRegion[]> | null = null;

/** Regiones de todos los países de Latinoamérica, para el selector del calendario. Se arma una vez por proceso. */
export function latamRegions(): Record<string, CalendarRegion[]> {
  regionsByCountry ??= Object.fromEntries(LATAM_COUNTRIES.map((c) => [c.code, regionsFor(c.code)]));
  return regionsByCountry;
}
// creado por pato dev y askforvini
