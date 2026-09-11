import { describe, expect, it } from "vitest";
import {
  countByStatus,
  filterApplications,
  filterNextRoles,
  matchesQuery,
} from "./search";
import type { Application, Role } from "./types";

function role(partial: Partial<Role> & Pick<Role, "id" | "company" | "title">): Role {
  return {
    source: "simplify",
    url: `https://example.com/${partial.id}`,
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
    ...partial,
  };
}

function app(
  partial: Partial<Application> & Pick<Application, "id" | "status">,
): Application {
  return {
    role_id: null,
    url: `https://example.com/${partial.id}`,
    company: "Acme",
    title: "ML Intern",
    notes: "",
    applied_at: null,
    updated_at: "2026-09-01T00:00:00.000Z",
    ...partial,
  };
}

describe("matchesQuery", () => {
  it("matches any field case-insensitively and treats blank as all", () => {
    expect(matchesQuery("", "NVIDIA", "Intern")).toBe(true);
    expect(matchesQuery("  nvidia", "NVIDIA", "CV Intern")).toBe(true);
    expect(matchesQuery("intern", "NVIDIA", "CV Intern")).toBe(true);
    expect(matchesQuery("openai", "NVIDIA", "CV Intern")).toBe(false);
  });
});

describe("filterNextRoles", () => {
  const queue = [
    role({ id: "1", company: "NVIDIA", title: "Computer Vision Intern", fit_tag: "cv", rank_score: 90 }),
    role({ id: "2", company: "Stripe", title: "Data Science Intern", fit_tag: "ml_ds", rank_score: 70 }),
    role({ id: "3", company: "OpenAI", title: "AI Software Engineer Intern", fit_tag: "ai_swe", rank_score: 55 }),
  ];

  it("keeps ranking order when filtering", () => {
    const filtered = filterNextRoles(queue, { query: "intern" });
    expect(filtered.map((row) => row.id)).toEqual(["1", "2", "3"]);
  });

  it("searches company and title only", () => {
    expect(filterNextRoles(queue, { query: "nvidia" }).map((row) => row.id)).toEqual(["1"]);
    expect(filterNextRoles(queue, { query: "data science" }).map((row) => row.id)).toEqual(["2"]);
    expect(filterNextRoles(queue, { query: "missing" })).toEqual([]);
  });

  it("filters by fit_tag without reordering", () => {
    expect(filterNextRoles(queue, { fitTag: "cv" }).map((row) => row.company)).toEqual(["NVIDIA"]);
    expect(filterNextRoles(queue, { fitTag: "all" })).toHaveLength(3);
    expect(filterNextRoles(queue, { query: "intern", fitTag: "ai_swe" }).map((row) => row.id)).toEqual([
      "3",
    ]);
  });
});

describe("filterApplications", () => {
  const rows = [
    app({ id: "1", status: "applied", company: "NVIDIA", title: "CV Intern", notes: "referral" }),
    app({ id: "2", status: "oa", company: "Stripe", title: "DS Intern", url: "https://jobs.stripe.com/ds" }),
    app({ id: "3", status: "oa", company: "Meta", title: "ML Intern", notes: "codesignal" }),
  ];

  it("searches company, title, url, and notes", () => {
    expect(filterApplications(rows, { query: "referral" }).map((row) => row.id)).toEqual(["1"]);
    expect(filterApplications(rows, { query: "stripe.com" }).map((row) => row.id)).toEqual(["2"]);
    expect(filterApplications(rows, { query: "ml intern" }).map((row) => row.id)).toEqual(["3"]);
  });

  it("combines status chips with search and preserves order", () => {
    expect(filterApplications(rows, { status: "oa" }).map((row) => row.id)).toEqual(["2", "3"]);
    expect(filterApplications(rows, { status: "oa", query: "meta" }).map((row) => row.id)).toEqual([
      "3",
    ]);
    expect(filterApplications(rows, { status: "all" })).toHaveLength(3);
  });

  it("treats All as the active pipeline, excluding rejected and skipped", () => {
    const mixed = [
      ...rows,
      app({ id: "4", status: "rejected", company: "Nope" }),
      app({ id: "5", status: "skipped", company: "SkipCo" }),
      app({ id: "6", status: "offer", company: "HireMe" }),
    ];
    expect(filterApplications(mixed, { status: "all" }).map((row) => row.id)).toEqual([
      "1",
      "2",
      "3",
      "6",
    ]);
    expect(filterApplications(mixed, { status: "rejected" }).map((row) => row.id)).toEqual(["4"]);
    expect(filterApplications(mixed, { status: "skipped" }).map((row) => row.id)).toEqual(["5"]);
  });
});

describe("countByStatus", () => {
  it("counts OA rows for the urgency badge", () => {
    const rows = [
      app({ id: "1", status: "applied" }),
      app({ id: "2", status: "oa" }),
      app({ id: "3", status: "oa" }),
    ];
    expect(countByStatus(rows, "oa")).toBe(2);
    expect(countByStatus(rows, "offer")).toBe(0);
  });
});
