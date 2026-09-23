import { prisma } from "@/lib/prisma";

export async function ensureSource(input: {
  name: "HIBP" | "NVD" | "CISA_KEV";
  sourceType: string;
  historicalReliability: number;
  verificationMethod: string;
}) {
  return prisma.pwnSource.upsert({
    where: { name: input.name },
    update: {
      sourceType: input.sourceType,
      historicalReliability: input.historicalReliability,
      verificationMethod: input.verificationMethod,
      enabled: true,
      lastEvaluatedAt: new Date(),
    },
    create: {
      ...input,
      enabled: true,
      lastEvaluatedAt: new Date(),
    },
  });
}

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await prisma.pwnAuditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function severityFromCvss(score: number | null): "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score === null) return "MEDIUM";
  if (score >= 9) return "CRITICAL";
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MEDIUM";
  if (score > 0) return "LOW";
  return "INFO";
}
