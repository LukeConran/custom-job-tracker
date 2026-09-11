import type { FitTag } from "./types";

export type RankableRole = {
  title: string;
  company: string;
  category?: string | null;
  posted_at?: string | null;
};

const CV_RE =
  /computer[\s-]*vision|\bcv\b|perception|visual(?:\s+computing|\s+learning)?|image[\s-]+(?:recogni|understand|segment)|vision[\s-]*language|opencv/i;

const ML_DS_RE =
  /machine[\s-]*learning|\bml\b|data[\s-]*scien|data[\s-]*analyst|data[\s-]*analytics|deep[\s-]*learning|applied\s+scientist|research\s+scientist|mlops|statistic/i;

const AI_SWE_RE =
  /\bai\b|artificial[\s-]*intelligence|llm|gen(?:erative)?\s*ai|nlp|language\s+model/i;

const BIG_NAME_RE =
  /\b(openai|anthropic|google|deepmind|meta|facebook|nvidia|apple|tesla|microsoft|amazon|netflix|stripe|databricks|scale\s*ai|anduril|figure\s*ai|physical\s+intelligence|xai|waymo|hugging\s*face|palantir|snowflake|uber|airbnb)\b/i;

export function classifyFit(role: RankableRole): FitTag {
  const haystack = `${role.title} ${role.category ?? ""}`;
  if (CV_RE.test(haystack)) return "cv";
  if (ML_DS_RE.test(haystack)) return "ml_ds";
  if (AI_SWE_RE.test(haystack)) return "ai_swe";
  if (role.category && /ai|ml|data|vision/i.test(role.category)) return "ml_ds";
  return "other";
}

export function freshnessScore(postedAt: string | null | undefined): number {
  if (!postedAt) return 2;
  const posted = Date.parse(postedAt);
  if (Number.isNaN(posted)) return 2;
  const days = (Date.now() - posted) / 86_400_000;
  if (days < 0) return 40;
  if (days <= 2) return 40;
  if (days <= 7) return 28;
  if (days <= 14) return 18;
  if (days <= 30) return 10;
  if (days <= 60) return 4;
  return 2;
}

export function fitScore(tag: FitTag): number {
  switch (tag) {
    case "cv":
      return 50;
    case "ml_ds":
      return 35;
    case "ai_swe":
      return 20;
    default:
      return 8;
  }
}

export function brandBoost(company: string): number {
  return BIG_NAME_RE.test(company) ? 8 : 0;
}

export function rankRole(role: RankableRole): { fit_tag: FitTag; rank_score: number } {
  const fit_tag = classifyFit(role);
  const rank_score =
    freshnessScore(role.posted_at) + fitScore(fit_tag) + brandBoost(role.company);
  return { fit_tag, rank_score };
}

export function compareRanked<T extends { rank_score: number | null; posted_at?: string | null }>(
  a: T,
  b: T,
): number {
  const scoreDelta = (b.rank_score ?? 0) - (a.rank_score ?? 0);
  if (scoreDelta !== 0) return scoreDelta;
  const aPosted = a.posted_at ? Date.parse(a.posted_at) : 0;
  const bPosted = b.posted_at ? Date.parse(b.posted_at) : 0;
  return bPosted - aPosted;
}
