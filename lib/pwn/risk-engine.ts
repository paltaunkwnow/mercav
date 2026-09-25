import { isSeverity, type PwnExposureKind, type PwnSeverity } from "./types";

export interface RiskInput {
  severity: string;
  confidence: number;
  kev?: boolean;
  exposureKind?: string;
}

export interface RiskResult {
  score: number;
  level: PwnSeverity;
}

const SEVERITY_BASE: Record<PwnSeverity, number> = {
  INFO: 5,
  LOW: 20,
  MEDIUM: 45,
  HIGH: 70,
  CRITICAL: 90,
};

const EXPOSURE_BONUS: Record<PwnExposureKind, number> = {
  EMAIL: 0,
  DOMAIN: 5,
  ASSET: 5,
  PASSWORD_RANGE: 10,
};

// Known-exploited (CISA KEV) vulnerabilities are confirmed exploitation, not claims.
const KEV_BONUS = 15;
const MIN_CONFIDENCE_FACTOR = 0.4;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function riskLevel(score: number): PwnSeverity {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 15) return "LOW";
  return "INFO";
}

/** Deterministic 0-100 risk score; low confidence dampens severity. */
export function scoreRisk(input: RiskInput): RiskResult {
  const severity: PwnSeverity = isSeverity(input.severity) ? input.severity : "MEDIUM";
  const confidence = clamp(input.confidence, 0, 100) / 100;
  const confidenceFactor = MIN_CONFIDENCE_FACTOR + (1 - MIN_CONFIDENCE_FACTOR) * confidence;

  let raw = SEVERITY_BASE[severity] * confidenceFactor;
  if (input.exposureKind && Object.prototype.hasOwnProperty.call(EXPOSURE_BONUS, input.exposureKind)) {
    raw += EXPOSURE_BONUS[input.exposureKind as PwnExposureKind];
  }
  if (input.kev) raw += KEV_BONUS;

  const score = Math.round(clamp(raw, 0, 100));
  return { score, level: riskLevel(score) };
}
// creado por Patodev y Invertilo
