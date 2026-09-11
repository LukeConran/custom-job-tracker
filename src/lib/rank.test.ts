import { describe, expect, it } from "vitest";
import { classifyFit, compareRanked, freshnessScore, rankRole } from "./rank";
import { nextRoles } from "./queue";
import type { Application, Role } from "./types";

describe("ranking", () => {
  it("tags CV above ML/DS above AI-SWE", () => {
    expect(classifyFit({ title: "Computer Vision Intern", company: "Acme" })).toBe("cv");
    expect(classifyFit({ title: "Data Science Intern", company: "Acme" })).toBe("ml_ds");
    expect(classifyFit({ title: "AI Software Engineer Intern", company: "Acme" })).toBe(
      "ai_swe",
    );
    expect(rankRole({ title: "Computer Vision Intern", company: "Acme" }).rank_score).toBeGreaterThan(
      rankRole({ title: "Data Science Intern", company: "Acme" }).rank_score,
    );
    expect(rankRole({ title: "Data Science Intern", company: "Acme" }).rank_score).toBeGreaterThan(
      rankRole({ title: "AI Software Engineer Intern", company: "Acme" }).rank_score,
    );
  });

  it("boosts freshness and light big-name companies", () => {
    const fresh = freshnessScore(new Date().toISOString());
    const stale = freshnessScore("2024-01-01T00:00:00.000Z");
    expect(fresh).toBeGreaterThan(stale);

    const nvidia = rankRole({
      title: "Machine Learning Intern",
      company: "NVIDIA",
      posted_at: "2024-01-01T00:00:00.000Z",
    });
    const unknown = rankRole({
      title: "Machine Learning Intern",
      company: "Unknown Labs",
      posted_at: "2024-01-01T00:00:00.000Z",
    });
    expect(nvidia.rank_score).toBe(unknown.rank_score + 8);
  });

  it("sorts higher scores first", () => {
    const rows = [
      { rank_score: 20, posted_at: "2026-09-01T00:00:00.000Z" },
      { rank_score: 40, posted_at: "2026-08-01T00:00:00.000Z" },
    ];
    rows.sort(compareRanked);
    expect(rows[0].rank_score).toBe(40);
  });
});

describe("next-to-apply visibility", () => {
  const role = {
    id: "abc",
    source: "simplify",
    company: "Acme",
    title: "ML Intern",
    url: "https://acme.com/job/1",
    category: "AI/ML/Data",
    locations: [],
    skills: [],
    posted_at: null,
    terms: "Summer 2027",
    raw: null,
    first_seen_at: "2026-09-01T00:00:00.000Z",
    last_seen_at: "2026-09-01T00:00:00.000Z",
    fit_tag: "ml_ds",
    rank_score: 40,
  } as Role;

  it("hides roles that already have any application status, including skipped", () => {
    const skipped: Application = {
      id: "1",
      role_id: "abc",
      url: "https://acme.com/job/1",
      company: "Acme",
      title: "ML Intern",
      status: "skipped",
      notes: "",
      applied_at: null,
      updated_at: "2026-09-01T00:00:00.000Z",
    };
    expect(nextRoles([role], [skipped])).toEqual([]);
    expect(nextRoles([role], [])).toEqual([role]);
  });
});
