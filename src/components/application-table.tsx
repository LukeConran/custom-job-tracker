"use client";

import { useMemo, useState } from "react";
import { StatusSelect } from "@/components/status-select";
import { formatRelative } from "@/lib/format";
import { APPLICATION_STATUSES } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/status";
import type { Application, ApplicationStatus } from "@/lib/types";

export function ApplicationTable({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  const visible = useMemo(
    () => (filter === "all" ? applications : applications.filter((app) => app.status === filter)),
    [applications, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
        {APPLICATION_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={filter === status}
            onClick={() => setFilter(status)}
            label={STATUS_LABELS[status]}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-ink-soft px-6 py-12 text-center text-sm text-paper-dim">
          No applications in this view yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel text-[11px] uppercase tracking-[0.16em] text-paper-dim">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-ink-soft">
              {visible.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 font-medium text-paper">{app.company || "—"}</td>
                  <td className="px-4 py-3 text-paper-dim">
                    <div>{app.title || "—"}</div>
                    {app.notes ? <div className="mt-1 text-xs text-paper-dim/80">{app.notes}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect application={app} />
                  </td>
                  <td className="px-4 py-3 text-paper-dim">{formatRelative(app.applied_at)}</td>
                  <td className="px-4 py-3">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs ${
        active ? "bg-brass text-ink" : "border border-line text-paper-dim hover:text-paper"
      }`}
    >
      {label}
    </button>
  );
}
