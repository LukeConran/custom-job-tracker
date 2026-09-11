"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [detail, setDetail] = useState("");

  async function refresh() {
    setState("loading");
    setDetail("Fetching public internship feeds…");
    try {
      const response = await fetch("/api/ingest", { method: "POST" });
      const payload = (await response.json()) as {
        kept?: number;
        upserted?: number;
        errors?: string[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Ingest failed");
      }
      const extra = payload.errors?.length ? ` (${payload.errors.join("; ")})` : "";
      setDetail(`Indexed ${payload.kept ?? payload.upserted ?? 0} Summer 2027 roles${extra}`);
      setState("done");
      router.refresh();
    } catch (error) {
      setState("error");
      setDetail(error instanceof Error ? error.message : "Ingest failed");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={refresh}
        disabled={state === "loading"}
        className="rounded-full bg-brass px-4 py-2 text-sm font-semibold text-ink hover:bg-brass-deep disabled:cursor-wait disabled:opacity-70"
      >
        {state === "loading" ? "Refreshing…" : "Refresh jobs"}
      </button>
      {detail ? (
        <p className={`max-w-xs text-right text-xs ${state === "error" ? "text-rose" : "text-paper-dim"}`}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}
