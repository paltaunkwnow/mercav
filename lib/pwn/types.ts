// Mirrors the Pwn* enums in prisma/schema.prisma. Keep both in sync.

export const PWN_VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "PARTIALLY_CORROBORATED",
  "CORROBORATED",
  "CONFIRMED",
  "DISPUTED",
] as const;
export type PwnVerificationStatus = (typeof PWN_VERIFICATION_STATUSES)[number];

export const PWN_SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type PwnSeverity = (typeof PWN_SEVERITIES)[number];

export const PWN_TARGET_TYPES = ["EMAIL", "DOMAIN", "IP", "CVE"] as const;
export type PwnTargetType = (typeof PWN_TARGET_TYPES)[number];

export const PWN_EXPOSURE_KINDS = ["EMAIL", "DOMAIN", "PASSWORD_RANGE", "ASSET"] as const;
export type PwnExposureKind = (typeof PWN_EXPOSURE_KINDS)[number];

export type PwnConfidenceLabel = "Low" | "Medium" | "High";

export function isVerificationStatus(value: unknown): value is PwnVerificationStatus {
  return typeof value === "string" && (PWN_VERIFICATION_STATUSES as readonly string[]).includes(value);
}

export function isSeverity(value: unknown): value is PwnSeverity {
  return typeof value === "string" && (PWN_SEVERITIES as readonly string[]).includes(value);
}

export function isTargetType(value: unknown): value is PwnTargetType {
  return typeof value === "string" && (PWN_TARGET_TYPES as readonly string[]).includes(value);
}

export function isExposureKind(value: unknown): value is PwnExposureKind {
  return typeof value === "string" && (PWN_EXPOSURE_KINDS as readonly string[]).includes(value);
}
// creado por pato dev y askforvini
