import "server-only";
import {
  SIMPLIFY_LISTINGS_URL,
  ZSHAH_JOBS_URL,
  dedupeRoles,
  mapSimplifyListings,
  mapZshahJobs,
} from "./sources";
import { fetchJsonFeed } from "./fetch-feed";
import { describeNetworkError } from "./net-error";
import { currentBackend, lastIngestAt, upsertRoles } from "./store";
import type { IngestResult, Role } from "./types";

async function fetchJson(url: string, label: string): Promise<unknown> {
  try {
    return await fetchJsonFeed(url);
  } catch (error) {
    throw new Error(`${label}: ${describeNetworkError(error)}`);
  }
}

export async function ingestFeeds(): Promise<IngestResult> {
  const fetched: Record<string, number> = {};
  const errors: string[] = [];
  const batches: Role[][] = [];

  const [simplifyResult, zshahResult] = await Promise.allSettled([
    fetchJson(SIMPLIFY_LISTINGS_URL, "simplify"),
    fetchJson(ZSHAH_JOBS_URL, "zshah"),
  ]);

  if (simplifyResult.status === "fulfilled") {
    const listings = Array.isArray(simplifyResult.value) ? simplifyResult.value : [];
    fetched.simplify = listings.length;
    batches.push(mapSimplifyListings(listings));
  } else {
    fetched.simplify = 0;
    errors.push(
      simplifyResult.reason instanceof Error ? simplifyResult.reason.message : "simplify: failed",
    );
  }

  if (zshahResult.status === "fulfilled") {
    const payload = zshahResult.value as { jobs?: unknown[] } | unknown[];
    fetched.zshah = Array.isArray(payload) ? payload.length : (payload.jobs?.length ?? 0);
    batches.push(mapZshahJobs(payload as { jobs?: never[] }));
  } else {
    fetched.zshah = 0;
    errors.push(zshahResult.reason instanceof Error ? zshahResult.reason.message : "zshah: failed");
  }

  const keptRoles = dedupeRoles(batches.flat());
  let upserted = 0;
  try {
    upserted = await upsertRoles(keptRoles);
  } catch (error) {
    errors.push(`store: ${describeNetworkError(error)}`);
    if (keptRoles.length > 0) {
      throw new Error(errors.join("; "));
    }
  }

  return {
    fetched,
    kept: keptRoles.length,
    upserted,
    errors,
    backend: currentBackend(),
    lastIngestAt: (await lastIngestAt()) ?? new Date().toISOString(),
  };
}
