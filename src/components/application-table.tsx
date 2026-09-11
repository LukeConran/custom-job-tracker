"use client";

import { useMemo, useState } from "react";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { FilterChip } from "@/components/filter-chip";
import { SearchField } from "@/components/search-field";
import { StatusSelect } from "@/components/status-select";
import { formatRelative } from "@/lib/format";
import { countActivePipeline, countByStatus, filterApplications } from "@/lib/search";
import { STATUS_LABELS } from "@/lib/status";
import { APPLICATION_STATUSES } from "@/lib/types";
import type { Application, ApplicationStatus } from "@/lib/types";

export function ApplicationTable({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [query, setQuery] = useState("");
  const oaCount = countByStatus(applications, "oa");
  const activeCount = countActivePipeline(applications);

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
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            badge={activeCount}
          />
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
          {filter === "all"
            ? "No active applications (applied, interviewing, OA, offer). Rejected and skipped live on their own chips."
            : "No applications in this view yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-panel text-[10px] uppercase tracking-[0.16em] text-paper-dim">
              <tr>
                <th className="px-3 py-2 font-medium">Company / JD</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Applied</th>
                <th className="px-3 py-2 font-medium">Link</th>
                <th className="px-3 py-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-ink-soft">
              {visible.map((app) => {
                const oa = app.status === "oa";
                const href = app.url || undefined;
                return (
                  <tr
                    key={app.id}
                    className={oa ? "bg-clay/15 shadow-[inset_3px_0_0_0_var(--clay)]" : undefined}
                  >
                    <td className="max-w-[14rem] px-3 py-1.5 font-medium text-paper">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brass underline-offset-2 hover:underline"
                          title={href}
                        >
                          {app.company || "Open listing"}
                        </a>
                      ) : (
                        <span>{app.company || "—"}</span>
                      )}
                    </td>
                    <td className="max-w-[22rem] px-3 py-1.5">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-paper-dim hover:text-brass"
                          title={app.title || href}
                        >
                          {app.title || href}
                        </a>
                      ) : (
                        <div className="truncate text-paper-dim" title={app.title || undefined}>
                          {app.title || "—"}
                        </div>
                      )}
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
                    <td className="whitespace-nowrap px-3 py-1.5">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-brass/50 px-2 py-0.5 text-xs font-medium text-brass hover:bg-brass hover:text-ink"
                        >
                          Open JD
                        </a>
                      ) : (
                        <span className="text-xs text-paper-dim">No URL</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 align-top">
                      <DeleteApplicationButton application={app} />
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
