import { authorizeIngestRequest } from "@/lib/ingest-auth";
import { ingestFeeds } from "@/lib/ingest";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
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
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleIngest(request);
}

/** Vercel Cron hits this path with GET. Same auth + ingest as POST. */
export async function GET(request: NextRequest) {
  return handleIngest(request);
}
