import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applicationsFromCsv } from "./csv";
import { roleIdFromUrl } from "./hash";
import { resolveApplicationRoleId } from "./link-role";
import { normalizeUrl } from "./url";

const fixture = readFileSync(
  path.join(import.meta.dirname, "fixtures/job-application-list.csv"),
  "utf8",
);

function prepareCsvUpsert(
  text: string,
  roles: { id: string; url: string }[],
) {
  return applicationsFromCsv(text).map((row) => ({
    ...row,
    role_id: resolveApplicationRoleId(row, roles),
  }));
}

describe("resolveApplicationRoleId", () => {
  const url = "https://example.com/jobs/cv-intern-unique-sheet-only";
  const id = roleIdFromUrl(url);
  const roles = [{ id, url: normalizeUrl(url) }];

  it("returns null when the URL hash is not an ingested role", () => {
    expect(
      resolveApplicationRoleId(
        { url: "https://osv-cci.wd1.myworkdayjobs.com/en-US/CCICareers/userHome" },
        roles,
      ),
    ).toBeNull();
  });

  it("does not invent a role_id from a hint that is missing in roles", () => {
    expect(
      resolveApplicationRoleId(
        { role_id: roleIdFromUrl("https://ibm.wd1.example.com/job/123"), url: "https://ibm.wd1.example.com/job/123" },
        roles,
      ),
    ).toBeNull();
  });

  it("links when the ingested role URL matches", () => {
    expect(resolveApplicationRoleId({ url }, roles)).toBe(id);
  });

  it("keeps an explicit role_id only if that role exists", () => {
    expect(resolveApplicationRoleId({ role_id: id, url: "https://other.example/job" }, roles)).toBe(
      id,
    );
    expect(
      resolveApplicationRoleId({ role_id: "missing-role", url: "https://other.example/job" }, roles),
    ).toBeNull();
  });
});

describe("FK-safe CSV upsert", () => {
  const matchingUrl = normalizeUrl("https://example.com/jobs/cv-intern-unique-sheet-only");
  const matchingId = roleIdFromUrl(matchingUrl);

  it("imports the Job Application List fixture without inventing FKs", () => {
    const rows = prepareCsvUpsert(fixture, [
      { id: matchingId, url: matchingUrl },
    ]);

    expect(rows.map((row) => row.company)).toEqual([
      "Castleton Commodities International",
      "Capital One",
      "IBM",
      "Unknown Startup",
    ]);
    expect(rows.map((row) => row.status)).toEqual(["applied", "applied", "oa", "applied"]);
    expect(rows.every((row) => row.url)).toBe(true);

    const sheetOnly = rows.filter((row) => row.company !== "Unknown Startup");
    expect(sheetOnly.every((row) => row.role_id == null)).toBe(true);

    const linked = rows.find((row) => row.company === "Unknown Startup");
    expect(linked?.role_id).toBe(matchingId);
    expect(linked?.title).toBe("Computer Vision Intern");
  });

  it("skips rows without a Link and still reads a spaced Location header", () => {
    const parsed = applicationsFromCsv(fixture);
    expect(parsed.some((row) => row.company === "WWT")).toBe(false);
    const cci = parsed.find((row) => row.company === "Castleton Commodities International");
    expect(cci?.notes).toContain("Location: Houston, New York, etc.");
    expect(cci?.notes).toContain("Type: Intern");
  });

  it("maps Offer / Applied / OA aliases from the sheet", () => {
    const withOffer = [
      "Company,Role,Status,Link",
      "WWT,Data Science Intern,Offer,https://wwt.example.com/offer",
    ].join("\n");
    const rows = prepareCsvUpsert(withOffer, []);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("offer");
    expect(rows[0].role_id).toBeNull();
  });
});
