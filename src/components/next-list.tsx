import { formatLocations, formatRelative } from "@/lib/format";
import { FIT_LABELS } from "@/lib/status";
import type { Role } from "@/lib/types";
import { StatusButtons } from "./status-buttons";

const FIT_TONE: Record<string, string> = {
  cv: "bg-moss/15 text-moss",
  ml_ds: "bg-brass/15 text-brass",
  ai_swe: "bg-sky/15 text-sky",
  other: "bg-line text-paper-dim",
};

const PREVIEW = 40;

export function NextList({ roles }: { roles: Role[] }) {
  const visible = roles.slice(0, PREVIEW);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-ink-soft px-6 py-14 text-center">
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
      <ol className="space-y-3">
        {visible.map((role, index) => (
          <li
            key={role.id}
            className="rounded-2xl border border-line bg-ink-soft/90 p-4 shadow-[inset_0_1px_0_rgba(243,234,214,0.04)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-paper-dim">
                  <span className="font-serif text-lg normal-case tracking-tight text-brass">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 tracking-[0.12em] ${FIT_TONE[role.fit_tag ?? "other"]}`}
                  >
                    {role.fit_tag ? FIT_LABELS[role.fit_tag] : "Role"}
                  </span>
                  <span>{role.source}</span>
                  {role.rank_score != null ? <span>score {role.rank_score}</span> : null}
                </div>
                <h3 className="mt-2 font-serif text-xl leading-snug text-paper">
                  {role.company}
                </h3>
                <p className="mt-1 text-sm text-paper-dim">{role.title}</p>
                <p className="mt-2 text-xs text-paper-dim/90">
                  {formatLocations(role.locations)} · posted {formatRelative(role.posted_at)}
                  {role.terms ? ` · ${role.terms}` : ""}
                </p>
                <a
                  href={role.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm text-brass underline-offset-4 hover:underline"
                >
                  Open listing
                </a>
              </div>
              <StatusButtons role={role} />
            </div>
          </li>
        ))}
      </ol>
      {roles.length > visible.length ? (
        <p className="text-center text-xs text-paper-dim">
          Showing the top {visible.length} of {roles.length} ranked roles. Mark or skip
          these to advance the queue.
        </p>
      ) : null}
    </div>
  );
}
