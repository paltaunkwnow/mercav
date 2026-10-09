import { latamCountry } from "../geo/latam";

/**
 * Lo que cambia por país en Business. Los legajos funcionan en toda Latinoamérica; la planilla
 * automática solo donde tenemos el motor de cálculo con la normativa local.
 */

export const PAYROLL_COUNTRIES = ["BO"] as const;

export function payrollSupported(country: string) {
  return (PAYROLL_COUNTRIES as readonly string[]).includes(country);
}

export type IdLabels = { document: string; documentExt: string | null; pension: string; health: string; region: string };

const LABELS: Record<string, IdLabels> = {
  BO: { document: "CI", documentExt: "Expedido en", pension: "NUA/CUA (Gestora)", health: "Matrícula CNS", region: "Departamento" },
  AR: { document: "DNI", documentExt: null, pension: "CUIL", health: "Obra social", region: "Provincia" },
  BR: { document: "CPF", documentExt: null, pension: "PIS/PASEP", health: "Cartão SUS", region: "Estado" },
  CL: { document: "RUT", documentExt: null, pension: "AFP", health: "Isapre/Fonasa", region: "Región" },
  CO: { document: "Cédula", documentExt: null, pension: "Fondo de pensiones", health: "EPS", region: "Departamento" },
  MX: { document: "CURP", documentExt: null, pension: "RFC", health: "NSS (IMSS)", region: "Estado" },
  PE: { document: "DNI", documentExt: null, pension: "AFP/ONP (CUSPP)", health: "EsSalud", region: "Departamento" },
  PY: { document: "Cédula", documentExt: null, pension: "IPS", health: "IPS", region: "Departamento" },
  UY: { document: "Cédula", documentExt: null, pension: "BPS", health: "FONASA", region: "Departamento" },
  EC: { document: "Cédula", documentExt: null, pension: "IESS", health: "IESS", region: "Provincia" },
};

const GENERIC: IdLabels = { document: "Documento de identidad", documentExt: null, pension: "Nº de pensión", health: "Nº de seguridad social", region: "Provincia o estado" };

export function idLabels(country: string): IdLabels {
  return LABELS[country] ?? GENERIC;
}

export function countryName(country: string) {
  return latamCountry(country).name;
}
// creado por pato dev y askforvini
