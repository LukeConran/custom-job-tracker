export const APPLICATION_STATUSES = [
  "applied",
  "interviewing",
  "oa",
  "offer",
  "rejected",
  "skipped",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const FIT_TAGS = ["cv", "ml_ds", "ai_swe", "other"] as const;
export type FitTag = (typeof FIT_TAGS)[number];

export type Role = {
  id: string;
  source: string;
  company: string;
  title: string;
  url: string;
  category: string | null;
  locations: string[];
  skills: string[];
  posted_at: string | null;
  terms: string | null;
  raw: unknown;
  first_seen_at: string;
  last_seen_at: string;
  fit_tag: FitTag | null;
  rank_score: number | null;
};

export type Application = {
  id: string;
  role_id: string | null;
  url: string;
  company: string | null;
  title: string | null;
  status: ApplicationStatus;
  notes: string;
  applied_at: string | null;
  updated_at: string;
};

export type ApplicationInput = {
  id?: string;
  role_id?: string | null;
  url: string;
  company?: string | null;
  title?: string | null;
  status: ApplicationStatus;
  notes?: string;
  applied_at?: string | null;
};

export type IngestResult = {
  fetched: Record<string, number>;
  kept: number;
  upserted: number;
  errors: string[];
  backend: "supabase" | "local";
  lastIngestAt: string;
};
