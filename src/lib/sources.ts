import { passesSourceFilters } from "./filter";
import { roleIdFromUrl } from "./hash";
import { rankRole } from "./rank";
import type { Role } from "./types";
import { normalizeUrl } from "./url";

export const SIMPLIFY_LISTINGS_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json";

export const ZSHAH_JOBS_URL =
  "https://zshah101.github.io/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships/api/jobs.json";

type SimplifyListing = {
  source?: string;
  category?: string;
  company_name?: string;
  id?: string;
  title?: string;
  active?: boolean;
  terms?: string[];
  date_posted?: number;
  url?: string;
  locations?: string[];
  is_visible?: boolean;
  sponsorship?: string;
  degrees?: string[];
};

type ZshahJob = {
  id?: string;
  company?: string;
  title?: string;
  season?: string;
  seasons?: string[] | null;
  category?: string;
  location?: string;
  url?: string;
  posted_at?: string | null;
  skills?: string[];
  source?: string;
  program?: string;
};

function unixToIso(seconds: number | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const ms = seconds > 1e12 ? seconds : seconds * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRole(input: {
  source: string;
  company: string;
  title: string;
  url: string;
  category?: string | null;
  locations?: string[];
  skills?: string[];
  posted_at?: string | null;
  terms?: string | null;
  raw?: unknown;
}): Role | null {
  const url = normalizeUrl(input.url);
  if (!url || !input.company || !input.title) return null;
  const ranked = rankRole({
    title: input.title,
    company: input.company,
    category: input.category,
    posted_at: input.posted_at,
  });
  const now = new Date().toISOString();
  return {
    id: roleIdFromUrl(url),
    source: input.source,
    company: input.company.trim(),
    title: input.title.trim(),
    url,
    category: input.category ?? null,
    locations: input.locations ?? [],
    skills: input.skills ?? [],
    posted_at: input.posted_at ?? null,
    terms: input.terms ?? null,
    raw: input.raw ?? null,
    first_seen_at: now,
    last_seen_at: now,
    fit_tag: ranked.fit_tag,
    rank_score: ranked.rank_score,
  };
}

export function mapSimplifyListings(listings: SimplifyListing[]): Role[] {
  const roles: Role[] = [];
  for (const listing of listings) {
    if (
      !passesSourceFilters(
        {
          company: listing.company_name ?? "",
          title: listing.title ?? "",
          category: listing.category,
          terms: listing.terms,
          active: listing.active,
          is_visible: listing.is_visible,
        },
        { requireActiveVisible: true },
      )
    ) {
      continue;
    }
    const role = toRole({
      source: "simplify",
      company: listing.company_name ?? "",
      title: listing.title ?? "",
      url: listing.url ?? "",
      category: listing.category,
      locations: listing.locations ?? [],
      posted_at: unixToIso(listing.date_posted),
      terms: (listing.terms ?? []).join(", ") || null,
      raw: {
        id: listing.id,
        terms: listing.terms,
        sponsorship: listing.sponsorship,
        degrees: listing.degrees,
      },
    });
    if (role) roles.push(role);
  }
  return roles;
}

export function mapZshahJobs(payload: { jobs?: ZshahJob[] } | ZshahJob[]): Role[] {
  const jobs = Array.isArray(payload) ? payload : (payload.jobs ?? []);
  const roles: Role[] = [];
  for (const job of jobs) {
    if (
      !passesSourceFilters({
        company: job.company ?? "",
        title: job.title ?? "",
        category: job.category,
        season: job.season,
        seasons: job.seasons,
        program: job.program,
      })
    ) {
      continue;
    }
    const role = toRole({
      source: "zshah",
      company: job.company ?? "",
      title: job.title ?? "",
      url: job.url ?? "",
      category: job.category,
      locations: job.location ? [job.location] : [],
      skills: job.skills ?? [],
      posted_at: job.posted_at ?? null,
      terms: job.season ?? (job.seasons ?? []).join(", ") ?? null,
      raw: {
        id: job.id,
        program: job.program,
        source: job.source,
      },
    });
    if (role) roles.push(role);
  }
  return roles;
}

export function dedupeRoles(roles: Role[]): Role[] {
  const byUrl = new Map<string, Role>();
  for (const role of roles) {
    const existing = byUrl.get(role.url);
    if (!existing) {
      byUrl.set(role.url, role);
      continue;
    }
    byUrl.set(role.url, mergeRoles(existing, role));
  }
  return [...byUrl.values()];
}

function mergeRoles(a: Role, b: Role): Role {
  const posted =
    a.posted_at && b.posted_at
      ? Date.parse(a.posted_at) >= Date.parse(b.posted_at)
        ? a.posted_at
        : b.posted_at
      : (a.posted_at ?? b.posted_at);
  const ranked = rankRole({
    title: a.title,
    company: a.company,
    category: a.category ?? b.category,
    posted_at: posted,
  });
  return {
    ...a,
    source: a.source === b.source ? a.source : `${a.source}+${b.source}`,
    category: a.category ?? b.category,
    locations: uniqueStrings([...a.locations, ...b.locations]),
    skills: uniqueStrings([...a.skills, ...b.skills]),
    posted_at: posted,
    terms: a.terms ?? b.terms,
    raw: { simplify: a.source.includes("simplify") ? a.raw : b.raw, zshah: a.source.includes("zshah") ? a.raw : b.raw },
    first_seen_at: a.first_seen_at <= b.first_seen_at ? a.first_seen_at : b.first_seen_at,
    last_seen_at: a.last_seen_at >= b.last_seen_at ? a.last_seen_at : b.last_seen_at,
    fit_tag: ranked.fit_tag,
    rank_score: ranked.rank_score,
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}
