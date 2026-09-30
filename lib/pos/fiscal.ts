interface CountryFiscal {
  taxIdLabel: string;
  taxName: string;
  taxRate: number | null;
}

// Standard rates only; reduced rates and exemptions are set per product.
const COUNTRY_FISCAL: Record<string, CountryFiscal> = {
  Argentina: { taxIdLabel: "CUIT o DNI", taxName: "IVA", taxRate: 21 },
  Bolivia: { taxIdLabel: "NIT o CI", taxName: "IVA", taxRate: 13 },
  Chile: { taxIdLabel: "RUT", taxName: "IVA", taxRate: 19 },
  Colombia: { taxIdLabel: "NIT o cédula", taxName: "IVA", taxRate: 19 },
  "Costa Rica": { taxIdLabel: "Cédula física o jurídica", taxName: "IVA", taxRate: 13 },
  Cuba: { taxIdLabel: "NIT o carné de identidad", taxName: "Impuesto", taxRate: null },
  Ecuador: { taxIdLabel: "RUC o cédula", taxName: "IVA", taxRate: 15 },
  "El Salvador": { taxIdLabel: "NIT o DUI", taxName: "IVA", taxRate: 13 },
  Guatemala: { taxIdLabel: "NIT", taxName: "IVA", taxRate: 12 },
  Honduras: { taxIdLabel: "RTN", taxName: "ISV", taxRate: 15 },
  México: { taxIdLabel: "RFC", taxName: "IVA", taxRate: 16 },
  Nicaragua: { taxIdLabel: "RUC o cédula", taxName: "IVA", taxRate: 15 },
  Panamá: { taxIdLabel: "RUC o cédula", taxName: "ITBMS", taxRate: 7 },
  Paraguay: { taxIdLabel: "RUC o CI", taxName: "IVA", taxRate: 10 },
  Perú: { taxIdLabel: "RUC o DNI", taxName: "IGV", taxRate: 18 },
  "República Dominicana": { taxIdLabel: "RNC o cédula", taxName: "ITBIS", taxRate: 18 },
  Uruguay: { taxIdLabel: "RUT o CI", taxName: "IVA", taxRate: 22 },
  Venezuela: { taxIdLabel: "RIF o CI", taxName: "IVA", taxRate: 16 },
};

export function countryFiscal(country: string | null | undefined): CountryFiscal {
  return COUNTRY_FISCAL[country ?? ""] ?? { taxIdLabel: "Identificación fiscal", taxName: "IVA", taxRate: null };
}
