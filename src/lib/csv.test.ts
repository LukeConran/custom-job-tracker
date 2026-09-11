import { describe, expect, it } from "vitest";
import { applicationsFromCsv, normalizeStatus } from "./csv";

describe("CSV import", () => {
  it("maps the Sheet columns and strips tracking from Link", () => {
    const csv = [
      "Company,Role,Type,Location,Date Applied,Status,Contact,Pay/Hr,Link",
      'Acme,"ML Intern",Intern,"SF, CA",2026-09-01,OA,recruiter@acme.com,55,https://acme.com/job/1?utm_source=sheet',
    ].join("\n");
    const rows = applicationsFromCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      company: "Acme",
      title: "ML Intern",
      status: "oa",
      url: "https://acme.com/job/1",
    });
    expect(rows[0].notes).toContain("Contact: recruiter@acme.com");
    expect(rows[0].applied_at).toBeTruthy();
  });

  it("normalizes common status labels", () => {
    expect(normalizeStatus("Online Assessment")).toBe("oa");
    expect(normalizeStatus("Skip")).toBe("skipped");
    expect(normalizeStatus("Interview")).toBe("interviewing");
    expect(normalizeStatus("Offer")).toBe("offer");
    expect(normalizeStatus("OA")).toBe("oa");
    expect(normalizeStatus("Applied")).toBe("applied");
  });

  it("matches Location even when the header has a leading space", () => {
    const csv = [
      "Company,Role,Type, Location,Status,Link",
      "Acme,ML Intern,Intern,Remote,Applied,https://acme.com/job/2",
    ].join("\n");
    const rows = applicationsFromCsv(csv);
    expect(rows[0].notes).toContain("Location: Remote");
  });
});
