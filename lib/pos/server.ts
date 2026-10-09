import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { POSConfig } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roundMoney } from "./money";
import { POS_SCOPE_HEADER } from "./scope";
import { apiBusiness } from "@/lib/business/context";
import type { BusinessPermission, BusinessRoleKey } from "@/lib/business/permissions";

export type PosPermission = Extract<BusinessPermission, `pos.${string}`>;


/** Quién usa la caja y de quién es. `workspaceId` null: la caja personal de antes. */
export type PosScope = { userId: string; workspaceId: string | null; role: BusinessRoleKey | null; config: POSConfig | null };

type ScopeResult = { ok: true; scope: PosScope } | { ok: false; response: Response };
type PosContext = { ok: true; userId: string; config: POSConfig; workspaceId: string | null; role: BusinessRoleKey | null } | { ok: false; response: Response };

export function posError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Resuelve la caja del pedido. Con el encabezado de empresa, pasa por la membresía de Mercav Business y exige el
 * permiso (404 si no es miembro, 403 si su rol no alcanza). Sin él, es la caja personal de la sesión.
 */
export async function getPosScope(req: Request | undefined, permission: PosPermission): Promise<ScopeResult> {
  const slug = req?.headers.get(POS_SCOPE_HEADER)?.trim();
  if (slug) {
    const res = await apiBusiness(slug, permission);
    if ("error" in res) return { ok: false, response: res.error };
    const config = await prisma.pOSConfig.findUnique({ where: { workspaceId: res.ctx.workspace.id } });
    return { ok: true, scope: { userId: res.ctx.userId, workspaceId: res.ctx.workspace.id, role: res.ctx.role, config } };
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, response: posError("Unauthorized", 401) };
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { posConfig: true } });
  if (!user) return { ok: false, response: posError("Unauthorized", 401) };
  return { ok: true, scope: { userId: user.id, workspaceId: null, role: null, config: user.posConfig } };
}

/** Como getPosScope, pero la caja tiene que existir. */
export async function getPosContext(req: Request | undefined, permission: PosPermission = "pos.sell"): Promise<PosContext> {
  const res = await getPosScope(req, permission);
  if (!res.ok) return res;
  if (!res.scope.config) return { ok: false, response: posError("POS not configured") };
  return { ok: true, userId: res.scope.userId, config: res.scope.config, workspaceId: res.scope.workspaceId, role: res.scope.role };
}

/**
 * Datos de quién actuó, para guardar en ventas y cajas. En la caja de empresa los gestos sensibles ya los cubre el
 * rol; el PIN de encargado queda para la caja personal y para las terminales con personal por PIN.
 */
export function actorFields(ctx: { userId: string; workspaceId: string | null }) {
  return ctx.workspaceId ? ctx.userId : null;
}

interface SaleForSummary {
  totalAmount: unknown;
  payments?: { method: string; amount: unknown }[];
}

export function summarizeSales(sales: SaleForSummary[], decimals = 2) {
  const byMethod: Record<string, number> = {};
  let total = 0;
  for (const sale of sales) {
    total += Number(sale.totalAmount);
    const payments = sale.payments?.length ? sale.payments : [{ method: "CASH", amount: sale.totalAmount }];
    for (const p of payments) byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
  }
  for (const k of Object.keys(byMethod)) byMethod[k] = roundMoney(byMethod[k], decimals);
  return { total: roundMoney(total, decimals), count: sales.length, byMethod };
}
