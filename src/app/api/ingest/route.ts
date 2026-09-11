import { authorizeIngestRequest } from "@/lib/ingest-auth";
import { ingestFeeds } from "@/lib/ingest";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  return authorizeIngestRequest({
    secret: process.env.INGEST_SECRET,
    authorization: request.headers.get("authorization"),
    headerSecret: request.headers.get("x-ingest-secret"),
  });
}

async function handleIngest(request: NextRequest) {
  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await ingestFeeds();
    const totalFetched = Object.values(result.fetched).reduce((sum, n) => sum + n, 0);
    if (result.kept === 0 && result.errors.length > 0 && totalFetched === 0) {
      return Response.json(
        { error: result.errors.join("; "), ...result },
        { status: 502 },
      );
    }
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ingest failed";
    const cause =
      error instanceof Error && error.cause instanceof Error ? ` (${error.cause.message})` : "";
    return Response.json({ error: `${message}${cause}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleIngest(request);
}

/** Vercel Cron hits this path with GET. Same auth + ingest as POST. */
export async function GET(request: NextRequest) {
  return handleIngest(request);
}
