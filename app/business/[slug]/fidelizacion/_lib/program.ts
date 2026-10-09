import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/business/context";
import type { BusinessPermission } from "@/lib/business/permissions";
import { loadProgram, programView } from "@/lib/business/loyalty/service";

/**
 * Sesión + permiso + programa de esta empresa para las páginas del panel.
 * Un programa de otra empresa da 404 igual que uno que no existe. Devuelve solo la vista (sin secretos).
 */
export async function panelProgram(slug: string, programId: string, permission: BusinessPermission) {
  const ctx = await requireBusiness(slug, permission);
  const program = await loadProgram({ id: programId });
  if (!program || program.workspaceId !== ctx.workspace.id) notFound();
  return { ctx, view: programView(program) };
}
// creado por pato dev y askforvini
