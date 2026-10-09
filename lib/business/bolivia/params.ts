/**
 * Parámetros laborales de Bolivia por año. La planilla guarda una copia en BusinessPayrollRun.params
 * para que un cambio futuro no altere planillas viejas.
 *
 * `verify` marca los valores que vienen de fuentes secundarias o tienen lecturas distintas: la
 * interfaz los muestra para que el contador los confirme.
 */

export type SeniorityStep = { fromYears: number; rate: number };
export type AnsTier = { over: number; rate: number };

export type PayrollParams = {
  year: number;
  /** Salario mínimo nacional mensual (Bs). */
  smn: number;
  /** Días del mes comercial. */
  monthDays: number;
  /** Horas de la jornada mensual para el valor hora (30 × 8). */
  monthHours: number;
  /** Recargo de horas extra sobre el valor hora (1 = 100 %). */
  overtimeSurcharge: number;
  /** Pago adicional por domingo o feriado trabajado, en jornales (2 = se paga triple con el día normal). */
  sundayHolidayExtraDays: number;
  seniority: { table: SeniorityStep[]; baseSmnProductive: number; baseSmnServices: number };
  gestora: { vejez: number; riesgoComun: number; comision: number; solidario: number; capSmn: number | null };
  ans: AnsTier[];
  rciva: { rate: number; minimumSmn: number };
  employer: { cns: number; riesgoProfesional: number; patronalSolidario: number; vivienda: number };
  provisions: { aguinaldo: number; indemnizacion: number };
  verify: string[];
  sources: Record<string, string>;
};

export const PARAMS_2026: PayrollParams = {
  year: 2026,
  smn: 3300,
  monthDays: 30,
  monthHours: 240,
  overtimeSurcharge: 1,
  sundayHolidayExtraDays: 2,
  seniority: {
    table: [
      { fromYears: 2, rate: 0.05 },
      { fromYears: 5, rate: 0.11 },
      { fromYears: 8, rate: 0.18 },
      { fromYears: 11, rate: 0.26 },
      { fromYears: 15, rate: 0.34 },
      { fromYears: 20, rate: 0.42 },
      { fromYears: 25, rate: 0.5 },
    ],
    baseSmnProductive: 3,
    baseSmnServices: 1,
  },
  gestora: { vejez: 0.1, riesgoComun: 0.0171, comision: 0.005, solidario: 0.005, capSmn: null },
  ans: [
    { over: 13000, rate: 0.0115 },
    { over: 25000, rate: 0.0574 },
    { over: 35000, rate: 0.1148 },
  ],
  rciva: { rate: 0.13, minimumSmn: 2 },
  employer: { cns: 0.1, riesgoProfesional: 0.0171, patronalSolidario: 0.035, vivienda: 0.02 },
  provisions: { aguinaldo: 1 / 12, indemnizacion: 1 / 12 },
  verify: [
    "Pago por domingo o feriado trabajado (triple).",
    "Tope de cotización a la Gestora (no se aplica tope).",
    "Aporte Nacional Solidario: base \"Total Solidario\" y tramos acumulados.",
    "RC-IVA: mínimo no imponible de 2 SMN y cómputo del 13 % sobre 2 SMN; sin saldo anterior ni UFV.",
  ],
  sources: {
    smn: "DS 5516 y RM 088/26 — https://mintrabajo.gob.bo/wp-content/uploads/2026/04/COMUNICADO-DGTHSO-0014-26.pdf",
    overtime: "Ley General del Trabajo, art. 55 (recargo del 100 %)",
    seniority: "DS 21060 art. 60 (escala), DS 21137 art. 13 (1 SMN), DS 23474 (3 SMN productivas) — https://boliviaimpuestos.com/b/b3",
    gestora: "Ley 065 de Pensiones: 10 % vejez, 1,71 % riesgo común, 0,5 % comisión, 0,5 % solidario",
    ans: "Ley 1582 (1/10/2024): 1,15 % / 5,74 % / 11,48 % — https://boliviaimpuestos.com/b/86p",
    rciva: "Ley 843 y DS 21531: RC-IVA dependientes 13 % — https://boliviaimpuestos.com/b/7jw",
    employer: "CNS 10 %, riesgo profesional 1,71 %, Aporte Patronal Solidario 3,5 % (Ley 1582), vivienda 2 %",
  },
};

/**
 * 2025: salario mínimo de Bs 2.750. Los porcentajes de la Ley 1582 (ANS y aporte patronal
 * solidario) rigen desde octubre de 2024, así que valen para todo 2025.
 */
export const PARAMS_2025: PayrollParams = {
  ...PARAMS_2026,
  year: 2025,
  smn: 2750,
  sources: { ...PARAMS_2026.sources, smn: "Salario mínimo nacional 2025: Bs 2.750 (Ministerio de Trabajo)" },
};

const BY_YEAR: Record<number, PayrollParams> = { 2025: PARAMS_2025, 2026: PARAMS_2026 };

/** Años con parámetros cargados. Una planilla solo se puede crear para estos años. */
export const PAYROLL_YEARS = Object.keys(BY_YEAR).map(Number).sort((a, b) => a - b);

export function hasParamsForYear(year: number) {
  return year in BY_YEAR;
}

/** Parámetros del año; si no hay del año pedido, los más recientes anteriores (o los primeros). */
export function paramsForYear(year: number): PayrollParams {
  if (BY_YEAR[year]) return BY_YEAR[year];
  const years = Object.keys(BY_YEAR).map(Number).sort((a, b) => a - b);
  const fallback = years.filter((y) => y <= year).pop() ?? years[0];
  return { ...BY_YEAR[fallback], year };
}
// creado por pato dev y askforvini
