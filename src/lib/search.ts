import type { Application, ApplicationStatus, FitTag, Role } from "./types";

export const ACTIVE_PIPELINE_STATUSES: ApplicationStatus[] = [
  "applied",
  "interviewing",
  "oa",
  "offer",
];

export type NextRoleFilters = {
  query?: string;
  fitTag?: FitTag | "all" | null;
};

export type ApplicationFilters = {
  query?: string;
  status?: ApplicationStatus | "all" | null;
};

export function normalizeSearch(query: string | null | undefined): string {
  return (query ?? "").trim().toLowerCase();
}

export function matchesQuery(
  query: string | null | undefined,
  ...fields: Array<string | null | undefined>
): boolean {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return fields.some((field) => (field ?? "").toLowerCase().includes(needle));
}

/** Preserve input order; only hide rows that fail the query / fit chip. */
export function filterNextRoles(roles: Role[], filters: NextRoleFilters = {}): Role[] {
  const fit = filters.fitTag && filters.fitTag !== "all" ? filters.fitTag : null;
  return roles.filter((role) => {
    if (fit && role.fit_tag !== fit) return false;
    return matchesQuery(filters.query, role.company, role.title);
  });
}

export function filterApplications(
  applications: Application[],
  filters: ApplicationFilters = {},
): Application[] {
  const status = filters.status && filters.status !== "all" ? filters.status : null;
  return applications.filter((app) => {
    if (status) {
      if (app.status !== status) return false;
    } else if (!ACTIVE_PIPELINE_STATUSES.includes(app.status)) {
      return false;
    }
    return matchesQuery(filters.query, app.company, app.title, app.url, app.notes);
  });
}

export function countActivePipeline(applications: Application[]): number {
  return applications.filter((app) => ACTIVE_PIPELINE_STATUSES.includes(app.status)).length;
}

export function countByStatus(
  applications: Application[],
  status: ApplicationStatus,
): number {
  return applications.filter((app) => app.status === status).length;
}
