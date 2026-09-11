const TRACKING_PARAM_EXACT = new Set([
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "si",
  "_ga",
  "_gl",
  "_hsenc",
  "_hsmi",
  "ref",
  "ref_src",
  "source",
  "embed",
]);

function isTrackingParam(name: string): boolean {
  const key = name.toLowerCase();
  if (key.startsWith("utm_")) return true;
  return TRACKING_PARAM_EXACT.has(key);
}

function withProtocol(raw: string): string {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) return raw;
  return `https://${raw}`;
}

/** Strip tracking params, hash, trailing slash; lowercase host. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  let parsed: URL;
  try {
    parsed = new URL(withProtocol(trimmed));
  } catch {
    return trimmed.replace(/\/+$/, "");
  }

  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }

  const kept = new URLSearchParams();
  const keys = [...new Set([...parsed.searchParams.keys()])].sort();
  for (const key of keys) {
    if (isTrackingParam(key)) continue;
    for (const value of parsed.searchParams.getAll(key)) {
      kept.append(key, value);
    }
  }
  parsed.search = kept.toString();

  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname
      .replace(/\/(application|apply)$/i, "")
      .replace(/\/+$/, "");
  }

  return parsed.toString();
}

export function urlsMatch(a: string, b: string): boolean {
  return normalizeUrl(a) === normalizeUrl(b);
}
