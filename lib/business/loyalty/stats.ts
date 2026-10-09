import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { zonedToUtc } from "@/lib/kosher/time";
import { cardView, dayStart, eventView } from "./service";
import { tierFor } from "./engine";
import { parseClubCode } from "./codes";
import { matchesAudience, normalizeAudience, type CampaignAudience } from "./campaigns";
import {
  AT_RISK_DAYS,
  CUSTOMERS_PAGE_SIZE,
  DAY_MS,
  WEEK_MS,
  describeAudience,
  isAtRisk,
  minRewardCost,
  percent,
  phoneDigits,
  weeklySeries,
  type CampaignView,
  type CardFilter,
  type CustomerDetail,
  type CustomerRow,
  type WeeklyPoint,
  type WeeklyRow,
} from "./stats-core";
import type { LoyaltyProgramView } from "./types";

/*
 * Consultas del panel de Fidelización. Solo servidor.
 * Todas reciben un programa ya validado contra la empresa de la sesión (programId de esa empresa).
 */

const EARN_TYPES: ("STAMP" | "POINTS")[] = ["STAMP", "POINTS"];

export type ProgramSummary = { members: number; active30: number; redeemed30: number };

/** Números chicos para la lista de programas, en tres consultas para todos a la vez. */
export async function programSummaries(programIds: string[], now = new Date()): Promise<Map<string, ProgramSummary>> {
  const out = new Map<string, ProgramSummary>(programIds.map((id) => [id, { members: 0, active30: 0, redeemed30: 0 }]));
  if (!programIds.length) return out;
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const [members, active, redeemed] = await Promise.all([
    prisma.loyaltyCard.groupBy({ by: ["programId"], where: { programId: { in: programIds } }, _count: { _all: true } }),
    prisma.loyaltyCard.groupBy({ by: ["programId"], where: { programId: { in: programIds }, lastVisitAt: { gte: since } }, _count: { _all: true } }),
    prisma.loyaltyEvent.groupBy({ by: ["programId"], where: { programId: { in: programIds }, type: "REDEEM", createdAt: { gte: since } }, _count: { _all: true } }),
  ]);
  for (const row of members) out.get(row.programId)!.members = row._count._all;
  for (const row of active) out.get(row.programId)!.active30 = row._count._all;
  for (const row of redeemed) out.get(row.programId)!.redeemed30 = row._count._all;
  return out;
}

/** Tarjetas activas que no suman hace AT_RISK_DAYS (o que se sumaron y nunca volvieron). */
export function atRiskWhere(now: Date, days = AT_RISK_DAYS): Prisma.LoyaltyCardWhereInput {
  const cutoff = new Date(now.getTime() - days * DAY_MS);
  return { status: "ACTIVE", OR: [{ lastVisitAt: { lt: cutoff } }, { lastVisitAt: null, createdAt: { lt: cutoff } }] };
}

export type ProgramStats = {
  members: number;
  active30: number;
  newThisMonth: number;
  earned30: number;
  redeemed30: number;
  repeatCount: number;
  repeatRate: number;
  atRisk: number;
  rewardReady: number;
  blocked: number;
  weekly: WeeklyPoint[];
  staffToday: { userId: string; name: string; amount: number; actions: number }[];
  cappedToday: { cardId: string; name: string; amount: number }[];
  selfServiceToday: number;
};

export async function programStats(program: LoyaltyProgramView, now = new Date()): Promise<ProgramStats> {
  const programId = program.id;
  const tz = latamCountry(program.workspace.country).timezone;
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const today = todayIn(tz, now);
  const monthStart = zonedToUtc(`${today.slice(0, 8)}01T00:00`, tz) ?? new Date(now.getTime() - 31 * DAY_MS);
  const todayStart = dayStart(program.workspace.country, now);
  const minCost = minRewardCost(program.rewards);
  const nowSec = Math.floor(now.getTime() / 1000);
  const weeklySinceSec = Math.floor((now.getTime() - 8 * WEEK_MS) / 1000);

  const [members, active30, newThisMonth, earned, redeemed30, repeatCount, atRisk, rewardReady, blocked, weeklyRows, staff, capped, selfServiceToday] =
    await Promise.all([
      prisma.loyaltyCard.count({ where: { programId } }),
      prisma.loyaltyCard.count({ where: { programId, lastVisitAt: { gte: since30 } } }),
      prisma.loyaltyCard.count({ where: { programId, createdAt: { gte: monthStart } } }),
      prisma.loyaltyEvent.aggregate({ where: { programId, type: { in: EARN_TYPES }, createdAt: { gte: since30 } }, _sum: { amount: true } }),
      prisma.loyaltyEvent.count({ where: { programId, type: "REDEEM", createdAt: { gte: since30 } } }),
      prisma.loyaltyCard.count({ where: { programId, visits: { gte: 2 } } }),
      prisma.loyaltyCard.count({ where: { programId, ...atRiskWhere(now) } }),
      minCost === null ? Promise.resolve(0) : prisma.loyaltyCard.count({ where: { programId, status: "ACTIVE", balance: { gte: minCost } } }),
      prisma.loyaltyCard.count({ where: { programId, status: "BLOCKED" } }),
      // Semanas móviles: (ahora - createdAt) / 7 días. Las fechas se guardan en UTC.
      prisma.$queryRaw<WeeklyRow[]>(Prisma.sql`
        SELECT FLOOR((${nowSec} - EXTRACT(EPOCH FROM "createdAt")) / 604800)::int AS "week",
               CASE WHEN "type" = 'REDEEM' THEN 'redeem' ELSE 'earn' END AS "kind",
               COUNT(*)::int AS "count"
        FROM "LoyaltyEvent"
        WHERE "programId" = ${programId}
          AND "createdAt" > (to_timestamp(${weeklySinceSec}) AT TIME ZONE 'UTC')
          AND "type" IN ('STAMP', 'POINTS', 'REDEEM')
        GROUP BY 1, 2`),
      prisma.loyaltyEvent.groupBy({
        by: ["actorUserId"],
        where: { programId, type: { in: EARN_TYPES }, source: "STAFF", createdAt: { gte: todayStart }, actorUserId: { not: null } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.loyaltyEvent.groupBy({
        by: ["cardId"],
        where: { programId, type: { in: EARN_TYPES }, createdAt: { gte: todayStart } },
        _sum: { amount: true },
        having: { amount: { _sum: { gte: program.rules.maxPerDay } } },
      }),
      prisma.loyaltyEvent.count({ where: { programId, source: "SELF_SERVICE", createdAt: { gte: todayStart } } }),
    ]);

  const staffIds = staff.map((s) => s.actorUserId).filter((id): id is string => !!id);
  const cappedIds = capped.map((c) => c.cardId).slice(0, 20);
  const [users, cards] = await Promise.all([
    staffIds.length ? prisma.user.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
    cappedIds.length ? prisma.loyaltyCard.findMany({ where: { id: { in: cappedIds }, programId }, select: { id: true, customerName: true } }) : Promise.resolve([]),
  ]);
  const userName = new Map(users.map((u) => [u.id, u.name]));
  const cardName = new Map(cards.map((c) => [c.id, c.customerName]));

  return {
    members,
    active30,
    newThisMonth,
    earned30: earned._sum.amount ?? 0,
    redeemed30,
    repeatCount,
    repeatRate: percent(repeatCount, members),
    atRisk,
    rewardReady,
    blocked,
    weekly: weeklySeries(weeklyRows, now, tz, 8),
    staffToday: staff
      .filter((s) => s.actorUserId)
      .map((s) => ({ userId: s.actorUserId!, name: userName.get(s.actorUserId!) ?? "Persona sin nombre", amount: s._sum.amount ?? 0, actions: s._count._all }))
      .sort((a, b) => b.amount - a.amount),
    cappedToday: capped
      .filter((c) => cardName.has(c.cardId))
      .map((c) => ({ cardId: c.cardId, name: cardName.get(c.cardId)!, amount: c._sum.amount ?? 0 }))
      .sort((a, b) => b.amount - a.amount),
    selfServiceToday,
  };
}

/** Filtro de la lista de clientes (también lo usa la exportación). */
export function customerWhere(program: LoyaltyProgramView, filter: CardFilter, query: string, now = new Date()): Prisma.LoyaltyCardWhereInput {
  const and: Prisma.LoyaltyCardWhereInput[] = [{ programId: program.id }];
  if (filter === "atRisk") and.push(atRiskWhere(now));
  if (filter === "blocked") and.push({ status: "BLOCKED" });
  if (filter === "reward") {
    const minCost = minRewardCost(program.rewards);
    // Sin premios activos nadie tiene algo para canjear.
    and.push(minCost === null ? { id: { in: [] } } : { status: "ACTIVE", balance: { gte: minCost } });
  }
  if (query) {
    const digits = phoneDigits(query);
    // "#12" o un número corto es el número de cliente; "MC-…" el código MercavClub de la cuenta vinculada.
    const customerNo = /^#?\s*(\d{1,6})$/.exec(query.trim());
    const club = parseClubCode(query);
    and.push({
      OR: [
        { customerName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        ...(digits && !query.trim().startsWith("#") ? [{ phone: { contains: digits } }] : []),
        ...(customerNo ? [{ customerNo: Number(customerNo[1]) }] : []),
        ...(club ? [{ user: { clubCode: club } }] : []),
      ],
    });
  }
  return { AND: and };
}

type CardRowSource = {
  id: string;
  customerNo: number;
  holderStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  customerName: string;
  phone: string | null;
  email: string | null;
  balance: number;
  lifetime: number;
  visits: number;
  lastVisitAt: Date | null;
  status: "ACTIVE" | "BLOCKED";
  marketingConsent: boolean;
  createdAt: Date;
};

export const customerSelect = {
  id: true,
  customerNo: true,
  holderStatus: true,
  customerName: true,
  phone: true,
  email: true,
  balance: true,
  lifetime: true,
  visits: true,
  lastVisitAt: true,
  status: true,
  marketingConsent: true,
  createdAt: true,
} satisfies Prisma.LoyaltyCardSelect;

export function customerRow(card: CardRowSource, program: LoyaltyProgramView, now = new Date()): CustomerRow {
  const minCost = minRewardCost(program.rewards);
  return {
    id: card.id,
    customerNo: card.customerNo,
    holderStatus: card.holderStatus,
    name: card.customerName,
    phone: card.phone,
    email: card.email,
    balance: card.balance,
    lifetime: card.lifetime,
    visits: card.visits,
    lastVisitAt: card.lastVisitAt?.toISOString() ?? null,
    tier: tierFor(card.lifetime, program.rules.tiers).current?.name ?? null,
    status: card.status,
    rewardReady: card.status === "ACTIVE" && minCost !== null && card.balance >= minCost,
    atRisk: card.status === "ACTIVE" && isAtRisk(card.lastVisitAt, card.createdAt, now),
    marketingConsent: card.marketingConsent,
    createdAt: card.createdAt.toISOString(),
  };
}

export const customerOrder: Prisma.LoyaltyCardOrderByWithRelationInput[] = [{ lastVisitAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }];

export async function listCustomers(program: LoyaltyProgramView, opts: { filter: CardFilter; query: string; page: number }, now = new Date()) {
  const where = customerWhere(program, opts.filter, opts.query, now);
  const total = await prisma.loyaltyCard.count({ where });
  const pages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const page = Math.min(opts.page, pages);
  const cards = await prisma.loyaltyCard.findMany({ where, select: customerSelect, orderBy: customerOrder, skip: (page - 1) * CUSTOMERS_PAGE_SIZE, take: CUSTOMERS_PAGE_SIZE });
  return { items: cards.map((c) => customerRow(c, program, now)), total, page, pages, pageSize: CUSTOMERS_PAGE_SIZE };
}

/** Ficha de un cliente con su historial y quién hizo cada movimiento. Null si la tarjeta no es de este programa. */
export async function customerDetail(program: LoyaltyProgramView, cardId: string, now = new Date()): Promise<CustomerDetail | null> {
  const card = await prisma.loyaltyCard.findFirst({ where: { id: cardId, programId: program.id } });
  if (!card) return null;
  const [events, referrals] = await Promise.all([
    prisma.loyaltyEvent.findMany({ where: { cardId: card.id }, orderBy: { createdAt: "desc" }, take: 30, include: { reward: { select: { name: true } } } }),
    prisma.loyaltyCard.count({ where: { referredById: card.id } }),
  ]);
  const actorIds = Array.from(new Set([...events.map((e) => e.actorUserId), card.userId].filter((id): id is string => !!id)));
  const actors = actorIds.length ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } }) : [];
  const actorName = new Map(actors.map((a) => [a.id, a.name]));
  const view = cardView(card, program, now);
  return {
    ...customerRow(card, program, now),
    birthday: card.birthday,
    progressLabel: view.progress.label,
    nextTier: view.tier.next?.name ?? null,
    toNextTier: view.tier.toNext,
    expiresOn: view.expiresOn,
    referrals,
    history: events.map((e) => ({ ...eventView(e), actorName: e.actorUserId ? actorName.get(e.actorUserId) ?? null : null })),
    holderAccountName: card.userId ? actorName.get(card.userId) ?? null : null,
    holderVerifiedAt: card.holderVerifiedAt?.toISOString() ?? null,
    holderDoc: card.holderDocType && card.holderDocLast4 ? `${card.holderDocType} ···${card.holderDocLast4}` : null,
  };
}

/** Últimas campañas del programa, con quién las mandó. */
export async function listCampaigns(programId: string, take = 50): Promise<CampaignView[]> {
  const campaigns = await prisma.loyaltyCampaign.findMany({ where: { programId }, orderBy: { createdAt: "desc" }, take });
  const authorIds = Array.from(new Set(campaigns.map((c) => c.createdById)));
  const authors = authorIds.length ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const name = new Map(authors.map((a) => [a.id, a.name]));
  return campaigns.map((c) => campaignView(c, name.get(c.createdById) ?? null));
}

export function campaignView(
  c: { id: string; title: string; body: string; audience: Prisma.JsonValue; recipients: number; createdAt: Date; expiresAt: Date | null },
  createdByName: string | null,
): CampaignView {
  const audience = normalizeAudience(c.audience);
  return {
    id: c.id,
    title: c.title,
    body: c.body,
    audience,
    audienceLabel: describeAudience(audience),
    recipients: c.recipients,
    createdAt: c.createdAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() ?? null,
    createdByName,
  };
}

/** Cuántos clientes reciben una campaña: solo tarjetas activas que aceptaron mensajes. */
export async function countRecipients(program: LoyaltyProgramView, audience: CampaignAudience, now = new Date()) {
  const cards = await prisma.loyaltyCard.findMany({
    where: { programId: program.id, status: "ACTIVE", marketingConsent: true },
    select: { balance: true, lifetime: true, lastVisitAt: true, createdAt: true, birthday: true, marketingConsent: true },
  });
  const ctx = { rules: program.rules, minRewardCost: minRewardCost(program.rewards), now };
  return cards.reduce((n, card) => (matchesAudience(audience, card, ctx) ? n + 1 : n), 0);
}
// creado por pato dev y askforvini
