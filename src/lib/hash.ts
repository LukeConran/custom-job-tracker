import { createHash } from "node:crypto";
import { normalizeUrl } from "./url";

export function roleIdFromUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}
