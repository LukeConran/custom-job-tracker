import { describe, expect, it } from "vitest";
import { describeNetworkError, isRetriableNetworkError } from "./net-error";
import { fetchJsonFeed } from "./fetch-feed";

describe("describeNetworkError", () => {
  it("unwraps TypeError: fetch failed causes instead of leaving a bare TypeError", () => {
    const cause = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
    const error = Object.assign(new TypeError("fetch failed"), { cause });
    const message = describeNetworkError(error);
    expect(message).toContain("fetch failed");
    expect(message).toContain("ECONNRESET");
    expect(isRetriableNetworkError(error)).toBe(true);
  });
});

describe("fetchJsonFeed", () => {
  it("retries retriable failures then parses JSON", async () => {
    let calls = 0;
    const json = await fetchJsonFeed("https://example.com/jobs.json", {
      attempts: 3,
      timeoutMs: 1_000,
      retryDelayMs: 0,
      download: async () => {
        calls += 1;
        if (calls < 3) {
          throw Object.assign(new TypeError("fetch failed"), {
            cause: Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }),
          });
        }
        return { status: 200, body: '{"jobs":[1]}', finalUrl: "https://example.com/jobs.json" };
      },
    });
    expect(calls).toBe(3);
    expect(json).toEqual({ jobs: [1] });
  });

  it("surfaces a clear error after retries", async () => {
    await expect(
      fetchJsonFeed("https://example.com/jobs.json", {
        attempts: 2,
        timeoutMs: 500,
        retryDelayMs: 0,
        download: async () => {
          throw Object.assign(new TypeError("fetch failed"), {
            cause: Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" }),
          });
        },
      }),
    ).rejects.toThrow(/ENOTFOUND|fetch failed/);
  });
});
