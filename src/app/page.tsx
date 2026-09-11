import { NextList } from "@/components/next-list";
import { RefreshButton } from "@/components/refresh-button";
import { formatRelative } from "@/lib/format";
import { nextRoles } from "@/lib/queue";
import { currentBackend, lastIngestAt, listApplications, listRoles } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [roles, applications, synced] = await Promise.all([
    listRoles(),
    listApplications(),
    lastIngestAt(),
  ]);
  const queue = nextRoles(roles, applications);
  const backend = currentBackend();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-brass">
            Summer 2027 only · ML / DS / AI / CV
          </p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight text-paper">Next to apply</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-paper-dim">
            Ranked by freshness, computer vision over ML/DS over AI-SWE, with a light
            big-name boost. Roles already in Applications — including skipped — stay off
            this list. No auto-apply.
          </p>
          <p className="mt-3 text-xs text-paper-dim">
            {queue.length} waiting · {applications.length} tracked · last refresh{" "}
            {synced ? formatRelative(synced) : "never"} · store {backend}
          </p>
        </div>
        <RefreshButton />
      </section>
      <NextList roles={queue} />
    </div>
  );
}
