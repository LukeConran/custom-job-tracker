"use client";

import { changeApplicationStatus } from "@/app/actions";
import { APPLICATION_STATUSES } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/status";
import type { Application } from "@/lib/types";

export function StatusSelect({ application }: { application: Application }) {
  return (
    <form action={changeApplicationStatus}>
      <input type="hidden" name="id" value={application.id} />
      <select
        name="status"
        defaultValue={application.status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-full border border-line bg-ink px-2 py-1 text-xs text-paper"
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </form>
  );
}
