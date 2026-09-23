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

  constructor(provider: string, message = "El proveedor externo no está disponible") {
    super(message);
    this.name = "PwnProviderError";
    this.provider = provider;
  }
}
