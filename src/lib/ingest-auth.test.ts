import { describe, expect, it } from "vitest";
import { authorizeIngestRequest } from "./ingest-auth";

describe("authorizeIngestRequest", () => {
  it("allows local Refresh when INGEST_SECRET is blank", () => {
    expect(authorizeIngestRequest({ secret: "", authorization: null, headerSecret: null })).toBe(
      true,
    );
    expect(authorizeIngestRequest({ secret: undefined, authorization: null })).toBe(true);
  });

  it("accepts Authorization Bearer or x-ingest-secret", () => {
    expect(
      authorizeIngestRequest({
        secret: "s3cret",
        authorization: "Bearer s3cret",
        headerSecret: null,
      }),
    ).toBe(true);
    expect(
      authorizeIngestRequest({
        secret: "s3cret",
        authorization: null,
        headerSecret: "s3cret",
      }),
    ).toBe(true);
  });

  it("rejects missing or wrong credentials when a secret is set", () => {
    expect(
      authorizeIngestRequest({ secret: "s3cret", authorization: null, headerSecret: null }),
    ).toBe(false);
    expect(
      authorizeIngestRequest({
        secret: "s3cret",
        authorization: "Bearer nope",
        headerSecret: "also-nope",
      }),
    ).toBe(false);
  });
});
