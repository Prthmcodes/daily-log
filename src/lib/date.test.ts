import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDays,
  formatDayLabel,
  fromDateKey,
  isAfter,
  isFuture,
  isValidDateKey,
  lastNKeys,
  toDateKey,
  todayKey,
} from "./date";

/**
 * Run something as if the computer were in a different part of the world.
 *
 * Node re-reads `process.env.TZ` whenever it builds a Date, so setting it
 * mid-run genuinely changes the timezone. That is what lets us test a bug that
 * only appears in New York from a machine sitting in UTC.
 */
function withTimeZone<T>(timeZone: string, run: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return run();
  } finally {
    // `finally` runs even when the test inside fails. Without it, one broken
    // test would leave the wrong timezone set for every test after it.
    if (previous === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previous;
    }
  }
}

/** Freeze the clock at an exact moment. The offset makes it unambiguous. */
function atInstant(isoWithOffset: string): void {
  vi.setSystemTime(new Date(isoWithOffset));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/*
 * The whole reason this file exists. Each of these would be silently wrong if
 * the key came from toISOString().
 */
describe("todayKey uses local time, not UTC", () => {
  it("is still today at 23:59 in New York, four hours behind UTC", () => {
    atInstant("2026-08-05T23:59:00-04:00");

    const key = withTimeZone("America/New_York", todayKey);

    expect(key).toBe("2026-08-05");
    // The bug this guards against, spelled out: in UTC it is already the 6th.
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-08-06");
  });

  it("is already tomorrow at 00:30 in Auckland, twelve hours ahead of UTC", () => {
    atInstant("2026-08-05T00:30:00+12:00");

    const key = withTimeZone("Pacific/Auckland", todayKey);

    expect(key).toBe("2026-08-05");
    // The same bug in the other direction: in UTC it is still the 4th.
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-08-04");
  });

  it("is the right day at 00:01 local", () => {
    atInstant("2026-08-05T00:01:00-04:00");

    expect(withTimeZone("America/New_York", todayKey)).toBe("2026-08-05");
  });

  it("is the right day at 23:59 local in the UK during British Summer Time", () => {
    atInstant("2026-08-05T23:59:00+01:00");

    const key = withTimeZone("Europe/London", todayKey);

    expect(key).toBe("2026-08-05");
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-08-05");
  });
});

describe("toDateKey", () => {
  it("zero-pads single-digit months and days", () => {
    // Month 0 is January. Not a typo — see the comment in date.ts.
    expect(toDateKey(new Date(2026, 0, 9, 12, 0, 0))).toBe("2026-01-09");
  });

  it("handles the last day of the year", () => {
    expect(toDateKey(new Date(2026, 11, 31, 23, 30, 0))).toBe("2026-12-31");
  });
});

/*
 * Clocks moving is the other half of the problem. On these days one local day
 * is 23 or 25 hours long, so anything that steps by "24 hours" drifts.
 */
describe("addDays survives daylight saving transitions", () => {
  it("steps across the UK spring-forward night (29 March 2026)", () => {
    withTimeZone("Europe/London", () => {
      expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
      expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
      expect(addDays("2026-03-30", -1)).toBe("2026-03-29");
      expect(addDays("2026-03-29", -1)).toBe("2026-03-28");
    });
  });

  it("steps across the UK fall-back night (25 October 2026)", () => {
    withTimeZone("Europe/London", () => {
      expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
      expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
      expect(addDays("2026-10-26", -1)).toBe("2026-10-25");
      expect(addDays("2026-10-25", -1)).toBe("2026-10-24");
    });
  });

  it("steps across the US spring-forward night (8 March 2026)", () => {
    withTimeZone("America/New_York", () => {
      expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
      expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    });
  });

  it("steps across the US fall-back night (1 November 2026)", () => {
    withTimeZone("America/New_York", () => {
      expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
      expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    });
  });

  it("rolls over month and year ends", () => {
    withTimeZone("Europe/London", () => {
      expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
      expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
      expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
      // 2028 is a leap year, so 29 February exists.
      expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
      // 2026 is not, so it does not.
      expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    });
  });
});

describe("round-tripping a key through fromDateKey and back", () => {
  const keys = [
    "2026-01-01",
    "2026-03-08", // US clocks forward
    "2026-03-29", // UK clocks forward
    "2026-06-15",
    "2026-10-25", // UK clocks back
    "2026-11-01", // US clocks back
    "2026-12-31",
    "2028-02-29", // leap day
  ];

  const zones = ["Europe/London", "America/New_York", "Pacific/Auckland", "UTC"];

  for (const zone of zones) {
    it(`survives every key in ${zone}`, () => {
      withTimeZone(zone, () => {
        for (const key of keys) {
          expect(toDateKey(fromDateKey(key))).toBe(key);
        }
      });
    });
  }

  it("lands at midday, which is what keeps it clear of any DST boundary", () => {
    withTimeZone("Europe/London", () => {
      expect(fromDateKey("2026-03-29").getHours()).toBe(12);
    });
  });
});

describe("isValidDateKey", () => {
  it("accepts a well-formed real date", () => {
    expect(isValidDateKey("2026-08-05")).toBe(true);
    expect(isValidDateKey("2028-02-29")).toBe(true);
  });

  it("rejects a date that does not exist", () => {
    // JavaScript would quietly turn this into 2 March. We do not.
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("2026-02-29")).toBe(false); // 2026 is not a leap year
  });

  it("rejects anything not shaped like YYYY-MM-DD", () => {
    expect(isValidDateKey("2026-8-5")).toBe(false);
    expect(isValidDateKey("05/08/2026")).toBe(false);
    expect(isValidDateKey("2026-08-05T12:00:00")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
    expect(isValidDateKey("yesterday")).toBe(false);
  });

  it("makes fromDateKey throw rather than return a wrong date", () => {
    expect(() => fromDateKey("2026-02-30")).toThrow();
    expect(() => fromDateKey("nonsense")).toThrow();
  });
});

describe("lastNKeys", () => {
  it("returns consecutive keys, oldest first, ending at the day given", () => {
    withTimeZone("Europe/London", () => {
      expect(lastNKeys(3, "2026-08-05")).toEqual([
        "2026-08-03",
        "2026-08-04",
        "2026-08-05",
      ]);
    });
  });

  it("returns exactly count keys with no repeats across a DST change", () => {
    withTimeZone("Europe/London", () => {
      const keys = lastNKeys(30, "2026-11-05");

      expect(keys).toHaveLength(30);
      expect(new Set(keys).size).toBe(30);
      expect(keys[29]).toBe("2026-11-05");
      expect(keys[0]).toBe("2026-10-07");
      expect(keys).toContain("2026-10-25"); // the 25-hour day
    });
  });

  it("defaults to ending today", () => {
    atInstant("2026-08-05T18:00:00+01:00");

    withTimeZone("Europe/London", () => {
      const keys = lastNKeys(7);

      expect(keys).toHaveLength(7);
      expect(keys[6]).toBe("2026-08-05");
      expect(keys[0]).toBe("2026-07-30");
    });
  });

  it("returns a single key for a count of one", () => {
    expect(lastNKeys(1, "2026-08-05")).toEqual(["2026-08-05"]);
  });
});

describe("comparing days", () => {
  it("orders keys chronologically using plain string comparison", () => {
    expect(isAfter("2026-08-06", "2026-08-05")).toBe(true);
    expect(isAfter("2026-08-05", "2026-08-06")).toBe(false);
    expect(isAfter("2026-08-05", "2026-08-05")).toBe(false);
    // The cases where naive comparison would break if we were not zero-padding.
    expect(isAfter("2026-10-01", "2026-09-30")).toBe(true);
    expect(isAfter("2027-01-01", "2026-12-31")).toBe(true);
  });

  it("treats tomorrow as future and today as not", () => {
    atInstant("2026-08-05T18:00:00+01:00");

    withTimeZone("Europe/London", () => {
      expect(isFuture("2026-08-06")).toBe(true);
      expect(isFuture("2026-08-05")).toBe(false);
      expect(isFuture("2026-08-04")).toBe(false);
    });
  });

  it("still says today is not future at 23:59 in New York", () => {
    atInstant("2026-08-05T23:59:00-04:00");

    withTimeZone("America/New_York", () => {
      expect(isFuture("2026-08-05")).toBe(false);
      expect(isFuture("2026-08-06")).toBe(true);
    });
  });
});

describe("formatDayLabel", () => {
  it("reads the way a person would say it", () => {
    withTimeZone("Europe/London", () => {
      expect(formatDayLabel("2026-08-05")).toBe("Wednesday 5 August");
      expect(formatDayLabel("2026-01-01")).toBe("Thursday 1 January");
    });
  });

  it("gives the same answer regardless of the machine's timezone", () => {
    const london = withTimeZone("Europe/London", () => formatDayLabel("2026-03-29"));
    const newYork = withTimeZone("America/New_York", () => formatDayLabel("2026-03-29"));
    const auckland = withTimeZone("Pacific/Auckland", () => formatDayLabel("2026-03-29"));

    expect(london).toBe("Sunday 29 March");
    expect(newYork).toBe(london);
    expect(auckland).toBe(london);
  });
});
