import { ingestFeeds } from "@/lib/ingest";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return true;
  const bearer = request.headers.get("authorization");
  const header = request.headers.get("x-ingest-secret");
  return header === secret || bearer === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
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
