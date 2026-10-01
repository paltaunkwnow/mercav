import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const STAFF_ROLES = ["CASHIER", "MANAGER"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PIN_PATTERN = /^\d{4,6}$/;

/** Fields that are safe to send to the browser. Never select pinHash outside this file. */
export const publicStaffSelect = { id: true, name: true, role: true, isActive: true, createdAt: true } as const;

export function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

// PIN attempts per POS, in this server's memory. Enough to stop guessing a 4-digit PIN by hand.
const WINDOW_MS = 60_000;
const MAX_FAILURES = 5;
const failures = new Map<string, number[]>();

function recentFailures(posConfigId: string) {
  const now = Date.now();
  const list = (failures.get(posConfigId) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(posConfigId, list);
  return list;
}

export function pinLocked(posConfigId: string) {
  return recentFailures(posConfigId).length >= MAX_FAILURES;
}

function recordFailure(posConfigId: string) {
  recentFailures(posConfigId).push(Date.now());
}

export const pinError = (code: "MANAGER_PIN_REQUIRED" | "PIN_INVALID" | "PIN_LOCKED", error: string) =>
  NextResponse.json({ success: false, code, error }, { status: code === "PIN_LOCKED" ? 429 : 403 });

const lockedResponse = () => pinError("PIN_LOCKED", "Demasiados intentos de PIN. Esperá un minuto y probá de nuevo.");

type PinCheck = { ok: true; staff: { id: string; name: string; role: string } } | { ok: false; response: NextResponse };

/** Checks a PIN against one person, or against every active person with the given role when staffId is omitted. */
export async function checkPin(posConfigId: string, pin: unknown, opts: { staffId?: string; role?: StaffRole } = {}): Promise<PinCheck> {
  if (pinLocked(posConfigId)) return { ok: false, response: lockedResponse() };
  if (typeof pin !== "string" || !PIN_PATTERN.test(pin)) {
    recordFailure(posConfigId);
    return { ok: false, response: pinError("PIN_INVALID", "PIN incorrecto.") };
  }

  const candidates = await prisma.pOSStaff.findMany({
    where: {
      posConfigId,
      isActive: true,
      ...(opts.staffId ? { id: opts.staffId } : {}),
      ...(opts.role ? { role: opts.role } : {}),
    },
    select: { id: true, name: true, role: true, pinHash: true },
  });

  for (const c of candidates) {
    if (await bcrypt.compare(pin, c.pinHash)) return { ok: true, staff: { id: c.id, name: c.name, role: c.role } };
  }
  recordFailure(posConfigId);
  return { ok: false, response: pinError("PIN_INVALID", "PIN incorrecto.") };
}

/** Who is running the open till, if anyone. */
export async function openSessionStaff(posConfigId: string) {
  const open = await prisma.pOSCashSession.findFirst({
    where: { posConfigId, status: "OPEN" },
    select: { staff: { select: { id: true, name: true, role: true } } },
  });
  return open?.staff ?? null;
}

type ManagerGate = { ok: true; actorStaffId: string | null } | { ok: false; response: NextResponse };

/**
 * When a CASHIER has the till open, sensitive actions (void, inventory, config, staff) need a MANAGER PIN.
 * The PIN comes from the `x-pos-manager-pin` header or from `bodyPin`.
 * actorStaffId is who authorised it: the manager, the person on the till, or null for the owner.
 */
export async function requireManager(req: Request, posConfigId: string, bodyPin?: unknown): Promise<ManagerGate> {
  const onTill = await openSessionStaff(posConfigId);
  if (!onTill || onTill.role !== "CASHIER") return { ok: true, actorStaffId: onTill?.id ?? null };

  const pin = bodyPin ?? req.headers.get("x-pos-manager-pin");
  if (!pin) return { ok: false, response: pinError("MANAGER_PIN_REQUIRED", "Esta acción necesita el PIN de un encargado.") };
  const check = await checkPin(posConfigId, pin, { role: "MANAGER" });
  if (!check.ok) return check;
  return { ok: true, actorStaffId: check.staff.id };
}
// creado por pato dev y askforvini
