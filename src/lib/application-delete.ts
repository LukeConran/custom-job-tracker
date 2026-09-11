export function parseDeleteApplicationId(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new Error("Application id is required.");
  }
  const id = (body as { id?: unknown }).id;
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Application id is required.");
  }
  return id.trim();
}

export function removeApplicationById<T extends { id: string }>(rows: T[], id: string): T[] {
  const next = rows.filter((row) => row.id !== id);
  if (next.length === rows.length) {
    throw new Error("Application not found.");
  }
  return next;
}

export const DELETE_CONFIRM_WORD = "delete";

export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim().toLowerCase() === DELETE_CONFIRM_WORD;
}
