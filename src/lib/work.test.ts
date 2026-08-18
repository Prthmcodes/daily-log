import { describe, expect, it } from "vitest";

import { WORK } from "./copy";
import type { WorkItemRow } from "./supabase/types";
import { BUCKETS, inBucket, isBucket, nextPosition, type Bucket } from "./work";

function item(bucket: Bucket, position: number, done = false): WorkItemRow {
  return {
    id: `${bucket}-${position}`,
    user_id: "11111111-1111-4111-8111-111111111111",
    bucket,
    text: `${bucket} ${position}`,
    done,
    position,
    created_at: "2026-08-05T08:00:00Z",
    updated_at: "2026-08-05T08:00:00Z",
  };
}

describe("buckets", () => {
  it("are the three asked for, most urgent first", () => {
    expect(BUCKETS).toEqual(["emergency", "important", "unimportant"]);
  });

  it("accepts only those three", () => {
    for (const bucket of BUCKETS) expect(isBucket(bucket)).toBe(true);
    // A stale option or a hand-edited URL must not reach the database, where
    // the CHECK constraint would reject it with a much worse error.
    expect(isBucket("urgent")).toBe(false);
    expect(isBucket("")).toBe(false);
    expect(isBucket("IMPORTANT")).toBe(false);
  });
});

describe("inBucket", () => {
  const items = [
    item("important", 1),
    item("emergency", 0),
    item("important", 0),
    item("unimportant", 0),
  ];

  it("returns only that bucket, in order", () => {
    expect(inBucket(items, "important").map((i) => i.position)).toEqual([0, 1]);
    expect(inBucket(items, "emergency")).toHaveLength(1);
    expect(inBucket(items, "unimportant")).toHaveLength(1);
  });

  it("returns nothing for an empty bucket", () => {
    expect(inBucket([], "emergency")).toEqual([]);
  });
});

describe("nextPosition", () => {
  it("counts per bucket, not across the board", () => {
    // Moving something into a bucket must land it at the bottom of *that*
    // bucket. A board-wide counter would drop it in the middle.
    const items = [item("emergency", 0), item("emergency", 1), item("important", 7)];

    expect(nextPosition(items, "emergency")).toBe(2);
    expect(nextPosition(items, "important")).toBe(8);
    expect(nextPosition(items, "unimportant")).toBe(0);
  });

  it("starts at zero on an empty board", () => {
    expect(nextPosition([], "important")).toBe(0);
  });
});

describe("the copy carries no arithmetic", () => {
  it("has no number, percentage or fraction anywhere", () => {
    // Same guard as the morning list. A board that says "3 emergency" is a
    // scoreboard, and this is not one.
    //
    // Digits and percent signs are banned outright, which covers "3 of 8" and
    // "40%". The only thing left to catch is a fraction spelled out in words,
    // so the pattern is "out of" rather than the bare word "of" — the first
    // version of this test failed on "None of this is scored", which is not a
    // fraction and is exactly the sentence stopping it becoming one.
    function check(value: unknown, path: string) {
      if (typeof value === "string") {
        expect(value, path).not.toMatch(/\d|%/);
        expect(value, path).not.toMatch(/\bout of\b/);
      } else if (value && typeof value === "object") {
        for (const [key, inner] of Object.entries(value)) {
          check(inner, `${path}.${key}`);
        }
      }
    }
    check(WORK, "WORK");
  });
});
