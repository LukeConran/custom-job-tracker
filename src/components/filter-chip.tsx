export function FilterChip({
  active,
  label,
  onClick,
  badge,
  tone,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  badge?: number;
  tone?: "default" | "urgent";
}) {
  const urgent = tone === "urgent";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${
        active
          ? urgent
            ? "bg-clay text-ink"
            : "bg-brass text-ink"
          : urgent
            ? "border border-clay/60 text-clay hover:text-paper"
            : "border border-line text-paper-dim hover:text-paper"
      }`}
    >
      {label}
      {badge != null && badge > 0 ? (
        <span
          className={`rounded-sm px-1 text-[10px] font-semibold leading-4 ${
            active ? "bg-ink/20 text-ink" : urgent ? "bg-clay/20 text-clay" : "bg-panel text-paper-dim"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
