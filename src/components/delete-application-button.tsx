"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DELETE_CONFIRM_WORD, isDeleteConfirmed } from "@/lib/application-delete";
import type { Application } from "@/lib/types";

export function DeleteApplicationButton({ application }: { application: Application }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const label = application.company || application.title || "this application";

  async function onConfirm() {
    if (!isDeleteConfirmed(typed)) {
      setError(`Type ${DELETE_CONFIRM_WORD} to confirm.`);
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/applications", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: application.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Delete failed");
      setOpen(false);
      setTyped("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-paper-dim underline-offset-2 hover:text-rose hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="min-w-[11rem] space-y-1.5 rounded-md border border-rose/40 bg-ink px-2 py-1.5">
      <p className="text-[10px] leading-4 text-paper-dim">
        Remove <span className="text-paper">{label}</span> from Applications only. The ingested
        listing can return to Next to apply. Type{" "}
        <span className="font-semibold text-rose">{DELETE_CONFIRM_WORD}</span>.
      </p>
      <input
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        placeholder={DELETE_CONFIRM_WORD}
        className="w-full rounded border border-line bg-ink-soft px-1.5 py-0.5 text-[11px] text-paper"
        autoFocus
      />
      {error ? <p className="text-[10px] text-rose">{error}</p> : null}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={pending || !isDeleteConfirmed(typed)}
          className="rounded bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink disabled:opacity-50"
        >
          {pending ? "Removing…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError("");
          }}
          className="rounded px-2 py-0.5 text-[11px] text-paper-dim hover:text-paper"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
