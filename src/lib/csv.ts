import type { ApplicationInput, ApplicationStatus } from "./types";
import { APPLICATION_STATUSES } from "./types";
import { normalizeUrl } from "./url";

const STATUS_ALIASES: Record<string, ApplicationStatus> = {
  applied: "applied",
  apply: "applied",
  application: "applied",
  interviewing: "interviewing",
  interview: "interviewing",
  phone: "interviewing",
  recruiter: "interviewing",
  oa: "oa",
  "online assessment": "oa",
  assessment: "oa",
  hirevue: "oa",
  codesignal: "oa",
  hackerrank: "oa",
  offer: "offer",
  accepted: "offer",
  rejected: "rejected",
  reject: "rejected",
  declined: "rejected",
  skipped: "skipped",
  skip: "skipped",
  ghosted: "skipped",
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function normalizeStatus(raw: string | undefined): ApplicationStatus {
  const key = (raw ?? "").trim().toLowerCase();
  if ((APPLICATION_STATUSES as readonly string[]).includes(key)) {
    return key as ApplicationStatus;
  }
  return STATUS_ALIASES[key] ?? "applied";
}

function headerIndex(headers: string[], ...names: string[]): number {
  const lowered = headers.map((h) => h.trim().toLowerCase());
  for (const name of names) {
    const idx = lowered.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function cell(row: string[], index: number): string {
  return index >= 0 ? (row[index] ?? "").trim() : "";
}

export function applicationsFromCsv(text: string): ApplicationInput[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const companyIdx = headerIndex(headers, "Company");
  const roleIdx = headerIndex(headers, "Role", "Title", "Position");
  const typeIdx = headerIndex(headers, "Type");
  const locationIdx = headerIndex(headers, "Location");
  const dateIdx = headerIndex(headers, "Date Applied", "Applied", "Applied At");
  const statusIdx = headerIndex(headers, "Status");
  const contactIdx = headerIndex(headers, "Contact");
  const payIdx = headerIndex(headers, "Pay/Hr", "Pay", "Hourly");
  const linkIdx = headerIndex(headers, "Link", "URL", "Url");

  const seen = new Set<string>();
  const out: ApplicationInput[] = [];

  for (const row of rows.slice(1)) {
    const link = cell(row, linkIdx);
    const url = normalizeUrl(link);
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const extras = [
      cell(row, typeIdx) && `Type: ${cell(row, typeIdx)}`,
      cell(row, locationIdx) && `Location: ${cell(row, locationIdx)}`,
      cell(row, contactIdx) && `Contact: ${cell(row, contactIdx)}`,
      cell(row, payIdx) && `Pay/Hr: ${cell(row, payIdx)}`,
    ].filter(Boolean);

    const dateApplied = cell(row, dateIdx);
    let applied_at: string | null = null;
    if (dateApplied) {
      const parsed = Date.parse(dateApplied);
      if (!Number.isNaN(parsed)) applied_at = new Date(parsed).toISOString();
    }

    out.push({
      url,
      company: cell(row, companyIdx) || null,
      title: cell(row, roleIdx) || null,
      status: normalizeStatus(cell(row, statusIdx)),
      notes: extras.join(" · "),
      applied_at,
    });
  }

  return out;
}
