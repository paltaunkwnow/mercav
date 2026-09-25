import { isVerificationStatus, type PwnConfidenceLabel, type PwnVerificationStatus } from "./types";

export interface ConfidenceInput {
  sourceReliability: number;
  verificationStatus: string;
  corroboratingSources: number;
}

export interface ConfidenceResult {
  score: number;
  label: PwnConfidenceLabel;
}

// The cap per status is what keeps a loud but unverified claim in "Low":
// no amount of source reliability or repetition lifts it past its cap.
const STATUS_MODEL: Record<PwnVerificationStatus, { base: number; cap: number }> = {
  DISPUTED: { base: 5, cap: 20 },
  UNVERIFIED: { base: 10, cap: 30 },
  PARTIALLY_CORROBORATED: { base: 35, cap: 60 },
  CORROBORATED: { base: 60, cap: 85 },
  CONFIRMED: { base: 80, cap: 100 },
};

const RELIABILITY_WEIGHT = 0.2;
const POINTS_PER_CORROBORATION = 5;
const MAX_COUNTED_CORROBORATIONS = 4;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function confidenceLabel(score: number): PwnConfidenceLabel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

/** Event confidence (0-100), deliberately separate from source reliability. */
export function scoreConfidence(input: ConfidenceInput): ConfidenceResult {
  const status: PwnVerificationStatus = isVerificationStatus(input.verificationStatus)
    ? input.verificationStatus
    : "UNVERIFIED";
  const { base, cap } = STATUS_MODEL[status];

  const reliability = clamp(input.sourceReliability, 0, 100);
  const corroborations = Math.floor(clamp(input.corroboratingSources, 0, MAX_COUNTED_CORROBORATIONS));

  const raw = base + reliability * RELIABILITY_WEIGHT + corroborations * POINTS_PER_CORROBORATION;
  const score = Math.round(clamp(raw, 0, cap));
  return { score, label: confidenceLabel(score) };
}
// creado por Patodev y Invertilo
