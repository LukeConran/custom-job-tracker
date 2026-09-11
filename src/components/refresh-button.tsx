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
      const response = await fetch("/api/ingest", {
        method: "POST",
        signal: AbortSignal.timeout(90_000),
      });
      const raw = await response.text();
      let payload: {
        kept?: number;
        upserted?: number;
        errors?: string[];
        error?: string;
        fetched?: Record<string, number>;
      };
      try {
        payload = JSON.parse(raw) as typeof payload;
      } catch {
        throw new Error(
          `Refresh failed (${response.status}): ${raw.slice(0, 180).replace(/\s+/g, " ") || "empty response"}`,
        );
      }
      if (!response.ok) {
        throw new Error(payload.error ?? `Refresh failed (${response.status})`);
      }
      const extra = payload.errors?.length ? ` — ${payload.errors.join("; ")}` : "";
      setDetail(`Indexed ${payload.kept ?? payload.upserted ?? 0} Summer 2027 roles${extra}`);
      setState("done");
      router.refresh();
    } catch (error) {
      setState("error");
      if (error instanceof DOMException && error.name === "TimeoutError") {
        setDetail("Refresh timed out after 90s. Try again — Simplify’s listings file is large.");
        return;
      }
      const message = error instanceof Error ? error.message : "Ingest failed";
      setDetail(message === "Failed to fetch" || message === "fetch failed" ? "Could not reach ingest. Check the network and try again." : message);
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
        <p className={`max-w-sm text-right text-xs ${state === "error" ? "text-rose" : "text-paper-dim"}`}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}
