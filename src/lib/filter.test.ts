import { describe, expect, it } from "vitest";
import {
  isExcludedCompany,
  isMlDsAiCv,
  isSummer2027Only,
  passesSourceFilters,
} from "./filter";
import { mapSimplifyListings, mapZshahJobs, dedupeRoles } from "./sources";

describe("company exclusions", () => {
  it("hard-excludes the named orgs without false positives", () => {
    expect(isExcludedCompany("Lockheed Martin")).toBe(true);
    expect(isExcludedCompany("Sandia National Laboratories")).toBe(true);
    expect(isExcludedCompany("Los Alamos National Laboratory")).toBe(true);
    expect(isExcludedCompany("Idaho National Laboratory")).toBe(true);
    expect(isExcludedCompany("CIA")).toBe(true);
    expect(isExcludedCompany("DIA")).toBe(true);
    expect(isExcludedCompany("NVIDIA")).toBe(false);
    expect(isExcludedCompany("Securian Financial Group")).toBe(false);
    expect(isExcludedCompany("Manulife Financial")).toBe(false);
  });
});

describe("Summer 2027 + ML/DS/AI/CV filters", () => {
  it("keeps active Simplify AI/ML/Data Summer 2027 roles", () => {
    expect(
      passesSourceFilters(
        {
          company: "LabCorp",
          title: "Intern - Data Science - Oncology",
          category: "AI/ML/Data",
          terms: ["Summer 2027"],
          active: true,
          is_visible: true,
        },
        { requireActiveVisible: true },
      ),
    ).toBe(true);
  });

  it("drops Spring 2027 co-ops even when the category is ML", () => {
    expect(
      isSummer2027Only({
        company: "Medpace",
        title: "Feasibility Informatics Internship/Co-op",
        category: "AI/ML/Data",
        terms: ["Spring 2027"],
      }),
    ).toBe(false);
  });

  it("drops Fall 2026 and Summer 2026 terms", () => {
    expect(
      isSummer2027Only({
        company: "Eurofins",
        title: "AI & Automation Intern",
        category: "Data & ML/AI",
        season: "Fall 2026",
      }),
    ).toBe(false);
    expect(
      isSummer2027Only({
        company: "Roche",
        title: "Data Science Associate Intern",
        terms: ["Summer 2026"],
      }),
    ).toBe(false);
  });

  it("keeps Software-category roles whose titles are CV/ML/DS/AI", () => {
    expect(
      isMlDsAiCv({
        company: "Atoms",
        title: "Machine Learning PhD Software Engineer Intern",
        category: "Software",
      }),
    ).toBe(true);
    expect(
      isMlDsAiCv({
        company: "PlayStation",
        title: "Software Developer Intern/Co-op - Front End",
        category: "Software",
      }),
    ).toBe(false);
  });

  it("does not filter on sponsorship", () => {
    const roles = mapSimplifyListings([
      {
        company_name: "OpenAI",
        title: "Machine Learning Intern",
        category: "AI/ML/Data",
        terms: ["Summer 2027"],
        active: true,
        is_visible: true,
        url: "https://openai.com/careers/ml-intern?utm_source=simplify",
        date_posted: 1789000000,
        sponsorship: "Other",
      },
    ]);
    expect(roles).toHaveLength(1);
    expect(roles[0].url).toBe("https://openai.com/careers/ml-intern");
  });

  it("requires Simplify listings to be active and visible", () => {
    const roles = mapSimplifyListings([
      {
        company_name: "OpenAI",
        title: "Machine Learning Intern",
        category: "AI/ML/Data",
        terms: ["Summer 2027"],
        active: false,
        is_visible: true,
        url: "https://openai.com/careers/ml-intern-old",
      },
    ]);
    expect(roles).toHaveLength(0);
  });

  it("maps zshah Summer 2027 ML/AI/CV jobs and drops other seasons", () => {
    const roles = mapZshahJobs({
      jobs: [
        {
          company: "Bedrock Robotics",
          title: "Computer Vision/Machine Learning Intern, 2027",
          category: "Data & ML/AI",
          season: "Summer 2027",
          url: "https://jobs.ashbyhq.com/bedrock/cv",
          location: "San Francisco, CA",
        },
        {
          company: "Eurofins",
          title: "AI & Automation Intern",
          category: "Data & ML/AI",
          season: "Fall 2026",
          url: "https://example.com/fall",
        },
      ],
    });
    expect(roles).toHaveLength(1);
    expect(roles[0].company).toBe("Bedrock Robotics");
  });

  it("dedupes the same cleaned URL across sources", () => {
    const simplify = mapSimplifyListings([
      {
        company_name: "Acme",
        title: "ML Intern",
        category: "AI/ML/Data",
        terms: ["Summer 2027"],
        active: true,
        is_visible: true,
        url: "https://acme.com/job/1?utm_source=simplify",
      },
    ]);
    const zshah = mapZshahJobs({
      jobs: [
        {
          company: "Acme",
          title: "ML Intern",
          category: "Data & ML/AI",
          season: "Summer 2027",
          url: "https://acme.com/job/1/",
        },
      ],
    });
    expect(dedupeRoles([...simplify, ...zshah])).toHaveLength(1);
  });
});
