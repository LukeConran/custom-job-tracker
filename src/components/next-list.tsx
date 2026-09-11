"use client";

import { useMemo, useState } from "react";
import { FilterChip } from "@/components/filter-chip";
import { SearchField } from "@/components/search-field";
import { formatLocations, formatRelative } from "@/lib/format";
import { keywordChips } from "@/lib/keywords";
import { filterNextRoles } from "@/lib/search";
import { FIT_LABELS } from "@/lib/status";
import { FIT_TAGS } from "@/lib/types";
import type { FitTag, Role } from "@/lib/types";
import { StatusButtons } from "./status-buttons";

const FIT_TONE: Record<string, string> = {
  cv: "bg-moss/15 text-moss",
  ml_ds: "bg-brass/15 text-brass",
  ai_swe: "bg-sky/15 text-sky",
  other: "bg-line text-paper-dim",
};

const PREVIEW = 40;

export function NextList({ roles }: { roles: Role[] }) {
  const [query, setQuery] = useState("");
  const [fitTag, setFitTag] = useState<FitTag | "all">("all");

  const filtered = useMemo(() => filterNextRoles(roles, { query, fitTag }), [fitTag, query, roles]);
  const narrowing = Boolean(query.trim()) || fitTag !== "all";
  const visible = narrowing ? filtered : filtered.slice(0, PREVIEW);

  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-ink-soft px-6 py-12 text-center">
        <p className="font-serif text-2xl text-paper">The queue is clear.</p>
        <p className="mt-2 text-sm text-paper-dim">
          Refresh jobs to ingest Summer 2027 ML/DS/AI/CV listings, or open Applications
          to change a status.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          label="Search next to apply"
          placeholder="Search company or title"
          value={query}
          onChange={setQuery}
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={fitTag === "all"} onClick={() => setFitTag("all")} label="All" />
          {FIT_TAGS.map((tag) => (
            <FilterChip
              key={tag}
              active={fitTag === tag}
              onClick={() => setFitTag(tag)}
              label={FIT_LABELS[tag]}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ink-soft px-6 py-10 text-center text-sm text-paper-dim">
          No ranked roles match this search.
        </div>
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-ink-soft/90">
          {visible.map((role, index) => (
            <QueueRow key={role.id} role={role} index={index} />
          ))}
        </ol>
      )}
      {!narrowing && roles.length > visible.length ? (
        <p className="text-center text-xs text-paper-dim">
          Showing the top {visible.length} of {roles.length} ranked roles. Mark or skip
          these to advance the queue.
        </p>
      ) : narrowing ? (
        <p className="text-center text-xs text-paper-dim">
          {filtered.length} match{filtered.length === 1 ? "" : "es"} · ranking order kept
        </p>
      ) : null}
    </div>
  );
}

function QueueRow({ role, index }: { role: Role; index: number }) {
  const chips = keywordChips(role);

  return (
    <li className="px-3 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="w-6 shrink-0 font-serif text-sm text-brass">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="truncate font-medium text-paper">{role.company}</h3>
            <p className="truncate text-sm text-paper-dim">{role.title}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-8 text-[11px] text-paper-dim">
            <span
              className={`rounded-full px-1.5 py-px uppercase tracking-[0.12em] ${FIT_TONE[role.fit_tag ?? "other"]}`}
            >
              {role.fit_tag ? FIT_LABELS[role.fit_tag] : "Role"}
            </span>
            <span>{role.source}</span>
            {role.rank_score != null ? <span>score {role.rank_score}</span> : null}
            <span>
              {formatLocations(role.locations)} · {formatRelative(role.posted_at)}
              {role.terms ? ` · ${role.terms}` : ""}
            </span>
            <a
              href={role.url}
              target="_blank"
              rel="noreferrer"
              className="text-brass underline-offset-2 hover:underline"
            >
              Open
            </a>
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-sm border border-line/80 px-1.5 py-px text-[10px] text-paper-dim/90"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <StatusButtons role={role} />
      </div>
    </li>
  );
}
