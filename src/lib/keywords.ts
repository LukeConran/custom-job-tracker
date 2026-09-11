import type { Role } from "./types";

/** Small ATS-style catalog. More specific labels come first. */
export const KEYWORD_CATALOG: { label: string; pattern: RegExp }[] = [
  { label: "computer vision", pattern: /computer[\s-]*vision|perception|opencv|\bcv\b/i },
  { label: "multimodal", pattern: /multimodal|vision[\s-]*language|\bvlm\b/i },
  { label: "pytorch", pattern: /pytorch|\btorch\b/i },
  { label: "tensorflow", pattern: /tensorflow/i },
  { label: "JAX", pattern: /\bjax\b/i },
  { label: "LLM", pattern: /\bllms?\b|language\s+models?|foundation\s+models?/i },
  { label: "NLP", pattern: /\bnlp\b|natural\s+language/i },
  { label: "transformers", pattern: /transformers?|\battention\b/i },
  { label: "diffusion", pattern: /diffusion|image\s+generat/i },
  { label: "reinforcement learning", pattern: /reinforcement|\brl\b/i },
  { label: "deep learning", pattern: /deep[\s-]*learning/i },
  { label: "CUDA", pattern: /\bcuda\b|\bgpu\b/i },
  { label: "robotics", pattern: /robotics|autonomous/i },
  { label: "C++", pattern: /\bc\+\+\b/i },
  { label: "SQL", pattern: /\bsql\b|\bspark\b/i },
  { label: "data science", pattern: /data[\s-]*scien|data[\s-]*analyst/i },
  { label: "machine learning", pattern: /machine[\s-]*learning/i },
];

const DEFAULT_LIMIT = 4;

function keywordHaystack(role: Pick<Role, "title" | "category" | "skills">): string {
  return [role.title, role.category ?? "", ...(role.skills ?? [])].join(" ");
}

function normalizeChip(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

export function keywordChips(
  role: Pick<Role, "title" | "category" | "skills">,
  limit = DEFAULT_LIMIT,
): string[] {
  const haystack = keywordHaystack(role);
  const chips: string[] = [];
  const seen = new Set<string>();

  for (const entry of KEYWORD_CATALOG) {
    if (chips.length >= limit) break;
    if (!entry.pattern.test(haystack)) continue;
    const key = normalizeChip(entry.label);
    if (seen.has(key)) continue;
    seen.add(key);
    chips.push(entry.label);
  }

  for (const skill of role.skills ?? []) {
    if (chips.length >= limit) break;
    const trimmed = skill.trim();
    if (trimmed.length < 2 || trimmed.length > 22) continue;
    if (/https?:\/\//i.test(trimmed)) continue;
    const key = normalizeChip(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    chips.push(trimmed);
  }

  return chips;
}
