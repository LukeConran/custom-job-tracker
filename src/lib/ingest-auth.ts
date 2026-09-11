import { timingSafeEqual } from "node:crypto";

function secretsMatch(provided: string | null | undefined, expected: string): boolean {
  if (!provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function authorizeIngestRequest(input: {
  secret?: string | null;
  authorization?: string | null;
  headerSecret?: string | null;
}): boolean {
  const secret = input.secret ?? "";
  if (!secret) return true;

  const bearer = input.authorization?.startsWith("Bearer ")
    ? input.authorization.slice("Bearer ".length)
    : null;

  return secretsMatch(bearer, secret) || secretsMatch(input.headerSecret, secret);
}
