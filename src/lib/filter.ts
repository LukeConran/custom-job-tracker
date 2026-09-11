export const EXCLUDED_COMPANY_PATTERNS: RegExp[] = [
  /lockheed(\s+martin)?/i,
  /\bsandia\b/i,
  /los\s+alamos/i,
  /idaho\s+national/i,
  /\bcia\b|central\s+intelligence\s+agency/i,
  /\bdia\b|defense\s+intelligence\s+agency/i,
];

const ML_CATEGORY_RE =
  /\b(ai|ml|machine\s*learning|data(\s|&|\/|-)*scien|data\s*&\s*ml|computer\s*vision|cv)\b/i;

const TITLE_KEYWORD_RE =
  /machine[\s-]*learning|\bml\b|data[\s-]*scien|data[\s-]*analyst|data[\s-]*analytics|computer[\s-]*vision|\bcv\b|deep[\s-]*learning|artificial[\s-]*intelligence|\bai\b|\bllm\b|\bnlp\b|perception|applied\s+scientist|research\s+scientist|gen(?:erative)?[\s-]*ai|mlops|vision[\s-]*language/i;

const SUMMER_2027_RE = /summer\s*2027/i;
const SPRING_2027_RE = /spring\s*2027/i;

export type FilterableListing = {
  company: string;
  title: string;
  category?: string | null;
  terms?: string[] | string | null;
  season?: string | null;
  seasons?: string[] | null;
  program?: string | null;
  active?: boolean | null;
  is_visible?: boolean | null;
  degrees?: string[] | null;
};

export function isExcludedCompany(company: string): boolean {
  const name = company.trim();
  if (!name) return false;
  return EXCLUDED_COMPANY_PATTERNS.some((re) => re.test(name));
}

export function mentionsSummer2027(listing: FilterableListing): boolean {
  const blobs = collectTermBlobs(listing);
  return blobs.some((blob) => SUMMER_2027_RE.test(blob));
}

export function isSpring2027Coop(listing: FilterableListing): boolean {
  const blobs = collectTermBlobs(listing);
  const hasSummer = blobs.some((blob) => SUMMER_2027_RE.test(blob));
  if (hasSummer) return false;

  const hasSpring = blobs.some((blob) => SPRING_2027_RE.test(blob));
  if (!hasSpring) return false;

  const program = `${listing.program ?? ""} ${listing.title}`.toLowerCase();
  return /co-?op/.test(program) || hasSpring;
}

export function isSummer2027Only(listing: FilterableListing): boolean {
  return mentionsSummer2027(listing) && !isSpring2027Coop(listing);
}

export function isMlDsAiCv(listing: FilterableListing): boolean {
  if (listing.category && ML_CATEGORY_RE.test(listing.category)) return true;
  return TITLE_KEYWORD_RE.test(listing.title);
}

export function passesSourceFilters(
  listing: FilterableListing,
  options: { requireActiveVisible?: boolean } = {},
): boolean {
  if (options.requireActiveVisible) {
    if (listing.active !== true) return false;
    if (listing.is_visible === false) return false;
  }
  if (isExcludedCompany(listing.company)) return false;
  if (!isSummer2027Only(listing)) return false;
  if (!isMlDsAiCv(listing)) return false;
  if (isPhdOnly(listing)) return false;
  return true;
}

function normalizeDegreeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

type DegreeKind = "bachelors" | "masters" | "phd" | "other";

function degreeKind(token: string): DegreeKind {
  const t = normalizeDegreeToken(token);
  if (!t) return "other";
  if (/post[\s-]*doc/.test(t) || /\bph\s*d\b/.test(t) || t === "phd" || /doctor(ate|al)?/.test(t)) {
    return "phd";
  }
  if (/master/.test(t) || t === "ms" || t === "msc" || t === "ma" || t === "meng") return "masters";
  if (/bachelor/.test(t) || t === "bs" || t === "ba" || t === "bsc" || /undergrad/.test(t)) {
    return "bachelors";
  }
  return "other";
}

export function mentionsMixedDegreeTrack(title: string): boolean {
  const t = title.replace(/[’']/g, "'");
  if (/\bbs\s*\/\s*ms\s*\/\s*ph\.?\s*d/i.test(t)) return true;
  if (/\bms\s*\/\s*ph\.?\s*d/i.test(t) || /\bph\.?\s*d\s*\/\s*ms\b/i.test(t)) return true;
  if (/\b(b\.?\s*s\.?|ba|bachelor['s]*)\b.{0,24}\b(m\.?\s*s\.?|master['s]*)\b.{0,24}\b(ph\.?\s*d|phd)\b/i.test(t)) {
    return true;
  }
  if (
    /\b(m\.?\s*s\.?|masters?'?|msc)\b\s*[/|&,]+\s*(ph\.?\s*d|phd)\b/i.test(t) ||
    /\b(m\.?\s*s\.?|masters?'?|msc)\b\s+or\s+(ph\.?\s*d|phd)\b/i.test(t)
  ) {
    return true;
  }
  if (
    /\b(ph\.?\s*d|phd)\b\s*[/|&,]+\s*(m\.?\s*s\.?|masters?'?|msc)\b/i.test(t) ||
    /\b(ph\.?\s*d|phd)\b\s+or\s+(m\.?\s*s\.?|masters?'?|msc)\b/i.test(t)
  ) {
    return true;
  }
  if (
    /\b(b\.?\s*s\.?|bachelor['s]*)\b\s*[/|&,]+\s*(ph\.?\s*d|phd)\b/i.test(t) ||
    /\b(b\.?\s*s\.?|bachelor['s]*)\b\s+or\s+(ph\.?\s*d|phd)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

function titleImpliesPhdOnly(title: string): boolean {
  if (!title.trim()) return false;
  if (mentionsMixedDegreeTrack(title)) return false;
  if (/\bpost[\s-]*doc(toral)?\b/i.test(title)) return true;
  return /\b(ph\.?\s*d\.?|phd|doctoral|doctorate)\b/i.test(title);
}

/** True when the listing is PhD-only / postdoc — not BS, MS, MS/PhD, or BS/MS/PhD. */
export function isPhdOnly(listing: Pick<FilterableListing, "title" | "degrees">): boolean {
  const kinds = (listing.degrees ?? []).map(degreeKind).filter((kind) => kind !== "other");
  if (kinds.length > 0) {
    const allowsBsMs = kinds.some((kind) => kind === "bachelors" || kind === "masters");
    if (allowsBsMs) return false;
    return kinds.every((kind) => kind === "phd");
  }
  return titleImpliesPhdOnly(listing.title);
}

function collectTermBlobs(listing: FilterableListing): string[] {
  const blobs: string[] = [];
  if (listing.season) blobs.push(listing.season);
  if (Array.isArray(listing.seasons)) blobs.push(...listing.seasons);
  if (typeof listing.terms === "string") blobs.push(listing.terms);
  if (Array.isArray(listing.terms)) blobs.push(...listing.terms);
  blobs.push(listing.title);
  return blobs.filter(Boolean);
}
