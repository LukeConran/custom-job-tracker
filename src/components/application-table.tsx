"use client";

import { useMemo, useState } from "react";
import { FilterChip } from "@/components/filter-chip";
import { SearchField } from "@/components/search-field";
import { StatusSelect } from "@/components/status-select";
import { formatRelative } from "@/lib/format";
import { countByStatus, filterApplications } from "@/lib/search";
import { STATUS_LABELS } from "@/lib/status";
import { APPLICATION_STATUSES } from "@/lib/types";
import type { Application, ApplicationStatus } from "@/lib/types";

export function ApplicationTable({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [query, setQuery] = useState("");
  const oaCount = countByStatus(applications, "oa");

  const visible = useMemo(
    () => filterApplications(applications, { query, status: filter }),
    [applications, filter, query],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          label="Search applications"
          placeholder="Search company, title, URL, or notes"
          value={query}
          onChange={setQuery}
        />
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {APPLICATION_STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={filter === status}
              onClick={() => setFilter(status)}
              label={STATUS_LABELS[status]}
              badge={status === "oa" ? oaCount : undefined}
              tone={status === "oa" ? "urgent" : "default"}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ink-soft px-6 py-10 text-center text-sm text-paper-dim">
          No applications in this view yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-full table-fixed text-left text-sm">
            <thead className="sticky top-0 z-10 bg-panel text-[10px] uppercase tracking-[0.16em] text-paper-dim">
              <tr>
                <th className="w-[18%] px-3 py-2 font-medium">Company</th>
                <th className="w-[38%] px-3 py-2 font-medium">Role</th>
                <th className="w-[18%] px-3 py-2 font-medium">Status</th>
                <th className="w-[16%] px-3 py-2 font-medium">Applied</th>
                <th className="w-[10%] px-3 py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-ink-soft">
              {visible.map((app) => {
                const oa = app.status === "oa";
                return (
                  <tr
                    key={app.id}
                    className={oa ? "bg-clay/15 shadow-[inset_3px_0_0_0_var(--clay)]" : undefined}
                  >
                    <td className="truncate px-3 py-1.5 font-medium text-paper">
                      {app.company || "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="truncate text-paper-dim" title={app.title || undefined}>
                        {app.title || "—"}
                      </div>
                      {app.notes ? (
                        <div
                          className="truncate text-[11px] leading-4 text-paper-dim/70"
                          title={app.notes}
                        >
                          {app.notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusSelect application={app} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-xs text-paper-dim">
                      {formatRelative(app.applied_at)}
                    </td>
                    <td className="px-3 py-1.5">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brass underline-offset-4 hover:underline"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
