import { describe, expect, it } from "vitest";

import { UI } from "./copy";
import { lastNKeys } from "./date";
import type { LoggedDay } from "./days";
import { averageWithin, formatAverage } from "./metrics";

/** The seven days ending on 5 August 2026, oldest first. */
const WEEK = lastNKeys(7, "2026-08-05");
const MONTH = lastNKeys(30, "2026-08-05");

/** Build a logged day from a key and a score. */
function day(date: string, score: number): LoggedDay {
  return { date, score };
}

describe("averageWithin", () => {
  it("returns null when nothing in the window was logged", () => {
    // Not zero. "Nothing to average" and "averaged zero" are different things
    // and only one of them is a score.
    expect(averageWithin([], WEEK)).toBeNull();
    expect(averageWithin([day("2026-01-01", 5)], WEEK)).toBeNull();
  });

  it("averages the days that are there, ignoring the ones that are not", () => {
    // Two logged days in a seven-day window, both fives. The answer is 5.0,
    // not 10/7. The five days never opened are not zeroes.
    const days = [day(WEEK[0], 5), day(WEEK[3], 5)];

    expect(averageWithin(days, WEEK)).toBe(5);
  });

  it("counts a deliberate zero, which is the entire point", () => {
    const days = [day(WEEK[0], 4), day(WEEK[1], 0)];

    // 4 and 0 over two logged days is 2. If the zero were being skipped this
    // would come back as 4, and a bad day would cost nothing — which would
    // make the number meaningless.
    expect(averageWithin(days, WEEK)).toBe(2);
  });

  it("tells apart a day scored zero and a day never opened", () => {
    // The same week, twice. In the first, Tuesday was a deliberate zero. In
    // the second, Tuesday was never opened. These must not produce the same
    // number, and the unlogged one must not be punished.
    const withZero = [day(WEEK[0], 4), day(WEEK[1], 0), day(WEEK[2], 4)];
    const withGap = [day(WEEK[0], 4), day(WEEK[2], 4)];

    expect(averageWithin(withZero, WEEK)).toBeCloseTo(2.6667, 3);
    expect(averageWithin(withGap, WEEK)).toBe(4);
  });

  it("ignores days that fall outside the window", () => {
    const inside = day(WEEK[0], 0);
    // One day older than the seven-day window starts.
    const outside = day("2026-07-29", 5);

    expect(averageWithin([inside, outside], WEEK)).toBe(0);
    // The same two days are both inside the thirty-day window.
    expect(averageWithin([inside, outside], MONTH)).toBe(2.5);
  });

  it("survives a zero on the last day of the window", () => {
    // Boundary check at the newest end, where an off-by-one would hide today.
    const days = [day(WEEK[6], 0)];

    expect(averageWithin(days, WEEK)).toBe(0);
  });
});

describe("the thing this app exists for", () => {
  it("barely moves when a good run ends in a zero", () => {
    // Five fives and then a zero. A streak counter would read 0 and the day
    // would feel like a write-off. The average reads 4.2.
    const days = [
      day(WEEK[1], 5),
      day(WEEK[2], 5),
      day(WEEK[3], 5),
      day(WEEK[4], 5),
      day(WEEK[5], 5),
      day(WEEK[6], 0),
    ];

    expect(formatAverage(averageWithin(days, WEEK))).toBe("4.2");
  });

  it("does not punish a week off", () => {
    // Four good days, then nothing logged for the rest of the week because
    // life happened. The average still reflects the days that were lived.
    const days = [
      day(WEEK[0], 4),
      day(WEEK[1], 3),
      day(WEEK[2], 4),
      day(WEEK[3], 5),
    ];

    expect(formatAverage(averageWithin(days, WEEK))).toBe("4.0");
  });
});

describe("formatAverage", () => {
  it("shows one decimal place", () => {
    expect(formatAverage(4)).toBe("4.0");
    expect(formatAverage(2.5)).toBe("2.5");
    expect(formatAverage(25 / 6)).toBe("4.2");
    expect(formatAverage(1 / 3)).toBe("0.3");
  });

  it("shows the placeholder when there is nothing to average", () => {
    expect(formatAverage(null)).toBe(UI.noValue);
    expect(formatAverage(null)).toBe("–");
  });

  it("shows a real zero as a number, not as the placeholder", () => {
    // A day logged as zero has an average of 0.0, and that must not be
    // mistaken for having no data.
    expect(formatAverage(0)).toBe("0.0");
  });
});
