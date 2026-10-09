/** Tipos del calendario de app.mercav.lat. Sin dependencias: lo puede importar el cliente. */

export type CalendarSourceKey =
  | "FERIADOS_NACIONALES"
  | "FERIADOS_REGIONALES"
  | "FECHAS_FESTIVAS"
  | "JUDIO_FIESTAS"
  | "JUDIO_MENORES"
  | "JUDIO_AYUNOS"
  | "JUDIO_ROSH_JODESH"
  | "JUDIO_MODERNOS";

export type BoliviaDepartment =
  | "SANTA_CRUZ"
  | "LA_PAZ"
  | "COCHABAMBA"
  | "CHUQUISACA"
  | "POTOSI"
  | "ORURO"
  | "TARIJA"
  | "BENI"
  | "PANDO";

export type CalendarEntry = {
  /** Único por ocurrencia: `${key}@${date}`. */
  id: string;
  /** Estable entre años. Es lo que se guarda al ocultar una fecha (BO:independencia, AR:dia-de-la-independencia, JUDIO:pesach). */
  key: string;
  /** Fecha civil yyyy-mm-dd. */
  date: string;
  title: string;
  source: CalendarSourceKey;
  /** Feriado con descanso o iom tov en que no se trabaja (calendario hebreo). */
  dayOff: boolean;
  note?: string;
  /** Nombre en hebreo, solo para fechas del calendario hebreo. */
  hebrew?: string;
  /** Fecha hebrea legible, solo para fechas del calendario hebreo. */
  hebrewDate?: string;
  /** Se completa cuando la persona ocultó esta fecha y se pidió incluir las ocultas. */
  hidden?: boolean;
};

export type CalendarPrefs = {
  /** País de los feriados (ISO 3166-1 alfa-2). */
  country: string;
  /** Región para los feriados regionales (en Bolivia, el departamento: SANTA_CRUZ, LA_PAZ…). */
  region: string | null;
  sources: CalendarSourceKey[];
  israel: boolean;
  hidden: string[];
};

export type CalendarRegion = { code: string; name: string };
// creado por pato dev y askforvini
