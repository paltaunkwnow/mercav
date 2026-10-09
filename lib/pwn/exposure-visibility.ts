/**
 * Qué se puede mostrar de una consulta de exposición según quién pregunta.
 * - owner: objetivo propio verificado. Ve todo, también lo que HIBP marca como sensible.
 * - catalog: dominio contra el catálogo público de HIBP. Ve el detalle público, sin las sensibles.
 * - summary: correo ajeno, sin sesión o sin verificar. Solo sí/no y cuántas, sin contar las sensibles.
 */
export type ExposureAccess = "owner" | "catalog" | "summary";

export type VisibilityInput = { isFabricated: boolean; isSensitive: boolean };

export type ExposureView<T> = {
  scope: "full" | "summary";
  exposed: boolean;
  count: number;
  items: T[];
  hiddenSensitive: number;
};

export function exposureView<T extends VisibilityInput>(findings: T[], access: ExposureAccess): ExposureView<T> {
  const real = findings.filter((item) => !item.isFabricated);
  if (access === "owner") {
    return { scope: "full", exposed: real.length > 0, count: real.length, items: findings, hiddenSensitive: 0 };
  }
  const shareable = real.filter((item) => !item.isSensitive);
  if (access === "catalog") {
    return {
      scope: "full",
      exposed: shareable.length > 0,
      count: shareable.length,
      items: findings.filter((item) => !item.isSensitive),
      hiddenSensitive: real.length - shareable.length,
    };
  }
  // Ni siquiera el conteo de sensibles: diría que el correo está en una filtración sensible.
  return { scope: "summary", exposed: shareable.length > 0, count: shareable.length, items: [], hiddenSensitive: 0 };
}
// creado por pato dev y askforvini
