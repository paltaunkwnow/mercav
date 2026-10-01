import { STATUS } from "@/lib/kosher/labels";

export const EDITABLE_FIELDS = {
  status: { label: "Estado de kashrut", options: Object.keys(STATUS) },
  agencyName: { label: "Agencia certificadora", options: null },
  address: { label: "Dirección", options: null },
  phone: { label: "Teléfono", options: null },
  website: { label: "Sitio web", options: null },
  notes: { label: "Notas", options: null },
} as const satisfies Record<string, { label: string; options: readonly string[] | null }>;

export type EditableField = keyof typeof EDITABLE_FIELDS;

/** Solo http(s): z.string().url() acepta `javascript:` y esos valores terminan en un href. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Valida una sugerencia comunitaria. "certified" no se acepta por esta vía:
 * el estado certificado solo sale de un certificado revisado (Mercav no emite hechsher).
 */
export function editValueProblem(field: EditableField, value: string): string | null {
  if (field === "status" && value === "certified") {
    return "El estado certificado solo se carga con un certificado revisado por moderación.";
  }
  if (field === "website" && !isHttpUrl(value)) return "El sitio tiene que empezar con https://";
  return null;
}
