import { describe, expect, it } from "vitest";

import { MARKS } from "./copy";
import { NO_MARKS, marksOf, scoreOf, type Marks } from "./days";
import type { DayRow } from "./supabase/types";

/** A row as the database would hand it back, with the marks overridden. */
function row(marks: Partial<Marks>): DayRow {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    user_id: "11111111-1111-4111-8111-111111111111",
    date: "2026-08-05",
    shower: false,
    meal: false,
    work: false,
    wait: false,
    human: false,
    note: "",
    score: null,
    created_at: "2026-08-05T12:00:00Z",
    updated_at: "2026-08-05T12:00:00Z",
    ...marks,
  };
}

describe("marksOf", () => {
  it("returns all-false when the day was never logged", () => {
    // A missing row is the normal state for a day you did not open, and it
    // must not throw or come back as anything other than five falses.
    expect(marksOf(null)).toEqual(NO_MARKS);
  });

  it("pulls exactly the five marks out of a row and nothing else", () => {
    const marks = marksOf(row({ shower: true, human: true }));

    expect(marks).toEqual({
      shower: true,
      meal: false,
      work: false,
      wait: false,
      human: true,
    });
    // No id, note, timestamps or score leaking into the marks object.
    expect(Object.keys(marks).sort()).toEqual(
      MARKS.map((mark) => mark.key).sort(),
    );
  });
});

describe("scoreOf", () => {
  it("counts nothing as zero", () => {
    expect(scoreOf(NO_MARKS)).toBe(0);
  });

  it("counts everything as five", () => {
    expect(
      scoreOf({
        shower: true,
        meal: true,
        work: true,
        wait: true,
        human: true,
      }),
    ).toBe(5);
  });

  it("counts each mark exactly once, whichever ones they are", () => {
    // Every mark on its own scores one — no mark is weighted differently and
    // none is accidentally ignored.
    for (const mark of MARKS) {
      expect(scoreOf({ ...NO_MARKS, [mark.key]: true })).toBe(1);
    }
  });

  it("agrees with the database's own formula for every combination", () => {
    // All 32 possibilities. The database computes score in a generated column
    // as shower + meal + work + wait + human; if this function ever disagreed,
    // the number on screen would differ from the number in the averages.
    for (let bits = 0; bits < 32; bits++) {
      const marks: Marks = { ...NO_MARKS };
      let expected = 0;

      MARKS.forEach((mark, index) => {
        const on = (bits & (1 << index)) !== 0;
        marks[mark.key] = on;
        if (on) expected++;
      });

      expect(scoreOf(marks)).toBe(expected);
    }
  });
});
