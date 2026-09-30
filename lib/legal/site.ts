/** Datos públicos del responsable — revisar con asesoría legal antes de producción. */
export const LEGAL = {
  brand: "Mercav",
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME ?? "Mercav LATAM S.R.L. (en constitución)",
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID ?? "Pendiente de registro fiscal",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "La Paz, Bolivia",
  country: "Bolivia",
  emailLegal: "legal@mercav.lat",
  emailPrivacy: "privacidad@mercav.lat",
  emailSupport: "soporte@mercav.lat",
  emailFraud: "fraud@mercav.lat",
  dpoLabel: "Responsable de privacidad",
  lastUpdated: "29 de septiembre de 2026",
  cookiePolicyVersion: 2,
} as const;

export const SUBPROCESSORS = [
  { name: "Vercel Inc.", purpose: "Hosting y despliegue", region: "EE. UU. / global", url: "https://vercel.com/legal/privacy-policy" },
  { name: "Stripe, Inc.", purpose: "Pagos y cumplimiento PCI", region: "EE. UU. / global", url: "https://stripe.com/privacy" },
  { name: "Google LLC", purpose: "reCAPTCHA, inicio de sesión con Google", region: "EE. UU. / global", url: "https://policies.google.com/privacy" },
  { name: "Have I Been Pwned (Troy Hunt)", purpose: "Consultas de exposición (Mercav Pwn)", region: "Australia / API", url: "https://haveibeenpwned.com/Privacy" },
  { name: "OpenFreeMap", purpose: "Teselas del mapa de Mercav Kosher", region: "UE / global", url: "https://openfreemap.org/privacy" },
  { name: "CARTO", purpose: "Teselas del mapa de Mercav Kosher", region: "UE / global", url: "https://carto.com/privacy" },
] as const;
