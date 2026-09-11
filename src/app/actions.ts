"use server";

import { isApplicationStatus } from "@/lib/status";
import { updateApplication, upsertApplication } from "@/lib/store";
import { revalidatePath } from "next/cache";

function refreshPages() {
  revalidatePath("/");
  revalidatePath("/applications");
}

export async function trackApplication(formData: FormData) {
  const url = String(formData.get("url") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!url || !isApplicationStatus(status)) {
    throw new Error("A job URL and valid status are required.");
  }
  await upsertApplication({
    url,
    status,
    role_id: String(formData.get("role_id") ?? "") || null,
    company: String(formData.get("company") ?? "") || null,
    title: String(formData.get("title") ?? "") || null,
  });
  refreshPages();
}

export async function changeApplicationStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isApplicationStatus(status)) {
    throw new Error("Application id and valid status are required.");
  }
  await updateApplication(id, { status });
  refreshPages();
}
