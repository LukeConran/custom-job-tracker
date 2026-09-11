"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CsvImport() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [detail, setDetail] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setState("loading");
    setDetail("Importing sheet…");
    try {
      const csv = await file.text();
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "text/csv" },
        body: csv,
      });
      const payload = (await response.json()) as { imported?: number; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Import failed");
      setState("done");
      setDetail(`Imported ${payload.imported ?? 0} rows`);
      router.refresh();
    } catch (error) {
      setState("error");
      setDetail(error instanceof Error ? error.message : "Import failed");
    }
  }

  return (
    <label className="inline-flex cursor-pointer flex-col items-end gap-1">
      <span className="rounded-full border border-line px-4 py-2 text-sm text-paper hover:border-brass hover:text-brass">
        {state === "loading" ? "Importing…" : "Import CSV"}
      </span>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {detail ? (
        <span className={`text-xs ${state === "error" ? "text-rose" : "text-paper-dim"}`}>
          {detail}
        </span>
      ) : (
        <span className="text-xs text-paper-dim">
          Company, Role, Type, Location, Date Applied, Status, Contact, Pay/Hr, Link
        </span>
      )}
    </label>
  );
}
