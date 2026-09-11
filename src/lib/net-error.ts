export function describeNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const parts = [error.message];
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: string }).code;
    parts.push(code ? `${cause.message} (${code})` : cause.message);
  } else if (cause && typeof cause === "object") {
    const code = "code" in cause ? String((cause as { code: unknown }).code) : "";
    const message = "message" in cause ? String((cause as { message: unknown }).message) : "";
    if (message || code) parts.push([message, code && `(${code})`].filter(Boolean).join(" "));
  }
  const ownCode = (error as Error & { code?: string }).code;
  if (ownCode && !parts.join(" ").includes(ownCode)) parts.push(`(${ownCode})`);
  return [...new Set(parts.filter(Boolean))].join(" — ");
}

export function isRetriableNetworkError(error: unknown): boolean {
  const text = describeNetworkError(error).toLowerCase();
  return (
    /fetch failed|timed out|timeout|econnreset|econnrefused|enotfound|epipe|und_err|socket|network|429|502|503|504/.test(
      text,
    )
  );
}
