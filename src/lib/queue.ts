import type { Application, Role } from "./types";
import { compareRanked } from "./rank";

export function nextRoles(roles: Role[], applications: Application[]): Role[] {
  const hiddenIds = new Set(
    applications.map((app) => app.role_id).filter((id): id is string => Boolean(id)),
  );
  const hiddenUrls = new Set(applications.map((app) => app.url));
  return roles
    .filter((role) => !hiddenIds.has(role.id) && !hiddenUrls.has(role.url))
    .sort(compareRanked);
}
