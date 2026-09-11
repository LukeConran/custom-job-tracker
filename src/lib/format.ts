export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "unknown date";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "unknown date";
  const delta = Date.now() - then;
  const minutes = Math.round(delta / 60_000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 21) return `${days}d ago`;
  return new Date(then).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLocations(locations: string[]): string {
  if (locations.length === 0) return "Location not listed";
  if (locations.length <= 2) return locations.join(" · ");
  return `${locations.slice(0, 2).join(" · ")} +${locations.length - 2}`;
}
