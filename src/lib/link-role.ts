import { roleIdFromUrl } from "./hash";
import { normalizeUrl } from "./url";

export type RoleRef = {
  id: string;
  url: string;
};

/**
 * Only return a role_id that already exists in `roles`.
 * Hashing a sheet URL that was never ingested must not invent an FK.
 */
export function resolveApplicationRoleId(
  input: { role_id?: string | null; url: string },
  roles: ReadonlyArray<RoleRef>,
): string | null {
  const url = normalizeUrl(input.url);
  if (!url || roles.length === 0) return null;

  const byUrl = roles.find((role) => role.url === url);
  if (byUrl) return byUrl.id;

  const hashed = roleIdFromUrl(url);
  const byHash = roles.find((role) => role.id === hashed);
  if (byHash) return byHash.id;

  if (input.role_id && roles.some((role) => role.id === input.role_id)) {
    return input.role_id;
  }

  return null;
}
