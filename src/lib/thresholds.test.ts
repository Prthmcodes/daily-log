import { describe, expect, it } from "vitest";

import type { ThresholdRow } from "./supabase/types";
import { isComplete, nextPosition, readAsSentence } from "./thresholds";

function threshold(position: number): ThresholdRow {
  return {
    id: `id-${position}`,
    user_id: "11111111-1111-4111-8111-111111111111",
    cue: "After I sit down",
    intention: "the first thing is the hard thing",
    position,
    created_at: "2026-08-05T08:00:00Z",
    updated_at: "2026-08-05T08:00:00Z",
  };
}

describe("isComplete", () => {
  it("needs both halves", () => {
    // A cue with no intention is a worry; an intention with no cue is a wish.
    // Only the pair is a decision.
    expect(isComplete("After the shower", "")).toBe(false);
    expect(isComplete("", "the phone stays out")).toBe(false);
    expect(isComplete("After the shower", "the phone stays out")).toBe(true);
  });

  it("does not count whitespace as a half", () => {
    expect(isComplete("   ", "the phone stays out")).toBe(false);
    expect(isComplete("After the shower", "\t\n ")).toBe(false);
  });
});

describe("readAsSentence", () => {
  it("joins the two halves with a comma", () => {
    expect(
      readAsSentence("After I turn the shower on", "the phone stays in the other room"),
    ).toBe("After I turn the shower on, the phone stays in the other room");
  });

  it("trims what was typed", () => {
    expect(readAsSentence("  After lunch  ", "  I walk first  ")).toBe(
      "After lunch, I walk first",
    );
  });

  it("adds no stray comma when a half is missing", () => {
    expect(readAsSentence("After lunch", "")).toBe("After lunch");
    expect(readAsSentence("", "I walk first")).toBe("I walk first");
    expect(readAsSentence("", "")).toBe("");
  });
});

describe("nextPosition", () => {
  it("starts at zero and then goes after everything", () => {
    expect(nextPosition([])).toBe(0);
    expect(nextPosition([threshold(0), threshold(1)])).toBe(2);
  });

  it("goes to the end even when the numbering has gaps", () => {
    expect(nextPosition([threshold(0), threshold(4)])).toBe(5);
  });
});
