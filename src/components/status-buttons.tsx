import { trackApplication } from "@/app/actions";
import type { ApplicationStatus, Role } from "@/lib/types";

const ACTIONS: { status: ApplicationStatus; label: string }[] = [
  { status: "applied", label: "Applied" },
  { status: "interviewing", label: "Interviewing" },
  { status: "oa", label: "OA" },
  { status: "skipped", label: "Skip" },
];

export function StatusButtons({ role }: { role: Role }) {
  return (
    <form action={trackApplication} className="flex flex-wrap justify-end gap-1.5">
      <input type="hidden" name="role_id" value={role.id} />
      <input type="hidden" name="url" value={role.url} />
      <input type="hidden" name="company" value={role.company} />
      <input type="hidden" name="title" value={role.title} />
      {ACTIONS.map((action) => (
        <button
          key={action.status}
          type="submit"
          name="status"
          value={action.status}
          className="rounded-full border border-line bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:border-brass hover:text-brass"
        >
          {action.label}
        </button>
      ))}
    </form>
  );
}
