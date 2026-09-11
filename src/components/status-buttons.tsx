"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus, Role } from "@/lib/types";

const ACTIONS: { status: ApplicationStatus; label: string }[] = [
  { status: "applied", label: "Applied" },
  { status: "interviewing", label: "Interviewing" },
  { status: "oa", label: "OA" },
  { status: "skipped", label: "Skip" },
];

export function StatusButtons({
  role,
  onDone,
  onRevert,
}: {
  role: Role;
  onDone?: () => void;
  onRevert?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ApplicationStatus | null>(null);
  const [error, setError] = useState("");

  async function update(status: ApplicationStatus) {
    setPending(status);
    setError("");
    onDone?.();
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role_id: role.id,
          url: role.url,
          company: role.company,
          title: role.title,
          status,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Update failed");
      router.refresh();
    } catch (err) {
      onRevert?.();
      setError(err instanceof Error ? err.message : "Update failed");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={pending !== null}
            onClick={() => update(action.status)}
            className="rounded-full border border-line bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:border-brass hover:text-brass disabled:opacity-60"
          >
            {pending === action.status ? "…" : action.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-rose">{error}</p> : null}
    </div>
  );
}
