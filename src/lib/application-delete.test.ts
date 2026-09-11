import { describe, expect, it } from "vitest";
import {
  isDeleteConfirmed,
  parseDeleteApplicationId,
  removeApplicationById,
} from "./application-delete";

describe("delete application", () => {
  it("requires a non-empty id", () => {
    expect(() => parseDeleteApplicationId({})).toThrow(/id is required/i);
    expect(parseDeleteApplicationId({ id: " abc " })).toBe("abc");
  });

  it("removes only the matching tracker row", () => {
    const rows = [
      { id: "1", company: "A" },
      { id: "2", company: "B" },
    ];
    expect(removeApplicationById(rows, "1")).toEqual([{ id: "2", company: "B" }]);
    expect(() => removeApplicationById(rows, "missing")).toThrow(/not found/i);
  });

  it("requires typing delete to confirm", () => {
    expect(isDeleteConfirmed("delete")).toBe(true);
    expect(isDeleteConfirmed(" DELETE ")).toBe(true);
    expect(isDeleteConfirmed("remove")).toBe(false);
    expect(isDeleteConfirmed("")).toBe(false);
  });
});
