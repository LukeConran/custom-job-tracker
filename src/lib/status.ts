import type { ApplicationStatus, FitTag } from "./types";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  oa: "OA",
  offer: "Offer",
  rejected: "Rejected",
  skipped: "Skipped",
};

export const FIT_LABELS: Record<FitTag, string> = {
  cv: "CV",
  ml_ds: "ML/DS",
  ai_swe: "AI-SWE",
  other: "Other",
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return value in STATUS_LABELS;
}
