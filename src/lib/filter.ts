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
  return true;
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
