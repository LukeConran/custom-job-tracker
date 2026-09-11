import { describe, expect, it } from "vitest";
import { keywordChips } from "./keywords";

describe("keywordChips", () => {
  it("surfaces CV / framework / LLM hints from title and category", () => {
    expect(
      keywordChips({
        title: "Computer Vision Intern — PyTorch + LLMs",
        category: "AI/ML/Data",
        skills: [],
      }),
    ).toEqual(["computer vision", "pytorch", "LLM"]);
  });

  it("pulls leftover stored skills after catalog matches", () => {
    expect(
      keywordChips({
        title: "Data Science Intern",
        category: "Data",
        skills: ["SQL", "dbt", "https://ignore.example"],
      }),
    ).toEqual(["SQL", "data science", "dbt"]);
  });

  it("caps the set and skips empty / oversized skills", () => {
    const chips = keywordChips(
      {
        title: "Machine Learning Intern",
        category: null,
        skills: ["x", "this-skill-name-is-way-too-long-for-a-chip", "JAX"],
      },
      2,
    );
    expect(chips).toEqual(["JAX", "machine learning"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(
      keywordChips({
        title: "Software Developer Intern",
        category: "Software",
        skills: [],
      }),
    ).toEqual([]);
  });
});
