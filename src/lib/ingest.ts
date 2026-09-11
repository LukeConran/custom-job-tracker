import "server-only";
import {
  SIMPLIFY_LISTINGS_URL,
  ZSHAH_JOBS_URL,
  dedupeRoles,
  mapSimplifyListings,
  mapZshahJobs,
} from "./sources";
import { currentBackend, lastIngestAt, upsertRoles } from "./store";
import type { IngestResult, Role } from "./types";

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "user-agent": "application-scout/0.1 (personal internship tracker)" },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

export async function ingestFeeds(): Promise<IngestResult> {
  const fetched: Record<string, number> = {};
  const errors: string[] = [];
  const batches: Role[][] = [];

  const [simplifyResult, zshahResult] = await Promise.allSettled([
    fetchJson(SIMPLIFY_LISTINGS_URL),
    fetchJson(ZSHAH_JOBS_URL),
  ]);

  if (simplifyResult.status === "fulfilled") {
    const listings = Array.isArray(simplifyResult.value) ? simplifyResult.value : [];
    fetched.simplify = listings.length;
    batches.push(mapSimplifyListings(listings));
  } else {
    fetched.simplify = 0;
    errors.push(`simplify: ${simplifyResult.reason instanceof Error ? simplifyResult.reason.message : "failed"}`);
  }

  if (zshahResult.status === "fulfilled") {
    const payload = zshahResult.value as { jobs?: unknown[] } | unknown[];
    fetched.zshah = Array.isArray(payload) ? payload.length : (payload.jobs?.length ?? 0);
    batches.push(mapZshahJobs(payload as { jobs?: never[] }));
  } else {
    fetched.zshah = 0;
    errors.push(`zshah: ${zshahResult.reason instanceof Error ? zshahResult.reason.message : "failed"}`);
  }

  const keptRoles = dedupeRoles(batches.flat());
  const upserted = await upsertRoles(keptRoles);
  return {
    fetched,
    kept: keptRoles.length,
    upserted,
    errors,
    backend: currentBackend(),
    lastIngestAt: (await lastIngestAt()) ?? new Date().toISOString(),
  };
}
