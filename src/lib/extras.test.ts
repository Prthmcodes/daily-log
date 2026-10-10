import { describe, expect, it } from "vitest";

import { NO_EXTRAS, adjustBlocks, extrasOf } from "./extras";
import type { ExtrasRow } from "./supabase/types";

/** A row as the database would hand it back. */
function row(overrides: Partial<ExtrasRow>): ExtrasRow {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    user_id: "11111111-1111-4111-8111-111111111111",
    date: "2026-08-05",
    no_reels: false,
    read_something: false,
    alone: false,
    let_go: false,
    study_blocks: 0,
    hardest: "",
    created_at: "2026-08-05T12:00:00Z",
    updated_at: "2026-08-05T12:00:00Z",
    ...overrides,
  };
}

describe("extrasOf", () => {
  it("returns the empty state when the day has no row", () => {
    expect(extrasOf(null)).toEqual(NO_EXTRAS);
  });

  it("reads every value off a row", () => {
    expect(
      extrasOf(
        row({
          no_reels: true,
          read_something: true,
          alone: true,
          let_go: true,
          study_blocks: 4,
          hardest: "Six, waiting for the bus.",
        }),
      ),
    ).toEqual({
      noReels: true,
      readSomething: true,
      alone: true,
      letGo: true,
      studyBlocks: 4,
      hardest: "Six, waiting for the bus.",
    });
  });

  it("carries nothing that could become a score", () => {
    // This object must never grow a total, a score or an average. If a future
    // change adds one, this test says so.
    expect(Object.keys(extrasOf(row({}))).sort()).toEqual([
      "alone",
      "hardest",
      "letGo",
      "noReels",
      "readSomething",
      "studyBlocks",
    ]);
  });

  it("keeps the hardest line as text, never as a rating", () => {
    // The temptation with a field like this is to score it later — "how bad
    // was it, 1 to 5" — and a number here would be a second score sitting on
    // a screen built to have exactly one. It stays a sentence.
    const value = extrasOf(row({ hardest: "Ten past nine, after dinner." }));
    expect(typeof value.hardest).toBe("string");
  });
});

describe("adjustBlocks", () => {
  it("counts up", () => {
    expect(adjustBlocks(0, 1)).toBe(1);
    expect(adjustBlocks(3, 1)).toBe(4);
  });

  it("counts down", () => {
    expect(adjustBlocks(4, -1)).toBe(3);
    expect(adjustBlocks(1, -1)).toBe(0);
  });

  it("never goes below zero", () => {
    // The database has the same rule as a CHECK constraint. This stops the
    // screen ever showing a number the database would refuse.
    expect(adjustBlocks(0, -1)).toBe(0);
    expect(adjustBlocks(0, -5)).toBe(0);
    expect(adjustBlocks(2, -10)).toBe(0);
  });

  it("has no upper limit", () => {
    // There is no target, so there is nothing to cap. A twelve-block day is
    // just a twelve-block day.
    expect(adjustBlocks(11, 1)).toBe(12);
  });
});
