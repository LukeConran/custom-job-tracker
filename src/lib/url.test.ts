import { describe, expect, it } from "vitest";
import { normalizeUrl, urlsMatch } from "./url";
import { roleIdFromUrl } from "./hash";

describe("normalizeUrl", () => {
  it("strips utm params and hashes", () => {
    expect(
      normalizeUrl(
        "https://jobs.example.com/role/123?utm_source=simplify&utm_campaign=summer&foo=1#apply",
      ),
    ).toBe("https://jobs.example.com/role/123?foo=1");
  });

  it("strips common click ids and lowercases the host", () => {
    expect(
      normalizeUrl("https://Jobs.AshbyHQ.com/Acme/abc?fbclid=IwAR&gclid=123&ref=board"),
    ).toBe("https://jobs.ashbyhq.com/Acme/abc");
  });

  it("removes trailing slashes and upgrades http", () => {
    expect(normalizeUrl("http://careers.example.com/intern/")).toBe(
      "https://careers.example.com/intern",
    );
  });

  it("treats tracking-only query strings as the same role", () => {
    expect(
      urlsMatch(
        "https://boards.greenhouse.io/x/jobs/1?utm_medium=social",
        "https://boards.greenhouse.io/x/jobs/1/",
      ),
    ).toBe(true);
  });

  it("hashes the cleaned URL stably", () => {
    const a = roleIdFromUrl("https://Example.com/job/9?utm_source=x");
    const b = roleIdFromUrl("https://example.com/job/9/");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
