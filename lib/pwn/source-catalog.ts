// Static metadata only. Connectors live elsewhere and must read keys server-side.

export type PwnSourceKey = "HIBP" | "NVD" | "CISA_KEV";

export interface PwnSourceDefinition {
  key: PwnSourceKey;
  name: string;
  sourceType: string;
  documentationUrl: string;
  /** Editorial starting point for PwnSource.historicalReliability; re-evaluate over time. */
  defaultReliability: number;
  verificationMethod: string;
  apiKeyEnv: string | null;
  apiKeyRequired: boolean;
  enabled: boolean;
  disabledReason: string | null;
  notes: string;
}

type Env = Record<string, string | undefined>;

function hasValue(env: Env, name: string): boolean {
  return typeof env[name] === "string" && env[name]!.trim().length > 0;
}

export function getSourceCatalog(env: Env = process.env): PwnSourceDefinition[] {
  const hibpKey = hasValue(env, "HIBP_API_KEY");
  const nvdKey = hasValue(env, "NVD_API_KEY");

  return [
    {
      key: "HIBP",
      name: "Have I Been Pwned",
      sourceType: "BREACH_API",
      documentationUrl: "https://haveibeenpwned.com/API/v3",
      defaultReliability: 90,
      verificationMethod: "Brechas revisadas y publicadas por HIBP",
      apiKeyEnv: "HIBP_API_KEY",
      apiKeyRequired: true,
      enabled: hibpKey,
      disabledReason: hibpKey ? null : "Falta HIBP_API_KEY",
      notes:
        "Buscar un correo concreto exige HIBP_API_KEY. Un dominio se consulta con el catálogo público. Pwned Passwords (k-anonimato) no necesita clave.",
    },
    {
      key: "NVD",
      name: "NIST National Vulnerability Database",
      sourceType: "VULNERABILITY_DB",
      documentationUrl: "https://nvd.nist.gov/developers/vulnerabilities",
      defaultReliability: 95,
      verificationMethod: "Registros CVE oficiales publicados por NIST",
      apiKeyEnv: "NVD_API_KEY",
      apiKeyRequired: false,
      enabled: true,
      disabledReason: null,
      notes: nvdKey
        ? "API key configurada."
        : "Sin NVD_API_KEY: funciona con límites de tasa más estrictos.",
    },
    {
      key: "CISA_KEV",
      name: "CISA Known Exploited Vulnerabilities",
      sourceType: "VULNERABILITY_CATALOG",
      documentationUrl: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
      defaultReliability: 95,
      verificationMethod: "Explotación activa confirmada por CISA",
      apiKeyEnv: null,
      apiKeyRequired: false,
      enabled: true,
      disabledReason: null,
      notes: "Catálogo público; no requiere API key.",
    },
  ];
}

export function getSourceDefinition(key: PwnSourceKey, env: Env = process.env): PwnSourceDefinition | undefined {
  return getSourceCatalog(env).find((source) => source.key === key);
}

export function isSourceEnabled(key: PwnSourceKey, env: Env = process.env): boolean {
  return getSourceDefinition(key, env)?.enabled ?? false;
}
// creado por pato dev y askforvini
