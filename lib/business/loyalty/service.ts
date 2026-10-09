import { Prisma, type LoyaltyCard, type LoyaltyProgram, type LoyaltyReward, type BusinessWorkspace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { zonedToUtc } from "@/lib/kosher/time";
import { birthdayDue, expiryState, normalizeDesign, normalizeRules, planEarn, planRedeem, progressFor, tierFor, type EarnRequest } from "./engine";
import { newReferralCode, newSerial } from "./codes";
import type { LoyaltyCardView, LoyaltyEventView, LoyaltyProgramView, LoyaltyRules, RewardView } from "./types";

/*
 * Escritura de Fidelización. Toda operación sobre una tarjeta:
 * 1) bloquea la fila (SELECT … FOR UPDATE) para que dos cajeros no la pisen,
 * 2) aplica vencimiento y cumpleaños pendientes,
 * 3) valida con el motor puro y escribe saldo + evento en la misma transacción.
 * clientRef hace idempotente cada acción (reintentos por mala señal no duplican sellos).
 */

type Tx = Prisma.TransactionClient;
type ProgramFull = LoyaltyProgram & { rewards: LoyaltyReward[]; workspace: Pick<BusinessWorkspace, "name" | "slug" | "country" | "currency"> };

export const programInclude = {
  rewards: { orderBy: [{ sortOrder: "asc" as const }, { cost: "asc" as const }] },
  workspace: { select: { name: true, slug: true, country: true, currency: true } },
};

export function rewardViews(rewards: LoyaltyReward[]): RewardView[] {
  return rewards.map((r) => ({ id: r.id, name: r.name, description: r.description, cost: r.cost, active: r.active }));
}

export function programView(p: ProgramFull): LoyaltyProgramView {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    type: p.type,
    businessType: p.businessType,
    status: p.status,
    rules: normalizeRules(p.rules, p.businessType),
    design: normalizeDesign(p.design, p.businessType, p.workspace.name),
    rewards: rewardViews(p.rewards),
    workspace: { name: p.workspace.name, slug: p.workspace.slug, country: p.workspace.country, currency: p.workspace.currency },
  };
}

export function cardView(card: LoyaltyCard, program: Pick<LoyaltyProgramView, "type" | "rules" | "rewards">, now = new Date()): LoyaltyCardView {
  const exp = expiryState(card.lastVisitAt, program.rules, now);
  return {
    id: card.id,
    serial: card.serial,
    customerName: card.customerName,
    balance: card.balance,
    lifetime: card.lifetime,
    visits: card.visits,
    lastVisitAt: card.lastVisitAt?.toISOString() ?? null,
    expiresOn: exp.expiresOn,
    status: card.status,
    referralCode: card.referralCode,
    progress: progressFor(program.type, program.rules, program.rewards, card.balance),
    tier: tierFor(card.lifetime, program.rules.tiers),
    createdAt: card.createdAt.toISOString(),
    customerNo: card.customerNo,
    holderStatus: card.holderStatus,
  };
}

export function eventView(e: { id: string; type: LoyaltyEventView["type"]; amount: number; balanceAfter: number; source: LoyaltyEventView["source"]; note: string | null; createdAt: Date; reward?: { name: string } | null }): LoyaltyEventView {
  return { id: e.id, type: e.type, amount: e.amount, balanceAfter: e.balanceAfter, rewardName: e.reward?.name ?? null, source: e.source, note: e.note, createdAt: e.createdAt.toISOString() };
}

/** Comienzo del día de hoy en el país de la empresa (para los topes diarios). */
export function dayStart(country: string, now = new Date()) {
  const tz = latamCountry(country).timezone;
  return zonedToUtc(`${todayIn(tz, now)}T00:00`, tz) ?? new Date(now.getTime() - 86_400_000);
}

export async function loadProgram(where: Prisma.LoyaltyProgramWhereUniqueInput): Promise<ProgramFull | null> {
  return prisma.loyaltyProgram.findUnique({ where, include: programInclude });
}

async function lockCard(tx: Tx, cardId: string) {
  await tx.$queryRaw`SELECT id FROM "LoyaltyCard" WHERE id = ${cardId} FOR UPDATE`;
  return tx.loyaltyCard.findUniqueOrThrow({ where: { id: cardId } });
}

/** Vencimiento por inactividad y regalo de cumpleaños pendientes. Devuelve la tarjeta al día. */
async function maintain(tx: Tx, card: LoyaltyCard, program: ProgramFull, rules: LoyaltyRules, now: Date): Promise<LoyaltyCard> {
  let current = card;
  const exp = expiryState(current.lastVisitAt, rules, now);
  if (exp.expired && current.balance > 0) {
    const lost = current.balance;
    current = await tx.loyaltyCard.update({ where: { id: current.id }, data: { balance: 0 } });
    await tx.loyaltyEvent.create({ data: { cardId: current.id, programId: program.id, type: "EXPIRE", amount: -lost, balanceAfter: 0, source: "SYSTEM", note: `Venció por ${rules.expiresDays} días sin visitas` } });
  }
  const today = todayIn(latamCountry(program.workspace.country).timezone, now);
  const year = birthdayDue(current.birthday, current.lastBirthdayYear, rules, today);
  if (year) {
    current = await tx.loyaltyCard.update({
      where: { id: current.id },
      data: { balance: { increment: rules.birthdayBonus }, lifetime: { increment: rules.birthdayBonus }, lastBirthdayYear: year },
    });
    await tx.loyaltyEvent.create({ data: { cardId: current.id, programId: program.id, type: "BIRTHDAY", amount: rules.birthdayBonus, balanceAfter: current.balance, source: "SYSTEM", note: "Regalo de cumpleaños" } });
  }
  return current;
}

/** Aplica pendientes de una tarjeta fuera de una acción (por ejemplo, al abrir la tarjeta web). */
export async function refreshCard(cardId: string, program: ProgramFull, now = new Date()) {
  const rules = normalizeRules(program.rules, program.businessType);
  return prisma.$transaction(async (tx) => maintain(tx, await lockCard(tx, cardId), program, rules, now));
}

export type ActionResult =
  | { ok: true; card: LoyaltyCardView; event: { type: LoyaltyEventView["type"]; amount: number; rewardName?: string }; replayed?: boolean }
  | { ok: false; status: number; message: string; code?: string };

async function replay(clientRef: string | undefined, program: ProgramFull): Promise<ActionResult | null> {
  if (!clientRef) return null;
  const prev = await prisma.loyaltyEvent.findUnique({ where: { clientRef }, include: { card: true, reward: { select: { name: true } } } });
  if (!prev) return null;
  if (prev.programId !== program.id) return { ok: false, status: 409, message: "Referencia repetida." };
  const view = programView(program);
  return { ok: true, replayed: true, card: cardView(prev.card, view), event: { type: prev.type, amount: prev.amount, rewardName: prev.reward?.name } };
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function earn(opts: {
  program: ProgramFull;
  cardId: string;
  request: EarnRequest;
  source: "STAFF" | "SELF_SERVICE";
  actorUserId: string | null;
  clientRef?: string;
  note?: string | null;
  now?: Date;
}): Promise<ActionResult> {
  const { program, source } = opts;
  const now = opts.now ?? new Date();
  const replayed = await replay(opts.clientRef, program);
  if (replayed) return replayed;
  if (program.status !== "ACTIVE") return { ok: false, status: 400, message: "El programa no está activo." };
  const rules = normalizeRules(program.rules, program.businessType);
  try {
    return await prisma.$transaction(async (tx) => {
      let card = await lockCard(tx, opts.cardId);
      if (card.programId !== program.id) return { ok: false, status: 404, message: "Tarjeta no encontrada." } as ActionResult;
      if (card.status !== "ACTIVE") return { ok: false, status: 400, message: "Esta tarjeta está bloqueada." } as ActionResult;
      if (source === "STAFF" && card.userId && card.userId === opts.actorUserId) {
        return { ok: false, status: 403, message: "No podés sumar en tu propia tarjeta." } as ActionResult;
      }
      card = await maintain(tx, card, program, rules, now);

      const since = dayStart(program.workspace.country, now);
      const [today, selfToday, last] = await Promise.all([
        tx.loyaltyEvent.aggregate({ where: { cardId: card.id, type: { in: ["STAMP", "POINTS"] }, createdAt: { gte: since } }, _sum: { amount: true } }),
        tx.loyaltyEvent.count({ where: { cardId: card.id, source: "SELF_SERVICE", createdAt: { gte: since } } }),
        tx.loyaltyEvent.findFirst({ where: { cardId: card.id, type: { in: ["STAMP", "POINTS"] } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      ]);
      const plan = planEarn(opts.request, {
        type: program.type,
        rules,
        earnedToday: today._sum.amount ?? 0,
        selfServiceToday: selfToday,
        lastEarnAt: last?.createdAt ?? null,
        source,
        now,
      });
      if (!plan.ok) return { ok: false, status: 400, message: plan.message, code: plan.code } as ActionResult;

      card = await tx.loyaltyCard.update({
        where: { id: card.id },
        data: { balance: { increment: plan.amount }, lifetime: { increment: plan.amount }, visits: { increment: 1 }, lastVisitAt: now },
      });
      const type = program.type === "STAMPS" ? "STAMP" : "POINTS";
      await tx.loyaltyEvent.create({
        data: {
          cardId: card.id,
          programId: program.id,
          type,
          amount: plan.amount,
          balanceAfter: card.balance,
          purchaseAmount: opts.request.kind === "purchase" ? new Prisma.Decimal(Math.round(opts.request.amount * 100) / 100) : null,
          source,
          actorUserId: opts.actorUserId,
          clientRef: opts.clientRef ?? null,
          note: opts.note ?? null,
        },
      });

      // Premio para quien lo invitó, cuando el referido suma por primera vez.
      if (card.referredById && !card.referralRewarded && rules.referralBonus > 0) {
        const referrer = await lockCard(tx, card.referredById);
        card = await tx.loyaltyCard.update({ where: { id: card.id }, data: { referralRewarded: true } });
        if (referrer.status === "ACTIVE" && referrer.programId === program.id) {
          const updated = await tx.loyaltyCard.update({
            where: { id: referrer.id },
            data: { balance: { increment: rules.referralBonus }, lifetime: { increment: rules.referralBonus } },
          });
          await tx.loyaltyEvent.create({
            data: { cardId: referrer.id, programId: program.id, type: "REFERRAL", amount: rules.referralBonus, balanceAfter: updated.balance, source: "SYSTEM", note: `Invitaste a ${card.customerName.split(" ")[0]}` },
          });
        }
      }
      return { ok: true, card: cardView(card, programView(program), now), event: { type, amount: plan.amount } } as ActionResult;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return (await replay(opts.clientRef, program)) ?? { ok: false, status: 409, message: "Esa acción ya se registró." };
    throw error;
  }
}

export async function redeem(opts: { program: ProgramFull; cardId: string; rewardId: string; actorUserId: string | null; clientRef?: string; now?: Date }): Promise<ActionResult> {
  const { program } = opts;
  const now = opts.now ?? new Date();
  const replayed = await replay(opts.clientRef, program);
  if (replayed) return replayed;
  if (program.status !== "ACTIVE") return { ok: false, status: 400, message: "El programa no está activo." };
  const rules = normalizeRules(program.rules, program.businessType);
  const reward = program.rewards.find((r) => r.id === opts.rewardId) ?? null;
  try {
    return await prisma.$transaction(async (tx) => {
      let card = await lockCard(tx, opts.cardId);
      if (card.programId !== program.id) return { ok: false, status: 404, message: "Tarjeta no encontrada." } as ActionResult;
      if (card.status !== "ACTIVE") return { ok: false, status: 400, message: "Esta tarjeta está bloqueada." } as ActionResult;
      if (card.userId && card.userId === opts.actorUserId) return { ok: false, status: 403, message: "No podés canjear en tu propia tarjeta." } as ActionResult;
      card = await maintain(tx, card, program, rules, now);
      const plan = planRedeem(card.balance, reward);
      if (!plan.ok) return { ok: false, status: 400, message: plan.message } as ActionResult;
      const done = await tx.loyaltyCard.updateMany({ where: { id: card.id, balance: { gte: plan.cost } }, data: { balance: { decrement: plan.cost } } });
      if (done.count !== 1) return { ok: false, status: 409, message: "El saldo cambió. Probá de nuevo." } as ActionResult;
      card = await tx.loyaltyCard.findUniqueOrThrow({ where: { id: card.id } });
      await tx.loyaltyEvent.create({
        data: { cardId: card.id, programId: program.id, type: "REDEEM", amount: -plan.cost, balanceAfter: card.balance, rewardId: reward!.id, source: "STAFF", actorUserId: opts.actorUserId, clientRef: opts.clientRef ?? null },
      });
      return { ok: true, card: cardView(card, programView(program), now), event: { type: "REDEEM", amount: -plan.cost, rewardName: reward!.name } } as ActionResult;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return (await replay(opts.clientRef, program)) ?? { ok: false, status: 409, message: "Esa acción ya se registró." };
    throw error;
  }
}

/** Ajuste manual de saldo desde el panel (con motivo). No toca el acumulado de por vida. */
export async function adjust(opts: { program: ProgramFull; cardId: string; delta: number; note: string; actorUserId: string }): Promise<ActionResult> {
  const { program } = opts;
  return prisma.$transaction(async (tx) => {
    const card = await lockCard(tx, opts.cardId);
    if (card.programId !== program.id) return { ok: false, status: 404, message: "Tarjeta no encontrada." } as ActionResult;
    const delta = Math.round(opts.delta);
    if (!delta || card.balance + delta < 0) return { ok: false, status: 400, message: "El saldo no puede quedar negativo." } as ActionResult;
    const updated = await tx.loyaltyCard.update({ where: { id: card.id }, data: { balance: { increment: delta } } });
    await tx.loyaltyEvent.create({ data: { cardId: card.id, programId: program.id, type: "ADJUST", amount: delta, balanceAfter: updated.balance, source: "STAFF", actorUserId: opts.actorUserId, note: opts.note.slice(0, 200) } });
    return { ok: true, card: cardView(updated, programView(program)), event: { type: "ADJUST", amount: delta } } as ActionResult;
  });
}

/**
 * Celular en formato internacional (+591…). Sin "+", se asume el país de la empresa, así
 * "+591 70000001", "59170000001" y "70000001" son el mismo número. El largo nacional
 * desempata casos como el área 55 de Brasil, que también es su código de país.
 */
export function normalizePhone(raw: string | null | undefined, country?: string | null) {
  if (!raw) return null;
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!trimmed.startsWith("+")) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    else {
      const { dialCode, phoneDigits } = latamCountry(country);
      const fits = (n: number) => n >= phoneDigits[0] && n <= phoneDigits[1];
      const local = digits.replace(/^0+/, "");
      const international = digits.startsWith(dialCode) && fits(digits.length - dialCode.length) && !fits(local.length);
      if (!international) digits = `${dialCode}${local}`;
    }
  }
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

export type JoinResult = { ok: true; card: LoyaltyCard } | { ok: false; status: number; message: string };

/** Alta de un cliente. Si viene con código de referido del mismo programa, queda vinculado. */
export async function joinProgram(opts: {
  program: ProgramFull;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  marketingConsent: boolean;
  referralCode: string | null;
  userId: string | null;
  /** Quién la da de alta desde el negocio (null: el cliente solo, con el QR). */
  actorUserId?: string | null;
  /** Se mostró y aceptó el aviso de datos reales. */
  realDataAck?: boolean;
}): Promise<JoinResult> {
  const { program } = opts;
  if (program.status !== "ACTIVE") return { ok: false, status: 400, message: "Este programa no está recibiendo clientes por ahora." };
  const rules = normalizeRules(program.rules, program.businessType);
  const phone = normalizePhone(opts.phone, program.workspace.country);
  if (opts.phone && !phone) return { ok: false, status: 400, message: "Revisá el número de celular." };
  if (phone) {
    const taken = await prisma.loyaltyCard.findUnique({ where: { programId_phone: { programId: program.id, phone } }, select: { id: true } });
    if (taken) return { ok: false, status: 409, message: "Ese celular ya tiene una tarjeta en este programa. Abrila desde el link que guardaste." };
  }
  const referrer = opts.referralCode
    ? await prisma.loyaltyCard.findFirst({ where: { programId: program.id, referralCode: opts.referralCode.toUpperCase(), status: "ACTIVE" }, select: { id: true } })
    : null;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const card = await prisma.$transaction(async (tx) => {
        // Número de cliente: el contador del programa se reserva con la fila bloqueada por el UPDATE.
        const counter = await tx.loyaltyProgram.update({ where: { id: program.id }, data: { nextCustomerNo: { increment: 1 } }, select: { nextCustomerNo: true } });
        const created = await tx.loyaltyCard.create({
          data: {
            programId: program.id,
            customerNo: counter.nextCustomerNo - 1,
            serial: newSerial(),
            referralCode: newReferralCode(),
            customerName: opts.name.trim().slice(0, 60),
            phone,
            email: opts.email?.trim().toLowerCase().slice(0, 120) || null,
            birthday: opts.birthday && /^\d{2}-\d{2}$/.test(opts.birthday) ? opts.birthday : null,
            marketingConsent: opts.marketingConsent,
            referredById: referrer?.id ?? null,
            userId: opts.userId,
            // Con cuenta desde el alta (código MercavClub): queda pendiente hasta que el negocio vea el documento.
            linkedAt: opts.userId ? new Date() : null,
            holderStatus: opts.userId ? "PENDING" : "UNVERIFIED",
            createdById: opts.actorUserId ?? null,
            realDataAckAt: opts.realDataAck ? new Date() : null,
            balance: rules.welcomeBonus,
            lifetime: rules.welcomeBonus,
          },
        });
        await tx.loyaltyEvent.create({
          data: opts.actorUserId
            ? { cardId: created.id, programId: program.id, type: "JOIN", amount: 0, balanceAfter: 0, source: "STAFF", actorUserId: opts.actorUserId, note: "Alta desde el negocio" }
            : { cardId: created.id, programId: program.id, type: "JOIN", amount: 0, balanceAfter: 0, source: "SYSTEM" },
        });
        if (rules.welcomeBonus > 0) {
          await tx.loyaltyEvent.create({ data: { cardId: created.id, programId: program.id, type: "WELCOME", amount: rules.welcomeBonus, balanceAfter: created.balance, source: "SYSTEM", note: "Regalo de bienvenida" } });
        }
        return created;
      });
      return { ok: true, card };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const target = String((error as Prisma.PrismaClientKnownRequestError).meta?.target ?? "");
      if (target.includes("phone")) return { ok: false, status: 409, message: "Ese celular ya tiene una tarjeta en este programa." };
      if (target.includes("userId")) return { ok: false, status: 409, message: "Esa cuenta ya tiene una tarjeta en este programa." };
      // Choque de serial o código: se reintenta con otros.
    }
  }
  return { ok: false, status: 500, message: "No pudimos crear la tarjeta. Probá de nuevo." };
}

type HolderResult = { ok: true; card: LoyaltyCard } | { ok: false; status: number; message: string };

const CLEAR_HOLDER = { holderVerifiedAt: null, holderVerifiedById: null, holderDocType: null, holderDocLast4: null } as const;

/**
 * El cliente guarda su tarjeta en su cuenta Mercav. Queda PENDING: la cookie o el link no prueban que sea el
 * titular (el personal y cualquiera que fotografió el QR los conocen); lo prueba el negocio viendo su documento.
 */
export async function linkCardToUser(cardId: string, userId: string): Promise<HolderResult> {
  try {
    return await prisma.$transaction(async (tx): Promise<HolderResult> => {
      const card = await lockCard(tx, cardId);
      if (card.userId === userId) return { ok: true, card };
      if (card.userId) return { ok: false, status: 409, message: "Esta tarjeta ya está guardada en otra cuenta. Si es tuya, pedí ayuda en el negocio." };
      const updated = await tx.loyaltyCard.update({
        where: { id: card.id },
        data: { userId, linkedAt: new Date(), holderStatus: "PENDING", realDataAckAt: new Date(), ...CLEAR_HOLDER },
      });
      return { ok: true, card: updated };
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, status: 409, message: "Ya tenés otra tarjeta de este club en tu cuenta." };
    throw error;
  }
}

/**
 * El negocio revisó el documento en persona y coincide con la tarjeta y la cuenta. La tarjeta cambia de serial:
 * las fotos viejas del QR y los links que conocía el personal dejan de servir.
 */
export async function verifyCardHolder(cardId: string, actorUserId: string, doc: { type: string; last4: string }): Promise<HolderResult> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx): Promise<HolderResult> => {
        const card = await lockCard(tx, cardId);
        if (!card.userId) return { ok: false, status: 400, message: "Esta tarjeta todavía no está guardada en una cuenta Mercav." };
        const updated = await tx.loyaltyCard.update({
          where: { id: card.id },
          data: { holderStatus: "VERIFIED", holderVerifiedAt: new Date(), holderVerifiedById: actorUserId, holderDocType: doc.type, holderDocLast4: doc.last4, serial: newSerial() },
        });
        return { ok: true, card: updated };
      });
    } catch (error) {
      // Choque de serial: se reintenta con otro.
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return { ok: false, status: 500, message: "No pudimos validar al titular. Probá de nuevo." };
}

/** Saca la tarjeta de la cuenta (no era el titular, o el cliente lo pidió). El saldo queda en la tarjeta. */
export async function unlinkCardHolder(cardId: string): Promise<HolderResult> {
  const card = await prisma.loyaltyCard.update({ where: { id: cardId }, data: { userId: null, linkedAt: null, holderStatus: "UNVERIFIED", ...CLEAR_HOLDER } });
  return { ok: true, card };
}

/** Busca una tarjeta por serial dentro de una empresa (el cajero solo ve las suyas). */
export async function findCardInWorkspace(workspaceId: string, serial: string) {
  const card = await prisma.loyaltyCard.findUnique({ where: { serial }, include: { program: { include: programInclude } } });
  if (!card || card.program.workspaceId !== workspaceId) return null;
  return card;
}

export async function cardHistory(cardId: string, take = 20): Promise<LoyaltyEventView[]> {
  const events = await prisma.loyaltyEvent.findMany({ where: { cardId }, orderBy: { createdAt: "desc" }, take, include: { reward: { select: { name: true } } } });
  return events.map(eventView);
}
// creado por pato dev y askforvini
