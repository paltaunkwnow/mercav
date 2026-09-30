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
