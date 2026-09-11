import { applicationsFromCsv } from "@/lib/csv";
import { isApplicationStatus } from "@/lib/status";
import { listApplications, updateApplication, upsertApplication } from "@/lib/store";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function refreshPages() {
  revalidatePath("/");
  revalidatePath("/applications");
}

export async function GET() {
  try {
    const applications = await listApplications();
    return Response.json({ applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load applications";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("text/csv")) {
      const csv = await request.text();
      const rows = applicationsFromCsv(csv);
      const applications = [];
      for (const row of rows) {
        applications.push(await upsertApplication(row));
      }
      refreshPages();
      return Response.json({ applications, imported: applications.length });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.csv === "string") {
      const rows = applicationsFromCsv(body.csv);
      const applications = [];
      for (const row of rows) {
        applications.push(await upsertApplication(row));
      }
      refreshPages();
      return Response.json({ applications, imported: applications.length });
    }

    if (typeof body.url !== "string" || typeof body.status !== "string") {
      return Response.json({ error: "url and status are required" }, { status: 400 });
    }
    if (!isApplicationStatus(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await upsertApplication({
      url: body.url,
      status: body.status,
      role_id: typeof body.role_id === "string" ? body.role_id : null,
      company: typeof body.company === "string" ? body.company : null,
      title: typeof body.title === "string" ? body.title : null,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      applied_at: typeof body.applied_at === "string" ? body.applied_at : undefined,
    });
    refreshPages();
    return Response.json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save application";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.status === "string" && !isApplicationStatus(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    if (typeof body.id === "string") {
      const application = await updateApplication(body.id, {
        status: typeof body.status === "string" && isApplicationStatus(body.status)
          ? body.status
          : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      refreshPages();
      return Response.json({ application });
    }

    if (typeof body.url === "string" && typeof body.status === "string" && isApplicationStatus(body.status)) {
      const application = await upsertApplication({
        url: body.url,
        status: body.status,
        role_id: typeof body.role_id === "string" ? body.role_id : null,
        company: typeof body.company === "string" ? body.company : null,
        title: typeof body.title === "string" ? body.title : null,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      refreshPages();
      return Response.json({ application });
    }

    return Response.json({ error: "id or url is required" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update application";
    return Response.json({ error: message }, { status: 500 });
  }
}
