import { ApplicationTable } from "@/components/application-table";
import { CsvImport } from "@/components/csv-import";
import { listApplications } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await listApplications();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-brass">
            Personal tracker
          </p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight text-paper">Applications</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-paper-dim">
            Every status, including skipped and rejected. Change status here; the role
            leaves the Next to apply queue as soon as it is tracked.
          </p>
        </div>
        <CsvImport />
      </section>
      <ApplicationTable applications={applications} />
    </div>
  );
}
