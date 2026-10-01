export type ConnectorResponse<T> =
  | { configured: false }
  | { configured: true; data: T };

export interface PwnConnector<TQuery, TResult> {
  readonly id: string;
  isConfigured(): boolean;
  search(query: TQuery): Promise<ConnectorResponse<TResult>>;
  fetch?(query: TQuery): Promise<ConnectorResponse<TResult>>;
}

export class PwnProviderError extends Error {
  readonly provider: string;
  /** true cuando el proveedor respondió con límite de tasa (HIBP 429, NVD 403/429). */
  readonly rateLimited: boolean;
  /** Segundos sugeridos por el proveedor (Retry-After), si los informó. */
  readonly retryAfterSeconds: number | null;

  constructor(
    provider: string,
    message = "El proveedor externo no está disponible",
    options: { rateLimited?: boolean; retryAfterSeconds?: number | null } = {},
  ) {
    super(message);
    this.name = "PwnProviderError";
    this.provider = provider;
    this.rateLimited = options.rateLimited ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

/** Lee Retry-After en segundos (acotado a 1..3600); ignora fechas HTTP o valores raros. */
export function retryAfterFrom(response: Response): number | null {
  const raw = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.min(3600, Math.max(1, Math.ceil(raw)));
}

/** Construye el error de límite de tasa del proveedor. */
export function rateLimitedError(provider: string, response: Response): PwnProviderError {
  return new PwnProviderError(provider, "El proveedor externo limitó las consultas", {
    rateLimited: true,
    retryAfterSeconds: retryAfterFrom(response),
  });
}
// creado por pato dev y askforvini
